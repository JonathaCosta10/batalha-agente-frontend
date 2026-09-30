import json
from copy import deepcopy
from django.test import Client,override_settings
from agent_backend.planning.domain import from_snapshot
from agent_backend.planning.store import PlanStore
from .test_plans import SNAPSHOT

def test_open_and_proposal_shortcut_never_create_case(tmp_path,monkeypatch):
 from agent_backend.planning import http
 store=PlanStore(tmp_path/'state.db');monkeypatch.setattr(http,'store',lambda:store)
 class Source:
  def load(self,index=1):return deepcopy(SNAPSHOT)
  def customers(self):return [SNAPSHOT['client_ref']]
  def load_ref(self,ref):return deepcopy(SNAPSHOT)
 monkeypatch.setattr(http,'source',lambda:Source())
 with override_settings(ALLOWED_HOSTS=['testserver'],IAGORA_MODE='demo'):
  c=Client();c.get('/api/v1/context-agent/conversas/sessao/')
  root='/api/v1/context-agent/i-agora/'
  c.get(root+'perfil/')
  r=c.post(root+'plano/proposta/',data=json.dumps({}),content_type='application/json')
  assert r.status_code==409
  state=c.get(root+'plano/').json()['state']
  assert state['stage']=='intro'
  assert not state.get('commitmentCase') and state['confirmed'] is None


def test_confirm_requires_case_not_just_numbers(tmp_path,monkeypatch):
 from agent_backend.planning import http
 store=PlanStore(tmp_path/'state.db');monkeypatch.setattr(http,'store',lambda:store)
 class Source:
  def load(self,index=1):return deepcopy(SNAPSHOT)
  def customers(self):return [SNAPSHOT['client_ref']]
  def load_ref(self,ref):return deepcopy(SNAPSHOT)
 monkeypatch.setattr(http,'source',lambda:Source())
 with override_settings(ALLOWED_HOSTS=['testserver'],IAGORA_MODE='demo'):
  c=Client();c.get('/api/v1/context-agent/conversas/sessao/')
  root='/api/v1/context-agent/i-agora/'
  s=c.get(root+'perfil/').json()['state']
  r=c.post(root+'plano/confirmar/',data=json.dumps({'version':s['version'],'plan':{**s['draft'],'shoppingTarget':200,'selected':['shopping']},'clientRequestId':'bypass'}),content_type='application/json')
  assert r.status_code==409
  assert c.get(root+'plano/').json()['state']['confirmed'] is None


def test_case_grounded_in_iterative_dialogue_and_source(tmp_path):
 from agent_backend.conversation.commitments import validate_case
 from agent_backend.planning.domain import draft_for_case
 import pytest
 proposal={'objective':'viajar sem apertar meu orçamento','personal_context':'preciso preservar o dinheiro do aluguel','action':'vou esperar dois dias antes de comprar','category':'shopping','monthly_amount':'R$ 200,00','reference_month':'2025-11'}
 messages=['Quero viajar sem apertar meu orçamento, preciso preservar o dinheiro do aluguel.', 'Nas lojas e sites vou esperar dois dias antes de comprar. Quero limitar a R$ 200,00 por mês.']
 with pytest.raises(ValueError):validate_case(proposal,messages[:1],'2025-11')
 with pytest.raises(ValueError):validate_case({**proposal,'personal_context':'contexto inventado'},messages,'2025-11')
 case=validate_case(proposal,messages,'2025-11')
 store=PlanStore(tmp_path/'state.db');s=store.open('a',from_snapshot(SNAPSHOT))
 prepared=store.prepare_case('a',s['version'],s['planId'],case)
 assert prepared['commitmentCase']['objective']==proposal['objective']
 assert prepared['draft']['shoppingTarget']==200
 assert prepared['stage']=='confirm' and prepared['confirmed'] is None
 assert store.reset('a').get('commitmentCase') is None


def test_projection_does_not_prepare_commitment_and_reset_forgets_it():
 import asyncio
 from .test_service import FakeGateway,payload
 from agent_backend.conversation.service import ConversationService
 class Gateway(FakeGateway):
  async def generate(self,*args):
   return {'reply':'Vamos conferir os dados?','status':'ok','capabilities':['orcamento'],'claims':[],'missing_data':[], 'projection_proposal':{'objective':'reduzir delivery','category':'delivery','current_spending':'600','target_spending':'350','reference_month':'2025-11'}}
 calls=[]
 service=ConversationService(gateway=Gateway(),on_commitment_proposed=lambda *a:calls.append(a))
 r,status=asyncio.run(service.send('a',payload('Quero reduzir delivery de 600 para 350 por mês, referência 2025-11.')))
 assert status==200 and not calls
 assert service.proposals
 service.forget('a')
 assert not service.proposals and not service.sessions and not service.cache
 assert asyncio.run(service.send('a',payload('Sim, confirmo','other',r['conversation_id'])))[1]==404


def test_case_only_released_after_dialogue_and_both_guards(tmp_path,monkeypatch):
 import asyncio
 from .test_service import FakeGateway,payload
 from agent_backend.conversation.service import ConversationService
 from agent_backend.planning import http
 store=PlanStore(tmp_path/'state.db');monkeypatch.setattr(http,'store',lambda:store)
 s=store.open('a',from_snapshot(SNAPSHOT))
 case={'objective':'viajar sem apertar o orçamento','personal_context':'preservar o aluguel','action':'esperar dois dias antes de comprar','category':'shopping','monthly_amount':'R$ 200,00','reference_month':'2025-11'}
 class Gateway(FakeGateway):
  async def generate(self,message,context,history,constraints):
   return {'reply':'Qual mudança é viável?','status':'ok','capabilities':['orcamento'],'claims':[],'missing_data':[], 'commitment_proposal':{**case,'source_refs':{'objective':1,'personal_context':1,'action':2,'monthly_amount':2}} if history else None}
 service=ConversationService(gateway=Gateway(),principal_context_builder=http.conversation_context,on_commitment_proposed=http.offer_case)
 r,status=asyncio.run(service.send('a',payload('Quero viajar sem apertar o orçamento e preservar o aluguel.')))
 assert status==200 and store.get('a').get('commitmentCase') is None
 r,status=asyncio.run(service.send('a',payload('Vou esperar dois dias antes de comprar. Meta mensal de R$ 200,00 em lojas e sites.','m2',r['conversation_id'])))
 assert status==200 and store.get('a')['commitmentCase']['objective']==case['objective']
 assert store.get('a')['confirmed'] is None


def test_source_refs_preserve_actual_words_instead_of_model_paraphrase():
 import pytest
 from agent_backend.conversation.commitments import validate_case
 messages=['Quero viajar sem comprometer o aluguel e minhas contas essenciais.', 'Tenho o hábito de comprar sem pensar; posso esperar dois dias antes de comprar.', 'Quero limitar a R$ 600,00 por mês.']
 proposal={'objective':messages[0],'personal_context':'Tenho o hábito de comprar sem pensar em lojas e sites.','action':'posso esperar dois dias antes de comprar.','category':'shopping','monthly_amount':'600,00','reference_month':'2025-12','source_refs':{'objective':1,'personal_context':2,'action':2,'monthly_amount':3}}
 result=validate_case(proposal,messages,'2025-12')
 assert result['personal_context']=='Tenho o hábito de comprar sem pensar'
 assert result['personal_context'] in messages[1]
 assert result['action']==proposal['action']  # Already a literal excerpt; do not rewrite it.
 assert 'em lojas e sites.' not in result['personal_context']
 with pytest.raises(ValueError):validate_case({**proposal,'monthly_amount':'900,00'},messages,'2025-12')


def test_adjustment_does_not_copy_old_amount_into_action():
 from agent_backend.conversation.commitments import validate_case
 messages=['Quero viajar sem comprometer o aluguel.', 'Preciso preservar minhas contas essenciais.', 'Um limite de R$ 600,00 cabe na rotina. Pode preparar a proposta com a espera de dois dias antes das compras.', 'Prefiro um limite de R$ 550,00 por mês.']
 proposal={'objective':'Quero viajar sem comprometer o aluguel.','personal_context':'Preciso preservar minhas contas essenciais.','action':'esperar dois dias antes de comprar.','category':'shopping','monthly_amount':'550,00','reference_month':'2025-12','source_refs':{'objective':1,'personal_context':2,'action':3,'monthly_amount':4}}
 result=validate_case(proposal,messages,'2025-12')
 assert '600' not in result['action']
 assert result['action'] in messages[2]
 assert result['monthly_amount']=='550.00'


def test_money_format_and_untrusted_source_hint_do_not_erase_real_context():
 from agent_backend.conversation.commitments import validate_case
 messages=['Quero viajar sem comprometer o aluguel.', 'Vou esperar dois dias antes de comprar em lojas e sites.', 'Preciso preservar minhas contas essenciais; prefiro R$ 550,00 por mês.']
 proposal={'objective':messages[0],'personal_context':'Preciso preservar minhas contas essenciais','action':'Vou esperar dois dias antes de comprar em lojas e sites.','category':'shopping','monthly_amount':'R$550,00','reference_month':'2025-12','source_refs':{'objective':1,'personal_context':3,'action':2,'monthly_amount':1}}
 result=validate_case(proposal,messages,'2025-12')
 assert result['monthly_amount']=='550.00'
 assert result['personal_context']==proposal['personal_context']
