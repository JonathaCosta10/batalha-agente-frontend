FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PORT=8080
WORKDIR /app
COPY agent_backend/requirements.lock /app/requirements.lock
RUN pip install --no-cache-dir -r requirements.lock gunicorn==23.0.0
COPY agent_backend /app/agent_backend
COPY deploy /app/deploy
COPY front_dist /app/front_dist
RUN chmod -R a+rX /app && useradd --uid 10001 --create-home app
USER 10001
CMD ["sh","-c","exec gunicorn deploy.wsgi:application --bind 0.0.0.0:${PORT} --workers 1 --threads 4 --timeout 120 --access-logfile /dev/null --error-logfile -"]
