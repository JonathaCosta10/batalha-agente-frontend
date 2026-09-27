from django.urls import path
from .http import message, bootstrap

urlpatterns = [path('mensagens/', message), path('sessao/', bootstrap)]
