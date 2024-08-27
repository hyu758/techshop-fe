# base/urls.py
from django.urls import path
from .views import *

urlpatterns = [
    path('login/', login, name='login'),
    path('', home, name='home'),
    path('test', test, name='test')
]
