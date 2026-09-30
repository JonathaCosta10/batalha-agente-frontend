"""Local single-process harness, not a second deployed backend."""
import os
import re
import secrets

DEFAULT_DEV_ORIGINS = 'http://127.0.0.1:3000,http://localhost:3000'
_LOCAL_ORIGIN = re.compile(r'^http://(127\.0\.0\.1|localhost|\[::1\]):\d{1,5}$')


def trusted_origins(raw):
    """Front origins the harness trusts for CSRF. Local only: the harness never serves a public host."""
    origins = [o.strip().rstrip('/') for o in (raw or DEFAULT_DEV_ORIGINS).split(',') if o.strip()]
    bad = [o for o in origins if not _LOCAL_ORIGIN.match(o)]
    if bad:
        raise ValueError(f'IAGORA_DEV_ORIGINS aceita apenas http://localhost|127.0.0.1|[::1]:PORTA; recusado: {bad}')
    return origins


SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY') or secrets.token_urlsafe(48)
DEBUG = False
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '[::1]']
ROOT_URLCONF = 'agent_backend.harness.urls'
INSTALLED_APPS = []
MIDDLEWARE = [
    'agent_backend.conversation.http.ReleaseMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
]
CSRF_FAILURE_VIEW = 'agent_backend.conversation.http.csrf_failure'
CSRF_COOKIE_SAMESITE = 'Strict'
CSRF_TRUSTED_ORIGINS = trusted_origins(os.environ.get('IAGORA_DEV_ORIGINS'))
CSRF_COOKIE_HTTPONLY = False
DATA_UPLOAD_MAX_MEMORY_SIZE = 16384
IAGORA_MODE = os.environ.get('IAGORA_MODE', 'demo')
IAGORA_ALLOW_PAID_CALLS = os.environ.get('IAGORA_ALLOW_PAID_CALLS') == 'yes'
IAGORA_MAX_CALLS = min(max(int(os.environ.get('IAGORA_MAX_CALLS', '12')), 0), 60)
IAGORA_DETAILED_CONTEXT = os.environ.get('IAGORA_DETAILED_CONTEXT') == 'yes'
IAGORA_PRINCIPAL_RESOLVER = None  # Integrator must configure auth AND current consent.
IAGORA_MODEL = os.environ.get('AGENT_MODEL', 'gemini-3.5-flash-lite')
IAGORA_GUARD_MODEL = os.environ.get('GUARD_MODEL', IAGORA_MODEL)
# Avoid provider/debug logging of request bodies. Sanitized metrics are in gateway.metrics.
LOGGING = {'version': 1, 'disable_existing_loggers': False,
           'handlers': {'null': {'class': 'logging.NullHandler'}},
           'loggers': {name: {'handlers': ['null'], 'propagate': False} for name in
                       ['google', 'google_adk', 'httpx', 'httpcore', 'opentelemetry']}}
