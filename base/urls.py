# base/urls.py
from django.urls import path
from .views import *

urlpatterns = [
    path('login/', login, name='login'),
    path('register/', register, name='register'),
    path('', home, name='home'),
    path('shop/', shop, name='shop'),
    path('api/products/', api_get_all_products, name='api_get_all_products'),
    path('product/<int:product_id>/', product_detail, name='product_detail'),
]
