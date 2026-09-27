import asyncio
import json
from types import SimpleNamespace
import pytest
from google.genai import types
from google.adk.models.base_llm import BaseLlm
from google.adk.models.llm_response import LlmResponse


class FakeLlm(BaseLlm):
    model: str = 'explicit-local-test-double'

    async def generate_content_async(self, llm_request, stream=False):
        assert not stream
        assert not llm_request.tools_dict
        assert llm_request.config.response_schema is None
        assert llm_request.config.response_json_schema['additionalProperties'] is False
        assert llm_request.config.temperature is None
        assert llm_request.config.thinking_config.thinking_level == types.ThinkingLevel.LOW
        assert 'i-agora' in llm_request.config.system_instruction
        assert all(c.role in ('user', 'model') for c in llm_request.contents)
        draft = {'reply': 'Podemos listar despesas essenciais.', 'status': 'ok', 'capabilities': ['orcamento'], 'claims': [], 'missing_data': []}
        yield LlmResponse(content=types.Content(role='model', parts=[types.Part(text=json.dumps(draft))]), finish_reason=types.FinishReason.STOP)


def test_real_adk_runner_with_explicit_fake_model_and_no_tools():
    from agent_backend.conversation.gateway import GeminiGateway
    from agent_backend.conversation.context import build_context
    gateway = GeminiGateway(model='gemini-3.8-flash', max_calls=3, model_factory=lambda: FakeLlm())
    draft = asyncio.run(gateway.generate('Como organizar orçamento?', build_context(), [], []))
    assert draft['reply'] == 'Podemos listar despesas essenciais.'
    assert gateway.calls == 1
    assert gateway.metrics[-1]['stage'] == 'generate'


@pytest.mark.parametrize('reason', ['MAX_TOKENS', 'SAFETY', 'RECITATION', None])
def test_non_stop_candidate_never_becomes_draft(reason):
    from agent_backend.conversation.gateway import validated_text
    response = SimpleNamespace(finish_reason=reason, error_code=None, partial=False, interrupted=False,
                               content=types.Content(parts=[types.Part(text='unsafe partial')]))
    with pytest.raises(ValueError):
        validated_text(response)


def test_provider_error_metrics_exclude_raw_exception_and_secret(monkeypatch):
    from agent_backend.conversation.gateway import GeminiGateway
    gateway = GeminiGateway()
    def fail():
        raise ValueError('DO-NOT-LOG-SECRET')
    monkeypatch.setattr(gateway, '_client', fail)
    with pytest.raises(ValueError):
        asyncio.run(gateway.input_guard('Pergunta', []))
    assert gateway.metrics[-1]['error_type'] == 'ValueError'
    assert 'DO-NOT-LOG' not in str(gateway.metrics)


def test_budget_admission_before_provider_construction():
    from agent_backend.conversation.gateway import GeminiGateway
    gateway = GeminiGateway(max_calls=0)
    with pytest.raises(RuntimeError):
        asyncio.run(gateway.input_guard('Olá', []))
    assert gateway.calls == 0
