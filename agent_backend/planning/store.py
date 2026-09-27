"""SQLite persistent goals, atomic confirmation and optimistic concurrency."""
import hashlib,json,sqlite3
from pathlib import Path
from datetime import datetime, timezone
from .domain import validate_plan, totals

class Conflict(ValueError): pass

class PlanStore:
    def __init__(self,path):
        self.path=Path(path);self.path.parent.mkdir(parents=True,exist_ok=True)
        with self.connect() as db:
            db.executescript('CREATE TABLE IF NOT EXISTS plans(owner TEXT,ref TEXT,state TEXT,PRIMARY KEY(owner,ref)); CREATE TABLE IF NOT EXISTS active(owner TEXT PRIMARY KEY,ref TEXT); CREATE TABLE IF NOT EXISTS replay(owner TEXT,id TEXT,digest TEXT,response TEXT,PRIMARY KEY(owner,id)); CREATE TABLE IF NOT EXISTS picks(owner TEXT PRIMARY KEY,ref TEXT NOT NULL);')
        self.path.chmod(0o600)
    def connect(self):
        db=sqlite3.connect(self.path,timeout=5);db.execute('PRAGMA foreign_keys=ON');return db
    def _get(self,db,owner):
        row=db.execute('SELECT p.state FROM plans p JOIN active a ON p.owner=a.owner AND p.ref=a.ref WHERE p.owner=?',(owner,)).fetchone()
        return json.loads(row[0]) if row else None
    def _put(self,db,owner,state):
        state['totals']=totals(state['confirmed'] or state['draft'])
        db.execute('INSERT OR REPLACE INTO plans VALUES(?,?,?)',(owner,state['snapshot']['client_ref'],json.dumps(state,allow_nan=False)))
    def get(self,owner):
        with self.connect() as db:return self._get(db,owner)
    def pick(self,owner,ref):
        """Session's drawn id_usuario: keeps the stored one; stores `ref` only when none exists."""
        with self.connect() as db:
            db.execute('BEGIN IMMEDIATE');db.execute('INSERT OR IGNORE INTO picks VALUES(?,?)',(owner,str(ref)))
            return db.execute('SELECT ref FROM picks WHERE owner=?',(owner,)).fetchone()[0]
    def repick(self,owner,ref):
        """Explicit new-client rule (front's next profile): replaces the session's id_usuario."""
        with self.connect() as db:
            db.execute('BEGIN IMMEDIATE');db.execute('INSERT OR REPLACE INTO picks VALUES(?,?)',(owner,str(ref)));return str(ref)
    def open(self,owner,state):
        ref=state['snapshot']['client_ref']
        with self.connect() as db:
            db.execute('BEGIN IMMEDIATE')
            db.execute('INSERT OR REPLACE INTO active VALUES(?,?)',(owner,ref))
            existing=self._get(db,owner)
            if existing:return existing
            self._put(db,owner,state);return state
    def prepare_case(self,owner,version,plan_id,case):
        from .domain import draft_for_case
        with self.connect() as db:
            db.execute('BEGIN IMMEDIATE');s=self._get(db,owner)
            if not s or s['planId']!=plan_id or s['version']!=version or s['confirmed']:
                raise Conflict('A conversa mudou. Reavalie a proposta no planejamento atual.')
            if case['reference_month']!=s['snapshot']['reference_month']:raise ValueError('Referência inválida.')
            s['draft']=draft_for_case(s['draft'],case)
            s['commitmentCase']={**case,'source':s['snapshot']['seal']['source']}
            s['stage']='confirm';s['version']+=1
            self._put(db,owner,s);return s
    def withdraw_case(self,owner):
        with self.connect() as db:
            db.execute('BEGIN IMMEDIATE');s=self._get(db,owner)
            if s and not s['confirmed'] and (s.get('commitmentCase') or s['stage']=='confirm'):
                s.pop('commitmentCase',None);s['stage']='invite';s['version']+=1;self._put(db,owner,s)
            return s
    def adjust(self,owner,version,changes):
        if set(changes)-{'deliveryTarget','shoppingTarget','otherCut','reserveTarget','selected'}:raise ValueError('Só metas podem ser ajustadas; não os dados observados.')
        with self.connect() as db:
            db.execute('BEGIN IMMEDIATE');s=self._get(db,owner)
            if not s:raise ValueError('Escolha um cliente primeiro.')
            if s['version']!=version:raise Conflict('O plano mudou. Recarregue antes de ajustar.')
            if s['confirmed']:raise Conflict('Já existe plano confirmado; recomece explicitamente para alterá-lo.')
            s['draft']=validate_plan({**s['draft'],**changes});s['stage']='confirm';s['version']+=1
            self._put(db,owner,s);return s
    def confirm(self,owner,rid,version,plan):
        digest=hashlib.sha256(json.dumps({'version':version,'plan':plan},sort_keys=True,allow_nan=False).encode()).hexdigest()
        with self.connect() as db:
            db.execute('BEGIN IMMEDIATE')
            row=db.execute('SELECT digest,response FROM replay WHERE owner=? AND id=?',(owner,rid)).fetchone()
            if row:
                if row[0]!=digest:raise Conflict('Identificador já utilizado para outro conteúdo.')
                previous=json.loads(row[1]);active=self._get(db,owner)
                if not active or active['planId']!=previous['state']['planId']:raise Conflict('Este envio pertence a um planejamento encerrado. Confira o plano atual.')
                return {**previous,'replayed':True}
            s=self._get(db,owner)
            if not s:raise ValueError('Escolha um cliente primeiro.')
            if s['version']!=version:raise Conflict('O plano mudou. Confira os dados atuais.')
            if s['confirmed']:raise Conflict('Plano já confirmado. Recomece explicitamente para substituí-lo.')
            p=validate_plan(plan)
            if not p['selected']:raise ValueError('Selecione pelo menos um compromisso.')
            for key in ('income','expenses','deliveryCurrent','shoppingCurrent','period'):
                if p.get(key)!=s['draft'].get(key):raise ValueError('A base observada não pode ser modificada na confirmação.')
            t=totals(p)
            if p['otherCut']>max(0,p['expenses']-p['deliveryCurrent']-p['shoppingCurrent']):raise ValueError('Outros gastos não podem duplicar as categorias delivery e lojas/sites.')
            if t['released']>p['expenses']:raise ValueError('A redução não pode superar o gasto observado.')
            if t['reserve']>max(0,t['available']):raise ValueError('A reserva proposta supera a disponibilidade deste cenário. Ajuste o plano.')
            s.update(draft=p,confirmed=p,confirmedAt=datetime.now(timezone.utc).isoformat(),stage='card',version=s['version']+1)
            self._put(db,owner,s);response={'state':s,'replayed':False}
            db.execute('INSERT INTO replay VALUES(?,?,?,?)',(owner,rid,digest,json.dumps(response)))
            return response
    def progress(self,owner,version,changes):
        if set(changes)-{'stage','phraseIndex'}:raise ValueError('Campos não permitidos.')
        with self.connect() as db:
            db.execute('BEGIN IMMEDIATE');s=self._get(db,owner)
            if not s or s['version']!=version:raise Conflict('Plano desatualizado.')
            if not s['confirmed']:raise ValueError('Confirme o plano antes de avançar.')
            if changes.get('stage',s['stage']) not in ('card','finish'):raise ValueError('Etapa inválida.')
            if 'phraseIndex' in changes and (type(changes['phraseIndex'])!=int or not 0<=changes['phraseIndex']<=10000):raise ValueError('Frase inválida.')
            s.update(changes);s['version']+=1;self._put(db,owner,s);return s
    def admit_call(self,owner,day,limit):
        with self.connect() as db:
            db.execute('CREATE TABLE IF NOT EXISTS budget(day TEXT PRIMARY KEY, n INTEGER)')
            db.execute('BEGIN IMMEDIATE')
            n=db.execute('SELECT n FROM budget WHERE day=?',(day,)).fetchone()
            count=n[0] if n else 0
            if count>=limit:raise RuntimeError('Daily provider call budget exhausted')
            db.execute('INSERT OR REPLACE INTO budget VALUES(?,?)',(day,count+1))
            return count+1
    def reset(self,owner):
        from .domain import from_snapshot
        with self.connect() as db:
            db.execute('BEGIN IMMEDIATE');s=self._get(db,owner)
            if not s:return None
            new=from_snapshot(s['snapshot']);new['version']=s['version']+1
            self._put(db,owner,new);return new
