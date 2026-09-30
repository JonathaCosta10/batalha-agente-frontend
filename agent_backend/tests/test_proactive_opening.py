from copy import deepcopy
from .test_plans import SNAPSHOT
from agent_backend.planning.domain import from_snapshot


def test_deficit_opens_with_observed_data_and_specific_question():
 from agent_backend.planning.opening import guided_opening
 s=from_snapshot(SNAPSHOT);o=guided_opening(s)
 assert 'R$ 200,00 acima das entradas' in o['message']
 assert 'novembro de 2025' in o['message']
 assert 'R$ 600,00' in o['message'] and 'refeições fora' in o['message']
 assert 'Uma categoria que podemos avaliar' in o['message']
 assert 'pontual importante' in o['message'] and 'costumam se repetir' in o['message']
 assert 'antes de pensar em um ajuste' in o['message']
 assert 'Vamos buscar um ajuste' not in o['message']
 assert o['message'].count('?')==1
 assert 'este mês' not in o['message']
 assert not s.get('commitmentCase') and s['confirmed'] is None


def test_surplus_does_not_claim_overspending_and_confirmed_goal_resumes():
 from agent_backend.planning.opening import guided_opening
 snap={**deepcopy(SNAPSHOT),'inflows':'4000.00'};s=from_snapshot(snap)
 text=guided_opening(s)['message']
 assert 'R$ 800,00 abaixo das entradas' in text
 assert 'acima das entradas' not in text
 s['confirmed']=s['draft']
 o=guided_opening(s)
 assert o['phase']=='review_confirmed'
 assert 'aprovado' in o['message'] and 'rotina' in o['message']


def test_opening_is_known_to_guard_before_first_short_answer():
 import asyncio
 from .test_service import FakeGateway,payload
 from agent_backend.conversation.service import ConversationService
 gateway=FakeGateway('Qual despesa essencial precisamos preservar?')
 text='Em novembro, saídas acima das entradas. Esse gasto foi de rotina ou excepcional?'
 svc=ConversationService(gateway=gateway,principal_opening_builder=lambda owner:text)
 result,status=asyncio.run(svc.send('owner',payload('Foi de rotina.')))
 assert status==200
 assert gateway.calls[0][2]==[{'role':'model','text':text}]
 assert not svc.proposals
