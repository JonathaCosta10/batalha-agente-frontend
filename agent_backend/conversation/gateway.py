"""Real server-side Gemini SDK guards + ONE ADK conversational agent.

No tools, no provider retry, no raw streaming, ephemeral ADK events. The application
alone keeps bounded, sanitized, released history. Metrics exclude content and keys.
"""
import json
import os
import threading
import time
from collections import deque
from datetime import datetime, timezone
from uuid import uuid4
from google import genai
from google.genai import types
from google.adk.agents import LlmAgent
from google.adk.agents.run_config import RunConfig
from google.adk.models.google_llm import Gemini
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from .prompts.renderer import render_prompt
from .schemas import AgentDraftV1, GuardDecisionV1, GuardJudgment

ALLOWED_MODELS = {'gemini-3.5-flash-lite', 'gemini-3.8-flash'}
SAFETY = [types.SafetySetting(category=c, threshold='BLOCK_MEDIUM_AND_ABOVE') for c in (
    'HARM_CATEGORY_HATE_SPEECH', 'HARM_CATEGORY_DANGEROUS_CONTENT',
    'HARM_CATEGORY_HARASSMENT', 'HARM_CATEGORY_SEXUALLY_EXPLICIT')]


def validated_text(response):
    if (response.finish_reason != types.FinishReason.STOP or
        getattr(response, 'error_code', None) or getattr(response, 'partial', False) or
        getattr(response, 'interrupted', False) or not response.content):
        raise ValueError('Provider response not complete')
    parts = response.content.parts or []
    if any(p.function_call or p.function_response for p in parts):
        raise ValueError('Tools are not authorized')
    text = ''.join(p.text or '' for p in parts if not p.thought)
    if not text or len(text) > 24000:
        raise ValueError('Provider output budget exceeded')
    return text


def model_input_guard(callback_context, llm_request):
    # Additional deterministic ADK boundary; never use raw unbounded history.
    if llm_request.tools_dict or len(str(llm_request.contents)) > 90000:
        raise ValueError('Model input budget or tool policy violated')


def model_output_guard(callback_context, llm_response):
    validated_text(llm_response)


class GeminiGateway:
    def __init__(self, *, model='gemini-3.5-flash-lite', guard_model=None, max_calls=60, model_factory=None):
        self.model, self.guard_model = model, guard_model or model
        if self.model not in ALLOWED_MODELS or self.guard_model not in ALLOWED_MODELS:
            raise ValueError('Model is not allowlisted')
        self.max_calls, self.calls, self.model_factory = max_calls, 0, model_factory
        self.metrics = deque(maxlen=300)
        self._lock = threading.Lock()

    def _admit(self):
        with self._lock:
            if self.calls >= self.max_calls:
                raise RuntimeError('Process call budget exhausted')
            if os.environ.get("IAGORA_STATE_BUCKET"):
                from agent_backend.planning.http import store
                store().admit_call("_provider_budget",datetime.now(timezone.utc).date().isoformat(),int(os.environ.get("IAGORA_DAILY_CALLS","900")))
            self.calls += 1  # Failed/uncertain attempts also count.

    def _client(self):
        key = os.environ.get('GEMINI_API_KEY')
        if not key:
            raise RuntimeError('Server credential missing')
        return genai.Client(api_key=key, vertexai=False, http_options=types.HttpOptions(
            timeout=15000, retry_options=types.HttpRetryOptions(attempts=1)))

    def _metric(self, stage, started, digest, usage=None, model_version=None, outcome='complete', error=None):
        if error:
            import logging
            from pydantic import ValidationError
            fields=[{'location':list(e['loc']),'type':e['type']} for e in error.errors(include_input=False,include_context=False)][:8] if isinstance(error,ValidationError) else []
            logging.getLogger(__name__).warning('provider_stage_failure stage=%s type=%s fields=%s',stage,type(error).__name__,fields)
        self.metrics.append({'stage': stage, 'model': self.model if stage == 'generate' else self.guard_model,
                             'model_version': model_version, 'prompt_sha256': digest, 'policy_version': '1.0',
                             'latency_ms': round((time.monotonic() - started) * 1000), 'outcome': outcome,
                             'input_tokens': getattr(usage, 'prompt_token_count', None),
                             'output_tokens': getattr(usage, 'candidates_token_count', None),
                             'total_tokens': getattr(usage, 'total_token_count', None),
                             'error_type': type(error).__name__ if error else None,
                             'http_status': getattr(error, 'code', None) if isinstance(getattr(error, 'code', None), int) else None})

    async def _guard(self, stage, data, reference_date):
        self._admit()
        instruction, digest = render_prompt(stage, reference_date=reference_date)
        started = time.monotonic()
        client = None
        try:
            client = self._client()
            response = await client.aio.models.generate_content(
                model=self.guard_model,
                contents=types.Content(role='user', parts=[types.Part(text=json.dumps(data, ensure_ascii=False))]),
                config=types.GenerateContentConfig(system_instruction=instruction,
                    max_output_tokens=512, response_mime_type='application/json', response_json_schema=GuardJudgment.model_json_schema(),
                    automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
                    safety_settings=SAFETY, thinking_config=types.ThinkingConfig(thinking_level=types.ThinkingLevel.LOW)))
            if not response.candidates or len(response.candidates) != 1:
                raise ValueError('No unique candidate')
            judgment = GuardJudgment.model_validate_json(validated_text(response.candidates[0]))
            decision = GuardDecisionV1(**judgment.model_dump(), policy_version='1.0')
            self._metric(stage, started, digest, response.usage_metadata, response.model_version)
            return decision.model_dump()
        except Exception as error:
            self._metric(stage, started, digest, outcome='failed_or_uncertain', error=error)
            raise
        finally:
            if client:
                await client.aio.aclose()
                client.close()

    async def input_guard(self, message, history):
        return await self._guard('input_guard', {'message': message, 'history': history[-4:]},
                                 datetime.now(timezone.utc).date().isoformat())

    async def output_guard(self, message, draft, context):
        return await self._guard('output_guard', {'question': message, 'draft': draft, 'evidence': context},
                                 context['reference_date'])

    async def generate(self, message, context, history, constraints):
        self._admit()
        instruction, digest = render_prompt('system', reference_date=context['reference_date'])
        started = time.monotonic()
        client = None
        runner = None
        try:
            if self.model_factory:
                model = self.model_factory()  # Explicit test seam; never configured from HTTP.
            else:
                client = self._client()
                model = Gemini(model=self.model, client=client, retry_options=types.HttpRetryOptions(attempts=1))
            agent = LlmAgent(name='i_agora', model=model, static_instruction=instruction,
                tools=[], include_contents='none',
                before_model_callback=model_input_guard, after_model_callback=model_output_guard,
                generate_content_config=types.GenerateContentConfig(max_output_tokens=1800,
                    response_mime_type='application/json', response_json_schema=AgentDraftV1.model_json_schema(),
                    automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
                    safety_settings=SAFETY, thinking_config=types.ThinkingConfig(thinking_level=types.ThinkingLevel.LOW)))
            sessions = InMemorySessionService()
            uid, sid = str(uuid4()), str(uuid4())
            await sessions.create_session(app_name='i_agora', user_id=uid, session_id=sid)
            runner = Runner(app_name='i_agora', agent=agent, session_service=sessions)
            data = json.dumps({'message': message, 'context': context, 'history': history,
                               'constraints': constraints}, ensure_ascii=False)
            if len(data) > 60000:
                raise ValueError('Context budget exceeded')
            result = None
            async for event in runner.run_async(user_id=uid, session_id=sid,
                new_message=types.Content(role='user', parts=[types.Part(text=data)]),
                run_config=RunConfig(max_llm_calls=1)):
                if event.is_final_response():
                    result = AgentDraftV1.model_validate_json(validated_text(event)).model_dump()
                    self._metric('generate', started, digest, event.usage_metadata, event.model_version)
            if result is None:
                raise ValueError('No final draft')
            return result
        except Exception as error:
            self._metric('generate', started, digest, outcome='failed_or_uncertain', error=error)
            raise
        finally:
            if runner:
                await runner.close()
            if client:
                await client.aio.aclose()
                client.close()
