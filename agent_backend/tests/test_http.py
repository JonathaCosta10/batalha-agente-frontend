import os
import json
import importlib
import pytest
from django.conf import settings

if not settings.configured:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agent_backend.harness.settings')
    import django
    django.setup()

from django.test import Client, override_settings

@pytest.fixture(autouse=True)
def test_hosts():
    with override_settings(ALLOWED_HOSTS=['testserver', 'localhost', '127.0.0.1']):
        yield


URL = '/api/v1/context-agent/conversas/mensagens/'
BOOT = '/api/v1/context-agent/conversas/sessao/'


def test_live_without_auth_fails_closed_and_never_calls_gemini():
    with override_settings(IAGORA_MODE='live', IAGORA_PRINCIPAL_RESOLVER=None):
        response = Client().post(URL, data=json.dumps({'customer_id': 42}), content_type='application/json')
        assert response.status_code == 401
        assert response.json()['status'] == 'unavailable'
        assert response.json()['reply']


def test_demo_cookie_csrf_and_contract_isolation():
    from .test_service import payload
    with override_settings(IAGORA_MODE='demo'):
        client = Client(enforce_csrf_checks=True)
        boot = client.get(BOOT)
        assert boot.status_code == 200
        assert boot.json()['mode'] == 'demo'
        missing = client.post(URL, data=json.dumps(payload()), content_type='application/json')
        assert missing.status_code == 403
        assert missing.json()['status'] == 'unavailable'
        headers = {'HTTP_X_CSRFTOKEN': client.cookies['csrftoken'].value, 'HTTP_ORIGIN': 'http://127.0.0.1:3000'}
        response = client.post(URL, data=json.dumps(payload()), content_type='application/json', **headers)
        assert response.status_code == 200
        assert 'não foi gerada por IA' in response.json()['reply']
        assert response['Cache-Control'] == 'no-store'
        other = Client()
        other.get(BOOT)
        stolen = other.post(URL, data=json.dumps(payload(cid=response.json()['conversation_id'])), content_type='application/json')
        assert stolen.status_code == 404


def test_demo_rejects_nonlocal_peer_and_unexpected_host():
    with override_settings(IAGORA_MODE='demo'):
        assert Client().get(BOOT, REMOTE_ADDR='203.0.113.1').status_code == 401
        assert Client().get(BOOT, HTTP_HOST='evil.example').status_code == 400


@pytest.mark.parametrize('body', ['{invalid', '[]', '"hello"', '{"message":"' + 'x' * 17000 + '"}'], ids=['invalid-json', 'array', 'string', 'oversize'])
def test_protocol_errors_have_only_released_envelope(body):
    with override_settings(IAGORA_MODE='demo'):
        client = Client()
        client.get(BOOT)
        response = client.post(URL, data=body, content_type='application/json')
        assert response.status_code == 400
        assert response.json()['schema_version'] == '1.0'
        assert 'Traceback' not in response.content.decode()
