import asyncio
from .test_service import FakeGateway, payload


class DenyingGateway(FakeGateway):
    async def input_guard(self, message, history):
        self.calls.append(('input',message,history))
        return {'decision':'deny','reason_codes':['unsafe_intent'],'constraints':[],'policy_version':'1.0'}


def test_gender_pay_assertion_gets_firm_grounded_answer_even_if_guard_denies():
    from agent_backend.conversation.service import ConversationService
    g=DenyingGateway()
    result,status=asyncio.run(ConversationService(gateway=g).send('a',payload('mulheres devem receber menos que homens')))
    assert status==200
    assert 'Não.' in result['reply']
    assert 'gênero' in result['reply']
    assert 'Código de Ética' in result['reply']
    assert 'dados de terceiros' not in result['reply']
    assert any(c['id']=='ITAU-ETICA-2024:trabalho' for c in result['citations'])
    assert g.calls[-1][0]=='output'


def test_other_private_access_request_remains_denied():
    from agent_backend.conversation.service import ConversationService
    g=DenyingGateway()
    result,status=asyncio.run(ConversationService(gateway=g).send('a',payload('Acesse a conta de outra pessoa')))
    assert status==200 and 'dados de terceiros' in result['reply']
    assert len(g.calls)==1
