# base/urls.py
from django.urls import path
from .views import *

urlpatterns = [
    path('login/', login, name='login'),
    path('logout/', logout, name = 'logout'),
    path('register/', register, name='register'),
    path('profile/', profile, name = 'profile'),
    path('', home, name='home'),
    path('shop/', shop, name='shop'),
    path('cart/', cart, name='cart'),
    path('checkout/', checkout, name='checkout'),
    path('product/<int:product_id>/', product_detail, name='product_detail'),
    path('api/add-to-cart/', add_to_cart, name='add_to_cart'),
    path('upload_image/', upload_image, name = "upload_image")
]
