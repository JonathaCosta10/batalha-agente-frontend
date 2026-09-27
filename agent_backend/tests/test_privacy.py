"""Privacy/authorization regression tests around cached and bounded turns."""
import asyncio
from types import SimpleNamespace
from django.test import RequestFactory, override_settings
from agent_backend.conversation.service import ConversationService
from .test_service import FakeGateway, payload


def test_rate_limit_and_approved_trace_are_bounded_per_principal():
    clock = [0]
    service = ConversationService(gateway=FakeGateway(), clock=lambda: clock[0], requests_per_minute=1)
    first, _ = asyncio.run(service.send('a', payload()))
    assert service.audit[-1] == {'event': 'release', 'code': 'approved'}
    _, status = asyncio.run(service.send('a', payload(mid='second', cid=first['conversation_id'])))
    assert status == 429
    clock[0] = 61
    _, status = asyncio.run(service.send('a', payload(mid='second', cid=first['conversation_id'])))
    assert status == 200


def test_rate_limited_new_turns_do_not_reserve_empty_conversations():
    clock = [0]
    service = ConversationService(gateway=FakeGateway(), clock=lambda: clock[0], requests_per_minute=1)
    asyncio.run(service.send('a', payload()))
    for i in range(4):
        _, status = asyncio.run(service.send('a', payload(mid=f'blocked-{i}')))
        assert status == 429
    assert len(service.sessions) == 1
    clock[0] = 61
    assert asyncio.run(service.send('a', payload(mid='after-window')))[1] == 200


def test_reviewer_has_minimized_released_history_to_check_followups():
    gateway = FakeGateway()
    contexts = []
    original = gateway.output_guard
    async def inspect(*args):
        contexts.append(args[2])
        return await original(*args)
    gateway.output_guard = inspect
    service = ConversationService(gateway=gateway)
    first, _ = asyncio.run(service.send('a', payload('Não tenho contas atrasadas.')))
    asyncio.run(service.send('a', payload('Como formar reserva então?', 'second', first['conversation_id'])))
    assert contexts[1]['user_reported_history'][0]['text'] == 'Não tenho contas atrasadas.'


def test_live_resolver_rechecks_consent_even_for_identical_cached_payload(monkeypatch):
    from agent_backend.conversation import http
    service = ConversationService(gateway=FakeGateway())
    monkeypatch.setattr(http, 'get_service', lambda: service)
    consent = [True]
    factory = RequestFactory()
    def resolver(request):
        return 'opaque-a' if consent[0] else None
    def request():
        import json
        req = factory.post('/api/v1/context-agent/conversas/mensagens/', json.dumps(payload()), content_type='application/json')
        req.user = SimpleNamespace(is_authenticated=True)
        return req
    with override_settings(IAGORA_MODE='live', IAGORA_PRINCIPAL_RESOLVER=resolver):
        assert http.message(request()).status_code == 200
        consent[0] = False
        assert http.message(request()).status_code == 401
        assert len(service.gateway.calls) == 3
