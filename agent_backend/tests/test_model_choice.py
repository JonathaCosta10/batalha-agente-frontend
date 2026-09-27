from agent_backend.conversation.gateway import GeminiGateway
from agent_backend.harness import settings


def test_requested_flash_lite_is_default_for_agent_and_guards():
    gateway = GeminiGateway()
    assert gateway.model == 'gemini-3.5-flash-lite'
    assert gateway.guard_model == 'gemini-3.5-flash-lite'
    assert settings.IAGORA_MODEL == 'gemini-3.5-flash-lite'
    assert settings.IAGORA_GUARD_MODEL == 'gemini-3.5-flash-lite'
