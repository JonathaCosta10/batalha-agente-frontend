from django.urls import path
from . import http
urlpatterns=[
 path('perfil/',http.profile),path('sessao/abertura/',http.opening),
 path('plano/',http.plan),path('plano/proposta/',http.proposal),
 path('plano/rascunho/',http.adjust),path('plano/confirmar/',http.confirm),
 path('acompanhamento/',http.followup),
]
