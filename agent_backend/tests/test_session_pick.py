"""Client drawn at random per session, persisted until the front's own "next profile" rule.

Before: every new session loaded position 1 ("Pessoa 1 da base") -> all visitors saw the same account.
"""
import json,pytest
from agent_backend.planning.domain import NOMES
from django.test import Client,override_settings
from agent_backend.planning import http
from agent_backend.planning.bigquery import BigQuerySource,SourceUnavailable
from agent_backend.planning.store import PlanStore

REFS=['00108ccd-699c-453a-a9f9-a66aad6e03e5','001221d1-3626-45c1-807a-990502adf808','00ac49e5-4660-4214-b994-2122c59e1b92',
      '00cab281-99de-4b37-9c08-62bf796640b1','0a1b2c3d-0000-4000-8000-000000000005']
ROOT='/api/v1/context-agent/i-agora/'
SNAPSHOT_KEYS={'client_ref','index','reference_month','inflows','outflows','categories','seal'}
PROFILE_KEYS={'person','referencePeriod','planPeriod','situation','arrears','debt','recurringIncome','state'}
PERSON_KEYS={'id','idUsuario','nomeSelo','nome','primeiroNome','genero','plan','referenceLabel','planPeriodLabel','sourceAvailable','sourceLabel'}

class Seq:
    """Injected draw: returns the given positions in order (mod n); counts the draws."""
    def __init__(self,*values):self.values=list(values);self.calls=0
    def randrange(self,n):
        v=self.values[self.calls%len(self.values)];self.calls+=1;return v%n

class Source:
    """Same contract as BigQuerySource: catalog of id_usuario + load by id (position is only the catalog index)."""
    def __init__(self,refs=REFS):self.refs=list(refs);self.loaded=[];self.fail=0
    def customers(self):return list(self.refs)
    def load(self,index=1):return self.load_ref(self.refs[(index-1)%len(self.refs)])
    def load_ref(self,ref):
        if self.fail:self.fail-=1;raise SourceUnavailable('BigQuery indisponível (simulado).')
        i=self.refs.index(ref)+1;self.loaded.append(ref)
        return {'client_ref':ref,'index':i,'reference_month':'2025-11','inflows':'3000.00','outflows':'3200.00',
                'categories':{'Delivery':'600.00','Lojas e sites':'450.00'},'seal':{'source':'TEST_FIXTURE','nature':'sintetica','measuredAt':'2026-09-27T00:00:00Z','cache':False}}

@pytest.fixture
def env(tmp_path,monkeypatch):
    store=PlanStore(tmp_path/'state.sqlite3');src=Source();rng=Seq(2,4,1,3,0)
    monkeypatch.setattr(http,'store',lambda:store);monkeypatch.setattr(http,'source',lambda:src);monkeypatch.setattr(http,'RNG',rng,raising=False)
    with override_settings(ALLOWED_HOSTS=['testserver'],IAGORA_MODE='demo'):
        yield store,src,rng

def session():
    c=Client();assert c.get('/api/v1/context-agent/conversas/sessao/').status_code==200;return c

def ref_of(c):
    r=c.get(ROOT+'perfil/');assert r.status_code==200,r.content;return r.json()['state']['profile']['person'],r.json()

def open_(c,**extra):
    r=c.post(ROOT+'sessao/abertura/',json.dumps({'origem':'fab',**extra}),content_type='application/json');assert r.status_code==201,r.content
    return r.json()['person']

def clients_of_new_sessions(n):
    return [ref_of(session())[0]['id'] for _ in range(n)]

# a) new session draws once; profile, retry and opening return the SAME client
def test_new_session_draws_once_and_keeps_client(env):
    store,src,rng=env;c=session()
    first,_=ref_of(c);again,_=ref_of(c);opened=open_(c)
    assert first['id']==again['id']==opened['id']==3  # Seq draws position 2 -> 3rd id
    assert set(src.loaded)=={REFS[2]} and rng.calls==1  # opening re-reads (cached in BigQuerySource) the same id
    with store.connect() as db:assert db.execute('SELECT ref FROM picks').fetchall()==[(REFS[2],)]

def test_retry_after_failed_load_returns_same_drawn_client(env):
    store,src,rng=env;src.fail=1;c=session()
    assert c.get(ROOT+'perfil/').status_code==503          # first attempt fails AFTER the draw
    person,_=ref_of(c)                                       # front's "Tentar de novo"
    assert person['id']==3 and src.loaded==[REFS[2]]        # same id, not redrawn, not a reset

# b) next:true (front's "Testar próximo perfil") draws ANOTHER client, which then persists
def test_next_switches_client_and_new_one_persists(env):
    store,src,rng=env;c=session()
    before,_=ref_of(c);after=open_(c,next=True)
    assert after['id']!=before['id']
    assert ref_of(c)[0]['id']==after['id']==open_(c)['id']
    with store.connect() as db:assert db.execute('SELECT ref FROM picks').fetchone()[0]==REFS[after['id']-1]
    h={'HTTP_X_CSRFTOKEN':c.cookies['csrftoken'].value} if 'csrftoken' in c.cookies else {}
    assert c.delete(ROOT+'plano/',**h).status_code==200     # "Reiniciar" resets the plan, keeps the client
    assert ref_of(c)[0]['id']==after['id']

# c) with the simulated draw, two sessions get different clients
def test_two_sessions_get_different_clients(env):
    assert clients_of_new_sessions(2)==[3,5]

# d) negative proof: the check REJECTS the old rule (fixed index 1 for every session)
def test_negative_proof_fixed_index_is_rejected(env,monkeypatch):
    assert len(set(clients_of_new_sessions(5)))>1
    monkeypatch.setattr(http,'draw_ref',lambda users,exclude=None:users[0])  # old behaviour: always position 1
    fixed=clients_of_new_sessions(5)
    assert fixed==[1]*5
    with pytest.raises(AssertionError):assert len(set(fixed))>1

# e) index always inside [1,total]; next never repeats the current one when total>1
def test_draw_bounds_with_system_random(monkeypatch):
    import random
    monkeypatch.setattr(http,'RNG',random.SystemRandom())
    seen={http.draw_ref(REFS) for _ in range(400)}
    assert seen<=set(REFS) and len(seen)>1
    assert all(http.draw_ref(REFS,exclude=REFS[1])!=REFS[1] for _ in range(200))
    assert http.draw_ref(['only'],exclude='only')=='only'
    for v in range(0,20):
        monkeypatch.setattr(http,'RNG',Seq(v));assert 1<=REFS.index(http.draw_ref(REFS))+1<=len(REFS)

def test_index_in_bounds_over_http(env):
    for _ in range(len(REFS)*2):
        pid=ref_of(session())[0]['id'];assert 1<=pid<=len(REFS)

# shape and identity: same keys as before; nothing invented beyond what the source returns
def test_profile_shape_and_identity_not_invented(env):
    store,src,rng=env;person,payload=ref_of(session())
    assert set(payload)==PROFILE_KEYS and set(person)==PERSON_KEYS
    snap=store.get(store.connect().execute('SELECT owner FROM picks').fetchone()[0])['snapshot']
    assert set(snap)==SNAPSHOT_KEYS
    ref=snap['client_ref']
    assert person['idUsuario']==ref and 'rotulo' not in person  # only the real id, no served label
    assert person['nome']==person['primeiroNome']==NOMES[ref] and person['genero'] is None  # name only from the id's generated entry
    assert person['nomeSelo']['natureza']=='nome_gerado'

def _identity_violations(payload):
    """What the owner forbids in the contract: the invented alias, invented names/genders, fabricated sentinels."""
    text=json.dumps(payload,ensure_ascii=False);p=payload['person'];bad=[]
    if 'da base' in text:bad.append('apelido "da base"')
    if p.get('nome') is not None and p.get('nome')!=NOMES.get(str(p.get('idUsuario'))):bad.append('nome sem fonte')
    if p.get('primeiroNome') is not None and p.get('primeiroNome')!=NOMES.get(str(p.get('idUsuario'))):bad.append('nome sem fonte')
    if p.get('genero') is not None:bad.append('genero sem fonte')
    if 'NAO_INFORMADO' in text:bad.append('NAO_INFORMADO como dado')
    if 'rotulo' in p or 'Cliente ' in text:bad.append('rotulo servido')
    return bad

def test_no_invented_identity_and_negative_proof(env):
    person,payload=ref_of(session());opened=open_(session())
    assert _identity_violations(payload)==[] and _identity_violations({'person':opened})==[]
    legacy={'person':{'id':1,'nome':'Pessoa 1 da base','primeiroNome':'Pessoa 1 da base','genero':'NAO_INFORMADO'}}  # old contract
    assert set(_identity_violations(legacy))>={'apelido "da base"','nome sem fonte','genero sem fonte','NAO_INFORMADO como dado'}
    csv_like={'person':{'idUsuario':REFS[0],'nome':'Zzz','primeiroNome':'Maria','genero':'F'}}  # CSV nome/genero
    assert set(_identity_violations(csv_like))=={'nome sem fonte','genero sem fonte'}

def test_source_failure_is_clear_structured_503_never_generic_profile(env):
    store,src,rng=env;src.fail=1
    r=session().get(ROOT+'perfil/');data=r.json()
    assert r.status_code==503 and data['erro']=='perfil_indisponivel' and data['motivo'] and 'person' not in data
    src.refs=[]  # no id_usuario in the catalog
    for r in (session().get(ROOT+'perfil/'),session().post(ROOT+'sessao/abertura/','{}',content_type='application/json')):
        assert r.status_code==503 and r.json()['erro']=='perfil_indisponivel' and 'person' not in r.json()

def test_bigquery_load_ref_queries_by_id_usuario():
    class BQ(BigQuerySource):
        def __init__(self):super().__init__(mapping_path='x');self.params=[]
        def customers(self):
            self.cache['mapping']={'customer':'id_usuario','period':'anomes','period_type':'INTEGER','amount':'vlr','category':'nom_cate_macro',
                                   'direction':'tipo','inflow_labels':['e'],'outflow_labels':['s'],'location':'US'}
            return REFS[:2]
        def query(self,sql,params,location):
            self.params.append(params)
            return [{'period':'2025-11','category':'Delivery','inflows':'10','outflows':'5','invalid':'0'}],{'source':'T','nature':'sintetica'}
    bq=BQ();snap=bq.load_ref(REFS[1])
    assert set(snap)==SNAPSHOT_KEYS and snap['client_ref']==REFS[1] and snap['index']==2 and 'alias' not in snap
    assert 'da base' not in json.dumps(snap)
    assert bq.params[-1]['customer']==REFS[1]                                         # @customer = id_usuario
    assert BQ().load(2)['client_ref']==REFS[1] and BQ().load(3)['client_ref']==REFS[0]   # legacy position API kept
    with pytest.raises(SourceUnavailable):BQ().load_ref('not-in-catalog')
