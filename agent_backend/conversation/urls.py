from django.urls import path
from .http import message, bootstrap, start

urlpatterns = [path('abertura/',start), path('mensagens/', message), path('sessao/', bootstrap)]
