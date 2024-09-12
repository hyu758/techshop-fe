# base/urls.py
from django.urls import path
from .views import *

urlpatterns = [
    path('login/', login, name='login'),
    path('register/', register, name='register'),
    path('', home, name='home'),
    path('shop/', shop, name='shop'),
    path('product/<int:product_id>/', product_detail, name='product_detail'),
]
