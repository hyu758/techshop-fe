import requests
import json
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib import messages
import random

def format_currency(value):
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
        products.sort(key = lambda x: x['sold_quantity'])
        for product in products:
            product['price'] = format_currency(product['price'])
    else:
        products = []

    return render(request, 'home.html', {'products': products})

def shop(request):
    url = "https://techshop-backend-c7hy.onrender.com/api/getAllProducts"
    response = requests.get(url)
    
    if response.status_code == 200:
        products = response.json()
        for product in products:
            product['price'] = format_currency(product['price'])
    else:
        products = []
    return render(request, 'shop.html', {'products': products})

def api_get_all_products(request):
    url = "https://techshop-backend-c7hy.onrender.com/api/getAllProducts"
    response = requests.get(url)
    
    if response.status_code == 200:
        products = response.json()
        for product in products:
            product['price'] = format_currency(product['price'])
    else:
        products = []

    # Lấy category_id từ query params
    category_id = request.GET.get('category_id', '0')
    if category_id != '0':
        # Lọc sản phẩm theo category_id
        products = [product for product in products if product['category_id'] == int(category_id)]

    # Lấy page và page_size từ query params (mặc định là trang 1 và 9 sản phẩm mỗi trang)
    page = int(request.GET.get('page', 1))
    page_size = int(request.GET.get('page_size', 9))

    # Tính toán chỉ số bắt đầu và kết thúc cho trang hiện tại
    start_index = (page - 1) * page_size
    end_index = start_index + page_size

    # Lấy ra sản phẩm cho trang hiện tại
    paginated_products = products[start_index:end_index]

    # Trả về dữ liệu cùng với tổng số trang
    total_pages = (len(products) + page_size - 1) // page_size  # Tính tổng số trang
    data = {
        'products': paginated_products,
        'total_pages': total_pages,
        'current_page': page,
    }

    return JsonResponse(data)
