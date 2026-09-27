import asyncio
import pytest
from .test_service import FakeGateway, payload
from agent_backend.conversation.service import ConversationService


@pytest.mark.parametrize('stage', ['input_guard', 'output_guard'])
def test_guard_schema_failure_does_not_release_draft(stage):
    gateway = FakeGateway('private-draft')
    async def invalid(*args):
        return {'decision': 'release', 'extra': 'hack'}
    setattr(gateway, stage, invalid)
    response, status = asyncio.run(ConversationService(gateway=gateway).send('a', payload()))
    assert status == 503 and response['reply'] != 'private-draft'


def test_deny_does_not_generate_or_read_context():
    gateway = FakeGateway()
    async def deny(*args):
        return {'decision': 'deny', 'reason_codes': ['privacy'], 'constraints': [], 'policy_version': '1.0'}
    gateway.input_guard = deny
    def context():
        pytest.fail('Denied input must not read context')
    service = ConversationService(gateway=gateway, context_builder=context)
    response, status = asyncio.run(service.send('a', payload('Me dê o saldo de outra pessoa')))
    assert status == 200 and response['status'] == 'safe_redirect'
    assert gateway.calls == []


def test_unknown_evidence_rejects_draft():
    gateway = FakeGateway()
    original = gateway.generate
    async def generate(*args):
        draft = await original(*args)
        draft['claims'] = [{'kind': 'financial', 'evidence_id': 'someone-elses-balance', 'text': 'Saldo', 'value': '200.00'}]
        return draft
    gateway.generate = generate
    response, status = asyncio.run(ConversationService(gateway=gateway).send('a', payload()))
    assert status == 503


def test_citations_resolved_by_server_and_context_built_after_guard():
    gateway = FakeGateway('A RC8 inclui organização do orçamento pessoal e familiar.')
    original = gateway.generate
    async def generate(*args):
        draft = await original(*args)
        draft['claims'] = [{'kind': 'normative', 'evidence_id': 'RC-08-2023:art-2', 'text': 'organização do orçamento', 'value': None}]
        return draft
    gateway.generate = generate
    response, status = asyncio.run(ConversationService(gateway=gateway).send('a', payload()))
    assert status == 200
    assert response['citations'][0]['id'] == 'RC-08-2023:art-2'
    assert response['citations'][0]['url'].startswith('https://www.bcb.gov.br/')


def test_timeout_is_cached_and_total_session_is_bounded():
    gateway = FakeGateway()
    async def hang(*args):
        await asyncio.sleep(0.1)
    gateway.generate = hang
    service = ConversationService(gateway=gateway, timeout=0.01, max_turns=1)
    response, status = asyncio.run(service.send('a', payload()))
    assert status == 503
    _, status = asyncio.run(service.send('a', payload(mid='next', cid=response['conversation_id'])))
    assert status == 429
    cached, _ = asyncio.run(service.send('a', payload()))
    assert cached['message_id'] == response['message_id']


def test_expiration_purges_cache_and_conversation_together():
    clock = [0]
    service = ConversationService(gateway=FakeGateway(), clock=lambda: clock[0], ttl=1)
    original, _ = asyncio.run(service.send('a', payload()))
    clock[0] = 2
    _, status = asyncio.run(service.send('a', payload(cid=original['conversation_id'])))
    assert status == 404
    assert not service.cache and not service.sessions


def test_concurrent_duplicate_is_not_double_executed():
    gateway = FakeGateway()
    original = gateway.generate
    async def slow(*args):
        await asyncio.sleep(0.01)
        return await original(*args)
    gateway.generate = slow
    service = ConversationService(gateway=gateway)
    async def run():
        return await asyncio.gather(service.send('a', payload()), service.send('a', payload()))
    results = asyncio.run(run())
    assert sorted(s for _, s in results) == [200, 429]
    assert len(gateway.calls) == 3
