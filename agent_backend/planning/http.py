"""Planning endpoints share the signed session and CSRF boundary with conversation."""
import json,os,random,re
from functools import lru_cache
from pathlib import Path
from django.http import JsonResponse
from .bigquery import BigQuerySource, SourceUnavailable
from .domain import from_snapshot
from .opening import guided_opening
from .store import PlanStore, Conflict
from agent_backend.conversation.http import principal_for

@lru_cache(maxsize=1)
def store():
    if os.environ.get('IAGORA_STATE_BUCKET'):
        from .gcs_store import GCSPlanStore
        return GCSPlanStore(os.environ['IAGORA_STATE_BUCKET'])
    return PlanStore(os.environ.get('IAGORA_PLAN_DB','/tmp/i-agora-plans.sqlite3'))
@lru_cache(maxsize=1)
def source():return BigQuerySource()

# Client choice per session: a random draw (not a fixed "Pessoa 1" for every visitor),
# persisted server-side per owner until the front's own "next profile" rule asks for another.
RNG=random.SystemRandom()  # injection point: tests replace it with a fake exposing randrange(n).

def catalog():
    # Identification call: the same DISTINCT id_usuario query load() already needs, with dry-run,
    # 100 MB cap and 15 min cache in BigQuerySource.customers(). No extra paid query per visitor.
    users=list(source().customers())
    if not users:raise SourceUnavailable('Nenhum cliente em mês encerrado foi encontrado.')
    return users

def draw_ref(users,exclude=None):
    """Uniform id_usuario from the catalog, different from `exclude` whenever the catalog allows it."""
    options=[u for u in users if u!=exclude] or list(users)
    return options[RNG.randrange(len(options))]

def session_ref(principal):
    """id_usuario already chosen for this session, or a new random one stored BEFORE any load (retry-safe)."""
    users=catalog();ref=store().pick(principal,draw_ref(users))
    if ref not in users:ref=store().repick(principal,draw_ref(users))  # catalog changed: the old id no longer exists
    return ref

def public(s):
    if s is None:return None
    # state.opening: the front shows it on the i-agora click; without it the front falls back to "Ainda não recebi os dados…".
    return {**{k:v for k,v in s.items() if k!='snapshot'},'opening':guided_opening(s)}

def response(data,status=200):
    r=JsonResponse(data,status=status);r['Cache-Control']='no-store';r['X-Content-Type-Options']='nosniff';return r

def body(request):
    if request.content_type!='application/json' or len(request.body)>16000:raise ValueError('Use JSON de até 16 KB.')
    data=json.loads(request.body)
    if not isinstance(data,dict):raise ValueError('Corpo inválido.')
    return data

def endpoint(view):
    def wrapped(request,*args,**kwargs):
        principal=principal_for(request)
        if not principal:return response({'erro':'Sessão não autorizada. Reabra a conversa.','codigo':'auth'},401)
        try:return view(request,principal,*args,**kwargs)
        except SourceUnavailable as e:return response({'erro':str(e),'estado':'NAO_MEDIDO','codigo':'source'},503)
        except Conflict as e:return response({'erro':str(e),'codigo':'stale','state':public(store().get(principal))},409)
        except (ValueError,TypeError,KeyError) as e:return response({'erro':str(e)[:200] or 'Dados inválidos.','codigo':'schema'},400)
        except Exception:return response({'erro':'Não foi possível concluir a operação. Nada foi confirmado.','codigo':'technical'},503)
    return wrapped

def profile_source(view):
    """Profile/opening never answer with an empty or generic person: source failure is a clear 503."""
    def wrapped(request,principal,*args,**kwargs):
        try:return view(request,principal,*args,**kwargs)
        except SourceUnavailable as e:
            return response({'erro':'perfil_indisponivel','motivo':str(e),'estado':'NAO_MEDIDO','codigo':'source'},503)
    return wrapped

@endpoint
@profile_source
def profile(request,principal):
    if request.method!='GET':return response({'erro':'Método não permitido.'},405)
    state=store().get(principal)
    if not state:state=store().open(principal,from_snapshot(source().load_ref(session_ref(principal))))
    return response({**state['profile'],'state':public(state)})

@endpoint
@profile_source
def opening(request,principal):
    if request.method!='POST':return response({'erro':'Método não permitido.'},405)
    data=body(request)
    if set(data)-{'origem','next'}:raise ValueError('Campos não permitidos.')
    current=store().get(principal);ref=current['snapshot']['client_ref'] if current else session_ref(principal)
    if data.get('next') is True:
        from agent_backend.conversation.http import get_service
        get_service().forget(principal)
        ref=store().repick(principal,draw_ref(catalog(),exclude=ref))
    state=store().open(principal,from_snapshot(source().load_ref(ref)))
    return response({'person':state['profile']['person'],'state':public(state)},201)

@endpoint
def plan(request,principal):
    if request.method=='GET':return response({'state':public(store().get(principal))})
    if request.method=='DELETE':
        from agent_backend.conversation.http import get_service
        get_service().forget(principal)
        return response({'state':public(store().reset(principal))})
    if request.method=='PATCH':
        data=body(request);version=data.pop('version')
        return response({'state':public(store().progress(principal,version,data))})
    return response({'erro':'Método não permitido.'},405)

@endpoint
def proposal(request,principal):
    if request.method=='DELETE':return response({'state':public(store().withdraw_case(principal))})
    if request.method!='POST':return response({'erro':'Método não permitido.'},405)
    body(request);s=store().get(principal)
    if not s:raise SourceUnavailable('Carregue a base do cliente antes de propor metas.')
    if not s.get('commitmentCase'):
        raise Conflict('Vamos conversar primeiro sobre seu objetivo, contexto e uma mudança viável. Ainda não há proposta para aprovar.')
    return response({'state':public(s),'basis':{'rule':'conversation_grounded_case','seal':s['snapshot']['seal']}})

@endpoint
def adjust(request,principal):
    if request.method!='PATCH':return response({'erro':'Método não permitido.'},405)
    raise Conflict('Ajuste a proposta pela conversa para manter objetivo, ação e valor coerentes.')

@endpoint
def confirm(request,principal):
    if request.method!='POST':return response({'erro':'Método não permitido.'},405)
    data=body(request)
    if set(data)!={'clientRequestId','version','plan'} or not re.fullmatch(r'[A-Za-z0-9_-]{1,80}',data['clientRequestId']):raise ValueError('Confirmação inválida.')
    state=store().get(principal)
    if not state or not state.get('commitmentCase'):raise Conflict('Ainda não há uma proposta construída na conversa para aprovar.')
    if data['plan']!=state['draft']:raise ValueError('A aprovação precisa corresponder à proposta apresentada. Peça o ajuste pela conversa.')
    result=store().confirm(principal,data['clientRequestId'],data['version'],data['plan'])
    return response({**result,'state':public(result['state'])},200 if result['replayed'] else 201)

@endpoint
def followup(request,principal):
    if request.method!='GET':return response({'erro':'Método não permitido.'},405)
    state=store().get(principal)
    if not state or not state['confirmed']:return response({'erro':'Nenhum objetivo confirmado.'},404)
    p=state['confirmed']
    return response({'state':public(state),'items':[{'category':c,'spent':None,'status':'NAO_MEDIDO'} for c in p['selected']],
        'message':'Objetivos registrados. Evolução depende de novos movimentos comparáveis; nenhum progresso foi inventado.'})


def conversation_context(principal):
    from agent_backend.conversation.context import build_context
    context=build_context();s=store().withdraw_case(principal)
    if not s:return context
    snap=s['snapshot'];p=s['profile'];context['financial_period']=snap['reference_month']
    context['financial_profile']={'situation':p['situation'],'source':snap['seal'],'inflows_are_not_recurring_income':True,'arrears':None,'debt':None}
    values={'inflows':snap['inflows'],'outflows':snap['outflows'],'cash_flow':str(p['referencePeriod']['balance']),**{'category:'+k:v for k,v in snap['categories'].items()}}
    context['facts'].extend({'id':'BQ:'+k,'value':str(v),'origin':snap['seal']['source'],'period':snap['reference_month']} for k,v in values.items())
    context['financial_input_basis']='; '.join([snap['reference_month']]+[f'{k}: R$ {v.replace(".",",")} por mês' for k,v in snap['categories'].items()])
    group=s['draft']['deliveryCurrent']
    context['facts'].append({'id':'BQ:group_delivery_restaurants','value':str(group),'origin':'deterministic_sum_of_Delivery_and_Restaurantes','period':snap['reference_month']})
    context['financial_input_basis']+=f'; Delivery e refeições fora: R$ {group:.2f} por mês'.replace('.',',')
    context['goal_state']={'planId':s['planId'],'version':s['version'],'commitment_case':s.get('commitmentCase'),'draft':s['draft'],'confirmed':s['confirmed'],'confirmed_at':s['confirmedAt'],'source':'persistent_server_plan'}
    return context


def offer_case(principal,case,plan_id,version):
    return store().prepare_case(principal,version,plan_id,case)
