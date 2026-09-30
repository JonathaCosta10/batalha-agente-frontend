import pytest
from agent_backend.harness.settings import DEFAULT_DEV_ORIGINS, trusted_origins


def test_default_keeps_vite_3000():
    assert trusted_origins(None) == DEFAULT_DEV_ORIGINS.split(',')
    assert trusted_origins('') == DEFAULT_DEV_ORIGINS.split(',')


def test_env_list_is_trimmed():
    assert trusted_origins(' http://127.0.0.1:3001/ , http://localhost:5173') == ['http://127.0.0.1:3001', 'http://localhost:5173']


@pytest.mark.parametrize('bad', ['*', 'https://i-agora.exemplo.com.br', 'http://evil.com:3000',
                                 'http://127.0.0.1', 'http://127.0.0.1:3000/path', 'http://127.0.0.1.evil.com:3000'])
def test_rejects_non_local_or_malformed(bad):
    with pytest.raises(ValueError):
        trusted_origins(f'http://127.0.0.1:3000,{bad}')
