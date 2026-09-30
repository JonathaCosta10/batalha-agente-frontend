"""Cloud Run: synthetic-event demo only; not bank/customer authentication."""
import os
from agent_backend.harness.settings import *
SECRET_KEY=os.environ['DJANGO_SECRET_KEY']
ALLOWED_HOSTS=os.environ.get('IAGORA_HOSTS','localhost').split(',')+['localhost','127.0.0.1','testserver']
ROOT_URLCONF='deploy.urls'
MIDDLEWARE=['deploy.middleware.SecurityHeaders','django.middleware.common.CommonMiddleware',*MIDDLEWARE]
CSRF_TRUSTED_ORIGINS=['https://'+h for h in ALLOWED_HOSTS if h not in ('localhost','127.0.0.1','testserver')]
SECURE_PROXY_SSL_HEADER=('HTTP_X_FORWARDED_PROTO','https')
CSRF_COOKIE_SECURE=True
CSRF_COOKIE_NAME='csrftoken'
IAGORA_MODE='demo_live'
IAGORA_ALLOW_PAID_CALLS=True
IAGORA_PUBLIC_SYNTHETIC_DEMO=True
IAGORA_SYNTHETIC_DATA_ONLY=True
IAGORA_SESSION_AGE=30*24*3600
IAGORA_MAX_CALLS=int(os.environ.get('IAGORA_DAILY_CALLS','900'))
