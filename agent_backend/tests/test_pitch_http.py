import json
from copy import deepcopy
from django.test import Client,override_settings
from .test_plans import SNAPSHOT
from .test_service import FakeGateway
from agent_backend.planning import http
from agent_backend.planning.store import PlanStore
from agent_backend.conversation import http as conversation_http
from agent_backend.conversation.service import ConversationService


def test_opening_route_requires_csrf_profile_and_rejects_customer_override(tmp_path,monkeypatch):
 store=PlanStore(tmp_path/'state.sqlite3');monkeypatch.setattr(http,'store',lambda:store)
 class Source:
  def customers(self):return [SNAPSHOT['client_ref']]
  def load_ref(self,ref):return deepcopy(SNAPSHOT)
 monkeypatch.setattr(http,'source',lambda:Source())
 svc=ConversationService(gateway=FakeGateway('Vamos entender as compras desse período. Houve alguma compra pontual?'),principal_context_builder=http.conversation_context)
 monkeypatch.setattr(conversation_http,'get_service',lambda:svc)
 url='/api/v1/context-agent/conversas/abertura/'
 body=json.dumps({'client_request_id':'opening-http'})
 with override_settings(ALLOWED_HOSTS=['testserver'],IAGORA_MODE='demo',IAGORA_DETAILED_CONTEXT=False):
  c=Client(enforce_csrf_checks=True);c.get('/api/v1/context-agent/conversas/sessao/')
  assert c.post(url,body,content_type='application/json').status_code==403
  headers={'HTTP_X_CSRFTOKEN':c.cookies['csrftoken'].value}
  assert c.post(url,body,content_type='application/json',**headers).status_code==409
  profile=c.get('/api/v1/context-agent/i-agora/perfil/').json()
  # No "Pessoa N" placeholder: the name is the one generated for the id_usuario, or None when there is none.
  assert 'Pessoa' not in (profile['person']['nome'] or '')
  r=c.post(url,body,content_type='application/json',**headers)
  assert r.status_code==200 and r.json()['conversation_id']
  assert c.post(url,json.dumps({'client_request_id':'x','customer_id':'other'}),content_type='application/json',**headers).status_code==400
  assert c.post(url,body,content_type='application/json',HTTP_ORIGIN='https://evil.example',**headers).status_code==403
