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

def api_get_all_products(request):
    url = "https://techshop-backend-c7hy.onrender.com/api/getAllProducts"
    response = requests.get(url)
    
    if response.status_code == 200:
        products = response.json()
        for product in products:
            product['price'] = float(product['price'])
    else:
        products = []

    # Lấy category_id từ query params
    category_id = request.GET.get('category_id', '0')
    if category_id != '0':
        # Lọc sản phẩm theo category_id
        products = [product for product in products if product['category_id'] == int(category_id)]

    # Xử lý price_range
    price_range = request.GET.get('price_range', '')
    if price_range:
        try:
            price_from, price_to = map(float, price_range.split('-'))
            products = [product for product in products if price_from <= product['price'] <= price_to]
        except ValueError:
            products = []

    # Lọc theo thương hiệu
    brand = request.GET.get('brand', '')
    if brand:
        products = [product for product in products if product['brand'].lower() == brand.lower()]

    # Lấy page và page_size từ query params (mặc định là trang 1 và 9 sản phẩm mỗi trang)
    page = int(request.GET.get('page', 1))
    page_size = int(request.GET.get('page_size', 9))

    # Tính toán chỉ số bắt đầu và kết thúc cho trang hiện tại
    start_index = (page - 1) * page_size
    end_index = start_index + page_size

    # Lấy ra sản phẩm cho trang hiện tại
    paginated_products = products[start_index:end_index]

    # Định dạng lại giá cho các sản phẩm trong trang hiện tại
    for product in paginated_products:
        product['price'] = format_currency(product['price'])

    # Trả về dữ liệu cùng với tổng số trang
    total_pages = (len(products) + page_size - 1) // page_size  # Tính tổng số trang
    data = {
        'products': paginated_products,
        'total_pages': total_pages,
        'current_page': page,
    }

    return JsonResponse(data)


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