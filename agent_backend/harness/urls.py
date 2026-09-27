from django.urls import include, path
from agent_backend.conversation.http import error400, error404, error500

urlpatterns = [path('api/v1/context-agent/conversas/', include('agent_backend.conversation.urls')),
               path('api/v1/context-agent/i-agora/', include('agent_backend.planning.urls'))]
handler400 = error400
handler404 = error404
handler500 = error500
