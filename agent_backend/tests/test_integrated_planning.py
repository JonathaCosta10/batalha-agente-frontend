import json,pytest
from copy import deepcopy
from .test_plans import SNAPSHOT
from agent_backend.planning.domain import from_snapshot
from agent_backend.planning.gcs_store import GCSPlanStore
from agent_backend.planning.store import Conflict

class Reply:
 def __init__(self,code,data=None,content=b''):self.status_code=code;self.data=data or {};self.content=content;self.ok=200<=code<300
 def json(self):return self.data
class Storage:
 def __init__(self):self.objects={};self.conflict=False
 def get(self,url,params=None,timeout=None):
  from urllib.parse import unquote
  key=unquote(url.split('/o/')[1]);item=self.objects.get(key)
  if not item:return Reply(404)
  gen,blob=item
  return Reply(200,{'generation':str(gen),'size':str(len(blob))},blob)
 def post(self,url,params,headers,data,timeout):
  key=params['name'];gen=self.objects.get(key,(0,b''))[0]
  if self.conflict or str(gen)!=params['ifGenerationMatch']:return Reply(412)
  self.objects[key]=(gen+1,data);return Reply(200,{'generation':str(gen+1)})

def test_gcs_survives_new_instance_without_shared_disk_and_isolates():
 session=Storage();store=GCSPlanStore('test',session);s=store.open('a',from_snapshot(SNAPSHOT))
 p={**s['draft'],'shoppingTarget':200,'selected':['shopping']}
 r=store.confirm('a','r1',s['version'],p)
 new=GCSPlanStore('test',session)
 assert new.get('a')['confirmed']==p
 assert new.get('b') is None
 assert new.confirm('a','r1',s['version'],p)['replayed']
 session.conflict=True
 with pytest.raises(Conflict):new.reset('a')
 assert new.get('a')['confirmed']==p

def test_persistent_budget_survives_runtime_reset():
 session=Storage();store=GCSPlanStore('test',session)
 assert store.admit_call('budget','2026-09-27',2)==1
 assert GCSPlanStore('test',session).admit_call('budget','2026-09-27',2)==2
 with pytest.raises(RuntimeError):GCSPlanStore('test',session).admit_call('budget','2026-09-27',2)

def test_http_full_goal_csrf_idempotency_and_isolation(tmp_path,monkeypatch):
 from django.test import Client,override_settings
 from agent_backend.planning import http
 from agent_backend.planning.store import PlanStore
 store=PlanStore(tmp_path/'state.sqlite3');monkeypatch.setattr(http,'store',lambda:store)
 class Source:
  def load(self,index=1):return deepcopy(SNAPSHOT)
  def customers(self):return [SNAPSHOT['client_ref']]
  def load_ref(self,ref):return deepcopy(SNAPSHOT)
 monkeypatch.setattr(http,'source',lambda:Source())
 prefix='/api/v1/context-agent/i-agora/'
 with override_settings(ALLOWED_HOSTS=['testserver'],IAGORA_MODE='demo'):
  c=Client(enforce_csrf_checks=True);assert c.get(prefix+'plano/').status_code==401
  assert c.get('/api/v1/context-agent/conversas/sessao/').status_code==200
  s=c.get(prefix+'perfil/').json()['state'];assert 'snapshot' not in s
  # Trusted server preparation after dialogue; the HTTP client cannot create this case.
  with store.connect() as db:owner=db.execute('SELECT owner FROM active').fetchone()[0]
  s=store.prepare_case(owner,s['version'],s['planId'],{'objective':'organizar meus gastos','personal_context':'preservar despesas essenciais','action':'cozinhar em casa nos dias úteis','category':'delivery','monthly_amount':'350.00','reference_month':'2025-11'})
  p=s['draft']
  body={'version':s['version'],'plan':p,'clientRequestId':'c1'}
  assert c.post(prefix+'plano/confirmar/',json.dumps(body),content_type='application/json').status_code==403
  h={'HTTP_X_CSRFTOKEN':c.cookies['csrftoken'].value}
  assert c.post(prefix+'plano/confirmar/',json.dumps(body),content_type='application/json',HTTP_ORIGIN='https://evil.example',**h).status_code==403
  r=c.post(prefix+'plano/confirmar/',json.dumps(body),content_type='application/json',**h);assert r.status_code==201
  r=c.post(prefix+'plano/confirmar/',json.dumps(body),content_type='application/json',**h);assert r.status_code==200 and r.json()['replayed']
  assert c.get(prefix+'acompanhamento/').json()['items'][0]['spent'] is None
  assert c.get(prefix+'plano/').json()['state']['confirmed']==p
  other=Client();other.get('/api/v1/context-agent/conversas/sessao/')
  assert other.get(prefix+'plano/').json()['state'] is None

def test_bq_query_enforces_dry_run_and_parameters():
 from agent_backend.planning.bigquery import BigQuerySource,SourceUnavailable
 class Source(BigQuerySource):
  def _call(self,method,path,**kwargs):
   self.seen.append(kwargs['json'])
   if path.endswith('/jobs'):return {'statistics':{'query':{'totalBytesProcessed':'100000001'}}}
   pytest.fail('Must not run over-budget query')
 s=Source();s.seen=[]
 with pytest.raises(SourceUnavailable):s.query('SELECT @customer',{'customer':"x' OR true --"},'us-central1')
 query=s.seen[0]['configuration']['query']
 assert query['query']=='SELECT @customer'
 assert query['queryParameters'][0]['parameterValue']['value']=="x' OR true --"
 assert s.seen[0]['configuration']['dryRun'] is True
