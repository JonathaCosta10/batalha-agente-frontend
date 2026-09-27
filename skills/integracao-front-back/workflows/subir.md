# integ.subir

1. PLAN: veja quem já escuta: `netstat -ano | findstr ":8000 :3000"` (PowerShell) ou `netstat -ano | grep -E ":(8000|3000) "`.
   Porta ocupada por outra sessão NÃO se derruba: use outra porta e `DJANGO_URL`.
2. GENERATE:
   - backend (pasta `Nova pasta/backend`): `.venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000`
     (ADC para o BigQuery: `gcloud auth application-default login`; Gemini conforme o README do backend);
   - front (esta pasta): `npm ci` e `npm run dev` → `http://127.0.0.1:3000`;
   - outra porta do backend: `$env:DJANGO_URL='http://127.0.0.1:<porta>'; npm run dev`.
3. CRITIQUE: um só processo na porta do backend. NÃO rode `python -m agent_backend.manage runserver` junto: o
   `agent_backend/` não tem `definir/` e o front cai em identidade por cookie.
4. REPAIR: 403 no POST = origem fora de `CSRF_TRUSTED_ORIGINS` do backend; 502/ECONNREFUSED no Vite = `DJANGO_URL` errado.
5. VERIFY: `GET http://127.0.0.1:3000/api/v1/context-agent/conversas/status/` responde 200 pelo proxy.
