"""Django adapter. Authentication/consent happens in code before cache access."""
import asyncio
import json
from functools import lru_cache
from uuid import uuid4
from django.conf import settings
from django.core import signing
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.utils.module_loading import import_string
from .service import ConversationService

errors = ConversationService()
COOKIE = 'i_agora_demo_session'


@lru_cache(maxsize=4)
def service_for(mode, paid, model, guard_model, budget):
    if mode == 'demo':
        return ConversationService()
    if mode not in ('live', 'demo_live') or not paid:
        raise ValueError('Live access not configured')
    from .gateway import GeminiGateway
    from agent_backend.planning.http import conversation_context, offer_case, opening_for
    return ConversationService(gateway=GeminiGateway(model=model, guard_model=guard_model, max_calls=budget),
        principal_context_builder=conversation_context, on_commitment_proposed=offer_case, principal_opening_builder=opening_for)


def get_service():
    return service_for(settings.IAGORA_MODE, settings.IAGORA_ALLOW_PAID_CALLS,
                       settings.IAGORA_MODEL, settings.IAGORA_GUARD_MODEL, settings.IAGORA_MAX_CALLS)


def response(result):
    body, status = result
    output = JsonResponse(body, status=status)
    output['Cache-Control'] = 'no-store'
    output['X-Content-Type-Options'] = 'nosniff'
    return output


def failure(code='auth', status=401):
    return response(errors.release(code=code, http_status=status))


def is_local(request):
    # Never trust X-Forwarded-For. Bind harness to loopback; do not publish through a proxy.
    return request.META.get('REMOTE_ADDR') in ('127.0.0.1', '::1') or (
        getattr(settings, 'IAGORA_PUBLIC_SYNTHETIC_DEMO', False) is True and
        bool(getattr(settings, 'IAGORA_SYNTHETIC_DATA_ONLY', False)))


def principal_for(request):
    mode = settings.IAGORA_MODE
    if mode in ('demo', 'demo_live'):
        if not is_local(request):
            return None
        try:
            value = signing.loads(request.COOKIES.get(COOKIE, ''), salt=COOKIE, max_age=getattr(settings, 'IAGORA_SESSION_AGE', 1800))
            return 'demo:' + str(uuid4_from_string(value))
        except (signing.BadSignature, ValueError, TypeError):
            return None
    resolver = getattr(settings, 'IAGORA_PRINCIPAL_RESOLVER', None)
    user = getattr(request, 'user', None)
    if mode != 'live' or not resolver or not user or not user.is_authenticated:
        return None
    # Callable must revalidate current consent/access and return an opaque subject or None.
    resolve = import_string(resolver) if isinstance(resolver, str) else resolver
    principal = resolve(request)
    return principal if isinstance(principal, str) and 0 < len(principal) <= 128 else None


def uuid4_from_string(value):
    from uuid import UUID
    return UUID(value, version=4)


def bootstrap(request):
    if request.method != 'GET':
        return failure('schema', 405)
    mode = settings.IAGORA_MODE
    if mode in ('demo', 'demo_live'):
        if not is_local(request):
            return failure()
    elif not principal_for(request):
        return failure()
    get_token(request)
    body, status = errors.release(code='demo' if mode == 'demo' else 'clarify', http_status=200)
    body['mode'] = mode
    output = response((body, status))
    if mode in ('demo', 'demo_live') and principal_for(request) is None:
        output.set_cookie(COOKIE, signing.dumps(str(uuid4()), salt=COOKIE), max_age=getattr(settings, 'IAGORA_SESSION_AGE', 1800),
                          httponly=True, samesite='Strict', secure=request.is_secure())
    return output


def start(request):
    if request.method!='POST':return failure('schema',405)
    principal=principal_for(request)
    if not principal:return failure()
    try:
        if request.content_type!='application/json' or len(request.body)>1000:raise ValueError()
        data=json.loads(request.body)
        if not isinstance(data,dict) or set(data)!={'client_request_id'}:raise ValueError()
    except (ValueError,TypeError):return failure('schema',400)
    from agent_backend.planning.http import store
    if store().get(principal) is None:return failure('schema',409)
    return response(asyncio.run(get_service().start(principal,data['client_request_id'])))


def message(request):
    if request.method != 'POST':
        return failure('schema', 405)
    principal = principal_for(request)
    if not principal:
        return failure()
    if request.content_type != 'application/json' or len(request.body) > 16384:
        return failure('schema', 400)
    try:
        payload = json.loads(request.body)
    except (ValueError, UnicodeDecodeError):
        return failure('schema', 400)
    return response(asyncio.run(get_service().send(principal, payload)))


def csrf_failure(request, reason=''):
    return failure('auth', 403)


def error400(request, exception=None):
    return failure('schema', 400)


def error404(request, exception=None):
    return failure('not_found', 404)


def error500(request):
    return failure('technical', 503)


class ReleaseMiddleware:
    """Envelope all feature errors; no exception body, debug page, or raw provider output."""
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not request.path.startswith('/api/v1/context-agent/'):
            return self.get_response(request)
        try:
            request.get_host()  # Enforce Host allowlist even without CommonMiddleware.
            return self.get_response(request)
        except Exception:
            return failure('schema', 400)

    def process_exception(self, request, exception):
        if request.path.startswith('/api/v1/context-agent/conversas/'):
            from django.core.exceptions import RequestDataTooBig
            if isinstance(exception, RequestDataTooBig):
                return failure('schema', 400)
            return failure('technical', 503)
        return None
