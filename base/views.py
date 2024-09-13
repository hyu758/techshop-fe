import requests
import json
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib import messages
import random
from django.views.decorators.csrf import csrf_exempt

def format_currency(value):
    if isinstance(value, str):
        value = value.replace(',', '')
    
    return "{:,.0f}".format(float(value))


import json
from django.shortcuts import redirect, render
from django.http import JsonResponse
import requests

def login(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email')
            password = data.get('password')
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

        print("Email:", email)
        print("Password:", password)
        
        api_url = 'https://techshop-backend-c7hy.onrender.com/api/login'  # Đảm bảo URL chính xác
        response = requests.post(api_url, json={'email': email, 'password': password})

        if response.status_code == 200:
            data = response.json()
            user_data = data.get('user', {})
            request.session['user'] = {
                'id': user_data.get('id'),
                'email': user_data.get('email'),
                'name': user_data.get('name')
            }
            return JsonResponse({'message': 'Đăng nhập thành công'}, status=200)
        else:
            return JsonResponse({'error': 'Thông tin đăng nhập không chính xác'}, status=401)

    return render(request, 'components/login.html')


def logout(request):
    # Xóa thông tin người dùng khỏi session
    if 'user' in request.session:
        del request.session['user']
    return redirect('/')

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

def profile(request):
    if request.method == 'POST':
        user_id = request.session.get('user', {}).get('id')
        if not user_id:
            return redirect('/login')

        name = request.POST.get('name')
        address = request.POST.get('address')
        phone_number = request.POST.get('phone_number')

        api_url = f'https://techshop-backend-c7hy.onrender.com/api/updateUser/{user_id}'
        response = requests.put(api_url, json={
            'name': name,
            'address': address,
            'phone_number': phone_number
        })

        if response.status_code == 200:
            return JsonResponse({'message': 'Cập nhật thành công'})
        else:
            return JsonResponse({'error': 'Cập nhật thất bại'}, status=400)

    # Hiển thị trang profile
    user_id = request.session.get('user', {}).get('id')
    if not user_id:
        return redirect('/login')

    api_url = f'http://localhost:3000/api/getUserById/{user_id}'
    try:
        response = requests.get(api_url)
        response.raise_for_status()  # Kiểm tra mã trạng thái HTTP
        user_data = response.json()  # Phân tích dữ liệu JSON
    except requests.exceptions.HTTPError as http_err:
        return JsonResponse({'error': f'HTTP error occurred: {http_err}'}, status=500)
    except requests.exceptions.RequestException as req_err:
        return JsonResponse({'error': f'Request error occurred: {req_err}'}, status=500)
    except ValueError as json_err:
        return JsonResponse({'error': f'JSON decoding error: {json_err}'}, status=500)

    return render(request, 'userProfile.html', {'user': user_data})