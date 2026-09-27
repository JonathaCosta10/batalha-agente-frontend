import asyncio
from decimal import Decimal
import pytest
from .test_service import FakeGateway, payload


def test_compound_example_and_minimal_integer_months():
    from agent_backend.conversation.projection import project
    result = project('600.00', '350.00')
    assert result['n_5'] == 11 and result['n_8'] == 7
    for rate, key in [('0.05', 'n_5'), ('0.08', 'n_8')]:
        n = result[key]
        assert Decimal('600') * (1-Decimal(rate)) ** n <= Decimal('350')
        assert Decimal('600') * (1-Decimal(rate)) ** (n-1) > Decimal('350')


@pytest.mark.parametrize('current,target,expected', [('350','350','already'),('0','0','already'),('200','350','already'),('600','0','zero_target')])
def test_projection_edges(current, target, expected):
    from agent_backend.conversation.projection import project
    assert project(current, target)['status'] == expected


@pytest.mark.parametrize('current,target', [('-1','2'),('2','-1'),('NaN','2'),('Infinity','2'),('','2')])
def test_invalid_projection_values(current, target):
    from agent_backend.conversation.projection import project
    with pytest.raises(ValueError): project(current, target)


MESSAGE = 'Quero reduzir delivery. Gasto R$ 600 por mês e quero chegar a R$ 350 por mês, referência setembro de 2026.'
PROPOSAL = {'objective': 'reduzir delivery', 'category': 'delivery', 'current_spending': 'R$ 600', 'target_spending': 'R$ 350', 'reference_month': 'setembro de 2026'}


class ProjectionGateway(FakeGateway):
    async def generate(self, *args):
        result = await super().generate(*args)
        result['projection_proposal'] = PROPOSAL.copy()
        return result


def test_confirmation_required_before_motor_and_replay_does_not_recalculate():
    from agent_backend.conversation.service import ConversationService
    service = ConversationService(gateway=ProjectionGateway())
    first, status = asyncio.run(service.send('a', payload(MESSAGE)))
    assert status == 200 and 'Confirma' in first['reply']
    assert '11 meses' not in first['reply']
    req = payload('Sim, confirmo', 'm2', first['conversation_id'])
    result, status = asyncio.run(service.send('a', req))
    assert status == 200
    assert '7 a 11 meses' in result['reply']
    assert '5%: 11 meses' in result['reply'] and '8%: 7 meses' in result['reply']
    assert 'compromisso' in result['reply']
    assert sum(x.get('event') == 'projection_calculated' for x in service.audit) == 1
    replay, _ = asyncio.run(service.send('a', req))
    assert result == replay
    assert sum(x.get('event') == 'projection_calculated' for x in service.audit) == 1


def test_hallucinated_proposal_cannot_reach_confirmation_or_motor():
    from agent_backend.conversation.service import ConversationService
    service = ConversationService(gateway=ProjectionGateway())
    result, status = asyncio.run(service.send('a', payload('Quero reduzir delivery, mas não informei meus valores.')))
    assert '600' not in result['reply']
    assert not service.proposals
    assert not any(x.get('event') == 'projection_calculated' for x in service.audit)


def test_projection_confirmation_is_owner_bound():
    from agent_backend.conversation.service import ConversationService
    service = ConversationService(gateway=ProjectionGateway())
    first, _ = asyncio.run(service.send('a', payload(MESSAGE)))
    result, status = asyncio.run(service.send('b', payload('Sim', 'b2', first['conversation_id'])))
    assert status == 404
    assert not any(x.get('event') == 'projection_calculated' for x in service.audit)


def test_wrong_period_or_currency_cannot_be_used_as_monthly_brl():
    from agent_backend.conversation.projection import validate_proposal
    for text in [MESSAGE + ' Mas o atual é por semana.', MESSAGE + ' Os valores estão em dólar.']:
        with pytest.raises(ValueError): validate_proposal(PROPOSAL, [text])
