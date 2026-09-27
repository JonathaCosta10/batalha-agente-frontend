"""Valida, via HTTP real, cada chamada que o front faz ao backend (contrato + encaixe).

Só stdlib. Imita src/services/backend.ts: prefixo /api/v1/context-agent/, cookies de sessão
(credentials:'same-origin'), Content-Type JSON, X-CSRFToken lido do cookie csrftoken e Origin
igual à origem da base (o browser envia Origin em POST/PATCH/DELETE).

Uso:
  .venv/Scripts/python.exe scripts/validar_contrato_local.py                       # via proxy Vite :3000
  .venv/Scripts/python.exe scripts/validar_contrato_local.py --base http://127.0.0.1:8001 --dialogo-live
Saída: agent_backend/evidence/contrato-local-<AAAA-MM-DDTHHMM BRT>[-rotulo].json
Código de saída != 0 se uma chamada esperada-OK falha (status ou forma) ou se uma prova negativa não falha.
Nunca imprime cookies, tokens nem segredos.
"""
import argparse
import http.cookiejar
import json
import subprocess
import sys
import time
import urllib.error
import urllib.request
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
PREFIX = '/api/v1/context-agent/'
BRT = timezone(timedelta(hours=-3))

# ---- Esquemas: derivados dos tipos TS (src/services/backend.ts, src/types/plan.ts) ----------------
NUM = (int, float)


def opt(t):
    return ('opt', t)


def nullable(t):
    return ('null', t)


def listof(t):
    return ('list', t)


def mapof(t):
    return ('map', t)


PLAN = {'income': NUM, 'expenses': NUM, 'deliveryCurrent': NUM, 'deliveryTarget': NUM,
        'shoppingCurrent': NUM, 'shoppingTarget': NUM, 'otherCut': NUM, 'reserveTarget': NUM,
        'selected': listof(str), 'period': opt(str)}
PERSON = {'id': int, 'nome': str, 'primeiroNome': str, 'genero': str, 'plan': PLAN,
          'sourceAvailable': opt(bool), 'referenceLabel': opt(str), 'planPeriodLabel': opt(str), 'sourceLabel': opt(str)}
CASE = {k: str for k in ('objective', 'personal_context', 'action', 'category', 'monthly_amount', 'reference_month', 'source')}
PLAN_STATE = {
    'opening': opt({'message': str, 'phase': str}),
    'commitmentCase': opt(nullable(CASE)),
    'planId': str, 'version': int, 'stage': str, 'draft': PLAN, 'confirmed': nullable(PLAN),
    'confirmedAt': nullable(str), 'phraseIndex': int,
    'profile': {'person': PERSON,
                'referencePeriod': {'label': str, 'seal': {'source': str, 'nature': str, 'measuredAt': opt(str)}},
                'planPeriod': {'label': str}, 'situation': str},
    'totals': mapof(NUM),
}
SCHEMAS = {
    'bootstrap': {'mode': str},
    'profile': {'state': PLAN_STATE},
    'state': {'state': nullable(PLAN_STATE)},
    'open': {'state': PLAN_STATE},
    'propose': {'state': PLAN_STATE},
    'confirm': {'state': PLAN_STATE, 'replayed': bool},
    'progress': {'state': PLAN_STATE},
    'withdraw': {'state': nullable(PLAN_STATE)},
    'reset': {'state': nullable(PLAN_STATE)},
    'chat': {'reply': str, 'conversation_id': nullable(str), 'status': str},
    # Não é chamada pelo front; esquema do backend (planning/http.py followup) só para registo.
    'acompanhamento': {'state': PLAN_STATE, 'items': listof({'category': str, 'spent': nullable(NUM), 'status': str}), 'message': str},
}
# Envelope de erro que o front lê (backend.ts:14): erro|reply (string) e, se houver, state.
ERROR_SCHEMA_PLANNING = {'erro': str, 'state': opt(nullable(PLAN_STATE))}
ERROR_SCHEMA_CONVERSA = {'reply': str}
PLAN_TOTALS = {'deliveryCut', 'shoppingCut', 'otherCut', 'released', 'initial', 'available', 'reserve', 'after'}


def type_ok(value, t):
    if t is NUM:
        return isinstance(value, NUM) and not isinstance(value, bool)
    if t is int:
        return isinstance(value, int) and not isinstance(value, bool)
    return isinstance(value, t)


def check(value, schema, path, report):
    """Preenche report['faltam'|'tipo_errado'|'extra_nao_lidos'|'opcionais_ausentes']."""
    if isinstance(schema, tuple) and len(schema) == 2 and schema[0] in ('opt', 'null', 'list', 'map'):
        kind, inner = schema
        if kind == 'opt':
            return check(value, inner, path, report)
        if kind == 'null':
            return None if value is None else check(value, inner, path, report)
        if kind == 'list':
            if not isinstance(value, list):
                report['tipo_errado'].append(f'{path}: esperado lista, veio {type(value).__name__}')
                return None
            for i, item in enumerate(value):
                check(item, inner, f'{path}[{i}]', report)
            return None
        if not isinstance(value, dict):
            report['tipo_errado'].append(f'{path}: esperado objeto, veio {type(value).__name__}')
            return None
        for k, v in value.items():
            check(v, inner, f'{path}.{k}', report)
        return None
    if isinstance(schema, dict):
        if not isinstance(value, dict):
            report['tipo_errado'].append(f'{path}: esperado objeto, veio {type(value).__name__}')
            return None
        for k, sub in schema.items():
            if k not in value:
                optional = isinstance(sub, tuple) and len(sub) == 2 and sub[0] == 'opt'
                report['opcionais_ausentes' if optional else 'faltam'].append(f'{path}.{k}')
                continue
            check(value[k], sub, f'{path}.{k}', report)
        for k in value:
            if k not in schema:
                report['extra_nao_lidos'].append(f'{path}.{k}')
        return None
    if not type_ok(value, schema):
        name = 'number' if schema is NUM else getattr(schema, '__name__', str(schema))
        report['tipo_errado'].append(f'{path}: esperado {name}, veio {type(value).__name__}')
    return None


def shape(body, schema):
    report = {'faltam': [], 'tipo_errado': [], 'extra_nao_lidos': [], 'opcionais_ausentes': []}
    check(body, schema, '$', report)
    report['ok'] = not report['faltam'] and not report['tipo_errado']
    return report


# ---- Cliente HTTP que imita backend.ts --------------------------------------------------------------
class Client:
    def __init__(self, base, jar=None):
        self.base = base.rstrip('/')
        self.origin = '{0.scheme}://{0.netloc}'.format(urlsplit(self.base))
        self.jar = jar if jar is not None else http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))

    def cookie(self, name):
        return next((c.value for c in self.jar if c.name == name), '')

    def request(self, path, method='GET', data=None, csrf=True, origin=None, timeout=60):
        headers = {'Content-Type': 'application/json', 'Accept': 'application/json'}
        if method != 'GET':
            headers['Origin'] = origin or self.origin
        if csrf:
            headers['X-CSRFToken'] = self.cookie('csrftoken')
        payload = None if data is None else json.dumps(data).encode()
        req = urllib.request.Request(self.base + PREFIX + path, data=payload, method=method, headers=headers)
        started = time.perf_counter()
        try:
            with self.opener.open(req, timeout=timeout) as r:
                status, raw = r.status, r.read()
        except urllib.error.HTTPError as e:
            status, raw = e.code, e.read()
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            return {'status': None, 'latency_ms': round((time.perf_counter() - started) * 1000), 'body': None,
                    'erro_transporte': type(e).__name__}
        latency = round((time.perf_counter() - started) * 1000)
        try:
            body = json.loads(raw)
        except ValueError:
            body = None
        return {'status': status, 'latency_ms': latency, 'body': body}


# ---- Execução ----------------------------------------------------------------------------------------
FRONT = {  # chamador no front (arquivo:linha) e gatilho de UI
    'bootstrap': ('src/services/backend.ts:18', 'usePlanConversation.ts:50 loadProfile (montagem do App; botão "Atualizar" App.tsx:57)'),
    'profile': ('src/services/backend.ts:19', 'usePlanConversation.ts:51 loadProfile, logo após bootstrap'),
    'state': ('src/services/backend.ts:20', 'usePlanConversation.ts:86 sendText, após cada resposta do chat'),
    'open': ('src/services/backend.ts:21', 'usePlanConversation.ts:71 open ← startWith: App.tsx:30 startChat (FAB/atalho Planejamento) e App.tsx:84 next=true'),
    'chat': ('src/services/backend.ts:27', 'usePlanConversation.ts:85 sendText ← ChatScreen onSend (App.tsx:70)'),
    'propose': ('src/services/backend.ts:22', 'SÓ planApi.ts:11 fetchProposal — não importado por nenhum componente (código morto)'),
    'confirm': ('src/services/backend.ts:23', 'usePlanConversation.ts:77 assumeCommitments ← CommitmentsPanel onAssume (App.tsx:73)'),
    'progress': ('src/services/backend.ts:24', 'usePlanConversation.ts:80 progress ← finish (useCardExport, App.tsx:17) e nextPhrase (App.tsx:75)'),
    'withdraw': ('src/services/backend.ts:25', 'usePlanConversation.ts:79 adjustValues ← CommitmentsPanel onAdjust (App.tsx:73)'),
    'reset': ('src/services/backend.ts:26', 'usePlanConversation.ts:88 reset ← "Recomeçar planejamento" (PlanSheet.tsx:23 / ChatScreen onRestart App.tsx:70,80)'),
    'acompanhamento': ('—', 'nenhum: o front não chama i-agora/acompanhamento/'),
}


class Run:
    def __init__(self, client, accept_chat_unavailable):
        self.c = client
        self.calls, self.negatives, self.encaixe = [], [], []
        self.accept_chat_unavailable = accept_chat_unavailable

    def call(self, name, path, method='GET', data=None, expect=(200,), result_if_expected='OK', note=None, error_expected=False):
        r = self.c.request(path, method, data)
        rec = {'nome': name, 'metodo': method, 'caminho': PREFIX + path, 'corpo': data, 'status': r['status'],
               'latency_ms': r['latency_ms'], 'esperado': list(expect), 'front': FRONT.get(name, ('—', '—'))[0],
               'gatilho': FRONT.get(name, ('—', '—'))[1]}
        if r.get('erro_transporte'):
            rec['erro_transporte'] = r['erro_transporte']
        body = r['body']
        if r['status'] in expect and not error_expected:
            rec['forma'] = shape(body, SCHEMAS[name])
        elif body is not None:
            schema = ERROR_SCHEMA_CONVERSA if name == 'chat' or path.startswith('conversas/') else ERROR_SCHEMA_PLANNING
            rec['forma_erro'] = shape(body, schema)
        ok_status = r['status'] in expect
        ok_shape = rec.get('forma', rec.get('forma_erro', {'ok': False}))['ok']
        if name == 'chat' and r['status'] == 503 and self.accept_chat_unavailable:
            rec['resultado'] = 'NAO_MEDIDO'
            rec['nota'] = 'Gemini indisponível neste processo (sem GEMINI_API_KEY): 503 com envelope reply; o front mostra a mensagem.'
        else:
            rec['resultado'] = result_if_expected if (ok_status and ok_shape) else 'FALHA'
        if note:
            rec['nota'] = note if 'nota' not in rec else rec['nota'] + ' ' + note
        if isinstance(body, dict) and name == 'chat':
            rec['resposta_resumo'] = {'status': body.get('status'), 'reply_chars': len(body.get('reply') or '')}
        self.calls.append(rec)
        return rec, body

    def blocked(self, name, method, path, reason):
        self.calls.append({'nome': name, 'metodo': method, 'caminho': PREFIX + path, 'status': None, 'latency_ms': None,
                           'front': FRONT[name][0], 'gatilho': FRONT[name][1], 'resultado': 'BLOQUEADO', 'nota': reason})

    def negative(self, name, client, path, method, data, expect, csrf=True, origin=None):
        r = client.request(path, method, data, csrf=csrf, origin=origin)
        ok = r['status'] == expect
        self.negatives.append({'nome': name, 'metodo': method, 'caminho': PREFIX + path, 'status': r['status'],
                               'esperado': expect, 'latency_ms': r['latency_ms'],
                               'resultado': 'FALHOU_COMO_ESPERADO' if ok else 'NAO_FALHOU_COMO_ESPERADO'})


def live_dialogue(state, limit):
    """Diálogo curto que dá objetivo, contexto, ação e valor mensal em falas distintas (commitments.validate_case)."""
    d = state['draft'] if state else {}
    cur = d.get('deliveryCurrent') or 0
    if cur >= 50:
        target = int(cur * 0.7)
        amount_line = f'Quero que minha meta mensal em delivery e refeições fora seja de R$ {target},00.'
        action = 'Vou cozinhar em casa nos dias úteis em vez de pedir delivery.'
    else:
        target = int((d.get('shoppingCurrent') or 300) * 0.7)
        amount_line = f'Quero que minha meta mensal em lojas e sites seja de R$ {target},00.'
        action = 'Vou esperar dois dias antes de comprar qualquer coisa em lojas e sites.'
    lines = ['Quero juntar dinheiro para uma viagem no fim do ano.',
             'Preciso preservar o aluguel e o mercado, que são essenciais.',
             action, amount_line]
    return lines[:limit]


def autoteste():
    """Prova negativa do verificador de forma: casos ruins sintéticos TÊM de reprovar."""
    good = {'reply': 'x', 'conversation_id': None, 'status': 'ok'}
    cases = [
        ('forma boa passa', shape(good, SCHEMAS['chat'])['ok'] is True),
        ('campo lido em falta reprova', shape({'reply': 'x', 'status': 'ok'}, SCHEMAS['chat'])['ok'] is False),
        ('tipo errado reprova', shape({**good, 'reply': 1}, SCHEMAS['chat'])['ok'] is False),
        ('bool não conta como número', shape({'state': None, 'replayed': 1}, {'state': nullable(PLAN_STATE), 'replayed': bool})['ok'] is False),
        ('estado sem draft reprova', shape({'state': {'planId': 'p'}}, SCHEMAS['profile'])['ok'] is False),
        ('opening ausente é só opcional', 'opening' not in str(shape({'state': {'planId': 'p'}}, SCHEMAS['profile'])['faltam'])),
    ]
    for name, ok in cases:
        print(('OK   ' if ok else 'FALHA') + ' ' + name)
    return 0 if all(ok for _, ok in cases) else 1


def main():
    if '--autoteste' in sys.argv:
        return autoteste()
    ap = argparse.ArgumentParser()
    ap.add_argument('--base', default='http://127.0.0.1:3000')
    ap.add_argument('--mensagem', default='Quero organizar meu orçamento do mês.')
    ap.add_argument('--dialogo-live', action='store_true', help='usa diálogo roteirizado (máx. --max-chat falas)')
    ap.add_argument('--max-chat', type=int, default=4, help='teto de falas no chat (cada fala live = 3 chamadas pagas)')
    ap.add_argument('--aceitar-chat-indisponivel', action='store_true', help='chat 503 vira NAO_MEDIDO em vez de FALHA')
    ap.add_argument('--rotulo', default='')
    ap.add_argument('--out', default='')
    a = ap.parse_args()

    started = datetime.now(BRT)
    client = Client(a.base)
    run = Run(client, a.aceitar_chat_indisponivel)

    # 1-3: carregamento do perfil
    first, boot = run.call('bootstrap', 'conversas/sessao/')
    mode = boot.get('mode') if isinstance(boot, dict) else None
    if first['status'] is None:  # servidor inacessível: não mediu, e diz-o (sem gravar evidência enganosa)
        print(f"NAO_MEDIDO: {a.base} inacessível ({first.get('erro_transporte')}); nenhuma evidência gravada.")
        return 2
    _, prof = run.call('profile', 'i-agora/perfil/', note='Primeira leitura pode ir ao BigQuery (cache 900 s por cliente).')
    _, st = run.call('state', 'i-agora/plano/')
    # 4: abertura (FAB)
    _, opened = run.call('open', 'i-agora/sessao/abertura/', 'POST', {'origem': 'fab', 'next': False}, expect=(201,))
    state = opened.get('state') if isinstance(opened, dict) else None

    # 5-6: chat + releitura do estado (sendText)
    cid = None
    msgs = live_dialogue(state, a.max_chat) if a.dialogo_live else [a.mensagem]
    for i, m in enumerate(msgs[:max(1, a.max_chat)]):
        rec, body = run.call('chat', 'conversas/mensagens/', 'POST',
                             {'schema_version': '1.0', 'conversation_id': cid, 'client_message_id': str(uuid.uuid4()), 'message': m})
        rec['fala'] = i + 1
        if isinstance(body, dict) and body.get('conversation_id'):
            cid = body['conversation_id']
        _, sb = run.call('state', 'i-agora/plano/')
        if isinstance(sb, dict) and sb.get('state'):
            state = sb['state']
        if rec['status'] != 200 or (state and state.get('commitmentCase')):
            break

    case = bool(state and state.get('commitmentCase'))
    # 7: proposta (só planApi.ts, código morto)
    if case:
        run.call('propose', 'i-agora/plano/proposta/', 'POST', {'clientRequestId': str(uuid.uuid4())})
    else:
        run.call('propose', 'i-agora/plano/proposta/', 'POST', {'clientRequestId': str(uuid.uuid4())}, expect=(409,),
                 result_if_expected='BLOQUEADO', error_expected=True,
                 note='Sem commitmentCase (o chat não produziu caso fundamentado): 409 esperado, "Ainda não há proposta para aprovar".')

    # 8-10: confirmar, replay, progresso, acompanhamento
    if case:
        rid = str(uuid.uuid4())
        body = {'version': state['version'], 'plan': state['draft'], 'clientRequestId': rid}
        _, c1 = run.call('confirm', 'i-agora/plano/confirmar/', 'POST', body, expect=(201,))
        _, c2 = run.call('confirm', 'i-agora/plano/confirmar/', 'POST', body, expect=(200,), note='Replay com o mesmo clientRequestId.')
        v1 = (c1 or {}).get('state', {}).get('version')
        v2 = (c2 or {}).get('state', {}).get('version')
        _, now = run.call('state', 'i-agora/plano/')
        vn = ((now or {}).get('state') or {}).get('version')
        run.calls[-2]['replay_sem_duplicar'] = bool((c2 or {}).get('replayed') is True and v1 == v2 == vn)
        if not run.calls[-2]['replay_sem_duplicar']:
            run.calls[-2]['resultado'] = 'FALHA'
        state = (now or {}).get('state') or state
        _, pr = run.call('progress', 'i-agora/plano/', 'PATCH', {'version': state['version'], 'stage': 'card', 'phraseIndex': 1})
        state = (pr or {}).get('state') or state
        run.call('acompanhamento', 'i-agora/acompanhamento/')
    else:
        reason = ('BLOQUEADO: nenhum commitmentCase no estado após o chat — em modo demo o chat é resposta fixa '
                  '(service.py:141-142, gateway=None) e nunca chama on_commitment_proposed.')
        v = state['version'] if state else 0
        run.call('confirm', 'i-agora/plano/confirmar/', 'POST',
                 {'version': v, 'plan': (state or {}).get('draft', {}), 'clientRequestId': str(uuid.uuid4())},
                 expect=(409,), result_if_expected='BLOQUEADO', error_expected=True,
                 note=reason + ' Sonda: 409 "Ainda não há uma proposta construída na conversa".')
        run.blocked('confirm', 'POST', 'i-agora/plano/confirmar/', reason + ' Replay não executável sem 1.ª confirmação.')
        run.calls[-1]['nome'] = 'confirm (replay)'
        run.call('progress', 'i-agora/plano/', 'PATCH', {'version': v, 'stage': 'card', 'phraseIndex': 1},
                 expect=(400,), result_if_expected='BLOQUEADO', error_expected=True,
                 note='Sem plano confirmado: 400 "Confirme o plano antes de avançar" esperado.')
        run.call('acompanhamento', 'i-agora/acompanhamento/', expect=(404,), result_if_expected='BLOQUEADO', error_expected=True,
                 note='Sem plano confirmado: 404 "Nenhum objetivo confirmado" esperado. Rota não usada pelo front.')

    # 11-13: ajustar (withdraw), recomeçar (reset), próximo perfil
    run.call('withdraw', 'i-agora/plano/proposta/', 'DELETE')
    _, rs = run.call('reset', 'i-agora/plano/', 'DELETE')
    before = (((rs or {}).get('state') or state or {}).get('profile') or {}).get('person', {}).get('id')
    _, nx = run.call('open', 'i-agora/sessao/abertura/', 'POST', {'origem': 'fab', 'next': True}, expect=(201,),
                     note='next=true (botão "Testar próximo perfil").')
    after = (((nx or {}).get('state') or {}).get('profile') or {}).get('person', {}).get('id')
    run.calls[-1]['pessoa_antes_depois'] = [before, after]

    # Provas negativas
    run.negative('POST sem X-CSRFToken', client, 'i-agora/sessao/abertura/', 'POST', {'origem': 'fab', 'next': False}, 403, csrf=False)
    run.negative('POST com Origin http://evil.example', client, 'i-agora/sessao/abertura/', 'POST', {'origem': 'fab', 'next': False}, 403,
                 origin='http://evil.example')
    run.negative('perfil sem cookie de sessão', Client(a.base), 'i-agora/perfil/', 'GET', None, 401)
    only_csrf = http.cookiejar.CookieJar()
    for c in client.jar:
        if c.name == 'csrftoken':
            only_csrf.set_cookie(c)
    run.negative('chat com CSRF válido e sem cookie de sessão', Client(a.base, only_csrf), 'conversas/mensagens/', 'POST',
                 {'schema_version': '1.0', 'conversation_id': None, 'client_message_id': str(uuid.uuid4()), 'message': 'oi'}, 401)

    # Encaixe: o que o front lê vs o que veio
    ps = (prof or {}).get('state') or {}
    person = (ps.get('profile') or {}).get('person') or {}
    enc = run.encaixe
    if ps and 'opening' not in ps:
        enc.append({'id': 'opening_ausente', 'achado': 'state.opening não vem do backend; openingReply() cai no texto de fallback "Ainda não recebi os dados…" mesmo com perfil carregado.',
                    'front': 'src/services/backend.ts:3; usePlanConversation.ts:32'})
    if person and person.get('primeiroNome') == person.get('nome'):
        enc.append({'id': 'primeiroNome_igual_nome', 'achado': f'primeiroNome == nome ("{person.get("nome")}"): o cabeçalho do chat e a Home mostram o alias inteiro.',
                    'front': 'ChatScreen.tsx:19,22; HomeScreen.tsx:20'})
    period = (ps.get('draft') or {}).get('period')
    if period:
        enc.append({'id': 'period_cru', 'achado': f'plan.period chega como "{period}" (AAAA-MM); PlanSheet/SharePreview/FollowUp mostram-no cru, enquanto person.planPeriodLabel = "{person.get("planPeriodLabel")}".',
                    'front': 'PlanSheet.tsx:30; SharePreview.tsx:9; FollowUpScreen.tsx:24'})
    tot = ps.get('totals')
    if isinstance(tot, dict):
        enc.append({'id': 'totals_nao_lido', 'achado': f'state.totals vem com {sorted(tot)} (== PlanTotals: {set(tot) == PLAN_TOTALS}) mas o front recalcula com calculations() e não o lê.',
                    'front': 'grep: nenhum uso de .totals em src/'})
    seal = ((ps.get('profile') or {}).get('referencePeriod') or {}).get('seal') or {}
    enc.append({'id': 'measuredAt', 'achado': f'referencePeriod.seal.measuredAt presente: {"measuredAt" in seal}; só planApi.ts:14 (código morto) o lê — a UI não mostra selo/data.',
                'front': 'planApi.ts:14'})
    enc.append({'id': 'commitmentCase', 'achado': f'commitmentCase no estado após o chat: {case}. ' + ('Forma verificada.' if case else 'Sem caso: painel de confirmação (CommitmentsPanel) não é exercitável neste modo.'),
                'front': 'usePlanConversation.ts:31; CommitmentsPanel.tsx:12-17; FollowUpScreen.tsx:33'})

    expected_ok = [c for c in run.calls if c['resultado'] == 'FALHA']
    neg_fail = [n for n in run.negatives if n['resultado'] != 'FALHOU_COMO_ESPERADO']
    summary = {
        'chamadas': len(run.calls),
        'por_resultado': {k: sum(1 for c in run.calls if c['resultado'] == k) for k in sorted({c['resultado'] for c in run.calls})},
        'negativas_ok': len(run.negatives) - len(neg_fail), 'negativas_total': len(run.negatives),
        'falhas': [f"{c['nome']} {c['metodo']} {c['caminho']} status={c['status']}" for c in expected_ok],
        'negativas_que_nao_falharam': [n['nome'] for n in neg_fail],
        'commitment_case': case,
        'latencia_total_ms': sum(c['latency_ms'] or 0 for c in run.calls),
    }
    try:
        commit = subprocess.run(['git', 'rev-parse', '--short', 'HEAD'], cwd=ROOT, capture_output=True, text=True, timeout=10).stdout.strip()
    except OSError:
        commit = 'NAO_MEDIDO'
    out = {'base': a.base, 'mode': mode, 'commit': commit, 'started_at': started.isoformat(timespec='seconds'),
           'finished_at': datetime.now(BRT).isoformat(timespec='seconds'),
           'calls': run.calls, 'negatives': run.negatives, 'encaixe': run.encaixe, 'summary': summary}
    if a.out:
        path = Path(a.out)
    else:
        stem = 'contrato-local-' + started.strftime('%Y-%m-%dT%H%M') + (f'-{a.rotulo}' if a.rotulo else '')
        path = ROOT / 'agent_backend' / 'evidence' / (stem + '.json')
        n = 2
        while path.exists():  # nunca sobrescreve evidência anterior
            path = path.with_name(f'{stem}-{n}.json')
            n += 1
    path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding='utf-8')

    for c in run.calls:
        f = c.get('forma') or c.get('forma_erro') or {}
        print(f"{c['resultado']:<11} {c['metodo']:<6} {c['caminho']:<48} {str(c['status']):<4} {str(c['latency_ms']):>6} ms "
              f"forma={'ok' if f.get('ok') else ('-' if not f else 'FALHA')}"
              + (f" faltam={f['faltam']}" if f.get('faltam') else '') + (f" tipo={f['tipo_errado']}" if f.get('tipo_errado') else ''))
    for n in run.negatives:
        print(f"{n['resultado']:<26} {n['nome']}: {n['status']} (esperado {n['esperado']})")
    print('mode:', mode, '| evidencia:', path.relative_to(ROOT) if path.is_relative_to(ROOT) else path)
    print(json.dumps(summary, ensure_ascii=False))
    return 1 if expected_ok or neg_fail else 0


if __name__ == '__main__':
    sys.exit(main())
