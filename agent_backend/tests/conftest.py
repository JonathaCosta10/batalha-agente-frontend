import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agent_backend.harness.settings')
django.setup()
