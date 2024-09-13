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
    path('product/<int:product_id>/', product_detail, name='product_detail'),
    path('upload_image/', upload_image, name = "upload_image")
]
