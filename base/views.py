import requests
import json
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib import messages
import random

def format_currency(value):
    if isinstance(value, str):
        value = value.replace(',', '')
    
    return "{:,.0f}".format(float(value))

def login(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')
        print("Email:", email)
        print("Password:", password)
        # Gửi yêu cầu đến API Node.js
        api_url = 'http://localhost:3000/api/login'  # Thay đổi URL nếu cần
        response = requests.post(api_url, json={'email': email, 'password': password})

        if response.status_code == 200:
            # Xử lý khi đăng nhập thành công
            data = response.json()
            return JsonResponse(data)
        else:
            # Xử lý khi có lỗi
            return JsonResponse({'error': 'Invalid credentials'}, status=401)

    return render(request, 'components/login.html')

def register(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            name = data.get('name')
            email = data.get('email')
            password = data.get('password')
            rePassword = data.get('rePassword')

            if(password != rePassword):
                return JsonResponse({'error': 'Mật khẩu không khớp.'}, status=400)

            if not name or not email or not password:
                return JsonResponse({'error': 'Thiếu trường bắt buộc.'}, status=400)

            # Gửi yêu cầu POST tới API bên ngoài
            api_response = requests.post(
                'https://techshop-backend-c7hy.onrender.com/api/register',
                json={'name': name, 'email': email, 'password': password}
            )

            if api_response.status_code == 201:
                return JsonResponse({'message': 'Đăng ký thành công! Bạn có thể đăng nhập.'}, status=201)
            else:
                error_message = api_response.json().get('error', 'Đã có lỗi xảy ra trong quá trình đăng ký.')
                return JsonResponse({'error': error_message}, status=api_response.status_code)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Dữ liệu gửi đi không hợp lệ.'}, status=400)

        except requests.exceptions.RequestException:
            return JsonResponse({'error': 'Không thể kết nối tới API đăng ký.'}, status=500)
        
    return render(request, 'components/register.html')

def home(request):
    url = "https://techshop-backend-c7hy.onrender.com/api/getAllProducts"
    response = requests.get(url)
    
    if response.status_code == 200:
        products = response.json()

        bestseller_products = products.copy() 
        recommend_products = products.copy()
        cheapest_products = products.copy()

        bestseller_products.sort(key = lambda x: x['sold_quantity'], reverse = True)
        recommend_products.sort(key = lambda x: x['price'], reverse = True)
        cheapest_products.sort(key = lambda x: x['price'])

        for product in bestseller_products:
            product['price'] = format_currency(product['price'])

        for product in recommend_products:
            product['price'] = format_currency(product['price'])
        
        for product in cheapest_products:
            product['price'] = format_currency(product['price'])

            
        bestseller_products =  bestseller_products[0:8]
        recommend_products = recommend_products[0:8]
        cheapest_products = cheapest_products[0:8]

    else:
        bestseller_products = [] 
        recommend_products = []
        cheapest_products = []

    context = {
        'bestseller_products': bestseller_products,
        'recommend_products': recommend_products,
        'cheapest_products' : cheapest_products
    }

    return render(request, 'home.html', context)

def shop(request):
    url = "https://techshop-backend-c7hy.onrender.com/api/getAllProducts"
    response = requests.get(url)
    brands_set = set()
    
    if response.status_code == 200:
        products = response.json()
    
        for product in products:
            product['price'] = format_currency(product['price'])
            brands_set.add(product['brand'].strip())
        
        brands = sorted(brands_set)
    else:
        products = []
        brands = []


    context = {
        'products': products,
        'brands': brands
    }
    return render(request, 'shop.html', context)


def product_detail(request, product_id):
    # Fetch product details from API
    url = f"https://techshop-backend-c7hy.onrender.com/api/getProductDetails/{product_id}"
    response = requests.get(url)

    if response.status_code == 200:
        product = response.json()
        product["price"] = format_currency(product["price"])
    else:
        product = None

    context = {
        'product': product,
    }

    return render(request, 'productDetail.html', context)

def test(request):
    url = "https://techshop-backend-c7hy.onrender.com/api/getAllProducts"
    response = requests.get(url)
    
    if response.status_code == 200:
        products = response.json()
        
    else:
        products=[]
    return render(request, 'components/productList1.html', {'products': products})