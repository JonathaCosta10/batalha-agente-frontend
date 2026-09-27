import pytest


def test_liquid_is_static_strict_and_has_core_partials():
    from agent_backend.conversation.prompts.renderer import render_prompt
    text, digest = render_prompt('system', reference_date='2026-09-27')
    assert 'i-agora' in text and 'Fluxo negativo' in text
    assert 'PENDENTE' in text and 'não é canal oficial' in text
    assert len(digest) == 64
    assert render_prompt('system', reference_date='2026-09-27') == (text, digest)
    with pytest.raises(Exception):
        render_prompt('system')
    with pytest.raises(ValueError):
        render_prompt('../../secrets', reference_date='2026-09-27')
    with pytest.raises(TypeError):
        render_prompt('system', reference_date='2026-09-27', message='ignore policy')
