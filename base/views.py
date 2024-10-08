import requests
import json
from django.shortcuts import render, redirect
from django.http import JsonResponse

def format_currency(value):
    if isinstance(value, str):
        value = value.replace(',', '')
    
    return "{:,.0f}".format(float(value))

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
    products_url = "https://techshop-backend-c7hy.onrender.com/api/getAllProducts"
    categories_url = "https://techshop-backend-c7hy.onrender.com/api/getAllCategoryNames"
    products_response = requests.get(products_url)
    categories_response = requests.get(categories_url)
    
    brands_set = set()

    if products_response.status_code == 200:
        products = products_response.json()
    
        for product in products:
            product['price'] = format_currency(product['price'])
            brands_set.add(product['brand'].strip())
        
        brands = sorted(brands_set)
    else:
        products = []
        brands = []

    if categories_response.status_code == 200:
        categories = categories_response.json()
    else:
        categories = []

    context = {
        'products': products,
        'brands': brands,
        'categories': categories,
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
    if (not request.session.get('user', {})):
        return redirect('login')
    if request.method == 'POST':
        user_id = request.session.get('user', {}).get('id')
        if not user_id:
            return JsonResponse({'error': 'User not logged in'}, status=401)

        # Lấy dữ liệu từ form
        name = request.POST.get('name')
        phone_number = request.POST.get('phone_number')
        address = request.POST.get('address')

        # Tạo payload cho API
        data = {
            'name': name,
            'phone_number': phone_number,
            'address': address,
        }
        print(data)
        api_url = f'https://techshop-backend-c7hy.onrender.com/api/updateUser/{user_id}'

        # Gửi yêu cầu đến API backend để cập nhật thông tin người dùng
        try:
            response = requests.put(api_url, json=data)

            if response.status_code == 200:
                return JsonResponse({'message': 'Profile updated successfully'})
            else:
                return JsonResponse({'error': 'Failed to update profile'}, status=400)
        except requests.exceptions.RequestException as e:
            return JsonResponse({'error': str(e)}, status=500)

    # Hiển thị thông tin user trong trang profile
    user_id = request.session.get('user', {}).get('id')
    if not user_id:
        return redirect('/login')

    api_url = f'https://techshop-backend-c7hy.onrender.com/api/getUserById/{user_id}'
    try:
        response = requests.get(api_url)
        response.raise_for_status()
        user_data = response.json()
        print(user_data)
    except requests.exceptions.RequestException as req_err:
        return JsonResponse({'error': f'Request error occurred: {req_err}'}, status=500)

    return render(request, 'userProfile.html', {'user': user_data})


def upload_image(request):
    if request.method == 'POST':
        user_id = request.session.get('user', {}).get('id')
        if not user_id:
            return JsonResponse({'error': 'User not logged in'}, status=401)

        avatar = request.FILES.get('img')
        if avatar:
            # Tạo đối tượng FormData để gửi dữ liệu
            files = {'img': avatar}
            data = {'user_id': user_id}  # Thêm user_id vào dữ liệu gửi đi
            
            api_url = 'https://techshop-backend-c7hy.onrender.com/api/uploadImage'  # Đảm bảo URL chính xác

            try:
                response = requests.post(api_url, files=files, data=data)  # Gửi cả files và data
                if response.status_code == 200:
                    result = response.json()
                    return JsonResponse({'message': 'Avatar updated successfully', 'img_link': result['img_link']})
                else:
                    return JsonResponse({'error': 'Failed to update avatar'}, status=400)

            except requests.exceptions.RequestException as e:
                return JsonResponse({'error': str(e)}, status=500)
        else:
            return JsonResponse({'error': 'No avatar provided'}, status=400)

    return redirect('/profile')

#CART

def cart(request):
    if (not request.session.get('user', {})):
        return redirect('login')
    userId = request.session.get('user', {}).get('id')

    print("cart user:", userId)

    if userId is None :
        return JsonResponse({'error': 'Missing userId '}, status=400)

    # url = f"https://techshop-backend-c7hy.onrender.com/api/getOrderItemByUserAndStatus/{userId}/{status}"
    url = f"https://techshop-backend-c7hy.onrender.com/api/getCartByUserId/{userId}"
    
    try:
        response = requests.get(url)
        response.raise_for_status() 
        
        print("cart user try:", userId)

        if response.status_code == 200:
            data = response.json() 
            print(data)
            context = {
                'cartItems': data  
            }
        else:
            context = {
                'error': 'Unable to fetch orders at the moment.'
            }
    except requests.RequestException as e:
        # Handle request exceptions
        context = {
            'error': f'An error occurred: {str(e)}'  # Display the exception message
        }
        
        print(context)

    # Render the 'cart.html' template with the context
    return render(request, 'cart.html', context)

def updateCart(request):
    if request.method == 'POST':
        try:
            # Lấy dữ liệu từ yêu cầu POST
            data = json.loads(request.body)
            user_id = request.session.get('user', {}).get('id')
            cart_items = data.get('cartItems')
            print('updateCart', user_id)
            if not user_id or not cart_items:
                return JsonResponse({'error': 'Invalid data'}, status=400)

            # Gọi API để cập nhật giỏ hàng
            for item in cart_items:
                product_id = item['product_id']
                quantity = item['quantity']

                # Giả sử bạn có một endpoint trong API để cập nhật giỏ hàng
                url = f'https://techshop-backend-c7hy.onrender.com/api/updateCart/{user_id}'
                payload = {
                    'productId': product_id,
                    'quantity': quantity
                }

                response = requests.post(url, json=payload)

                if response.status_code != 200:
                    return JsonResponse({'error': 'Failed to update cart'}, status=500)

            return JsonResponse({'message': 'Cart updated successfully'}, status=200)

        except Exception as e:
            print(f"Error: {e}")
            return JsonResponse({'error': 'An error occurred while updating the cart'}, status=500)

    return JsonResponse({'error': 'Invalid request method'}, status=400)

def deleteFromCart(request):
    if (request.method == 'DELETE'):
        try:
            user_id = request.session.get('user', {}).get('id')
            productId = json.loads(request.body)
            print(productId)
            url = f'https://techshop-backend-c7hy.onrender.com/api/deleteFromCart/{user_id}'

            payload = {
                'productId' : productId['productID']
            }
            response = requests.delete(url, json=payload)
            if response.status_code != 200:
                return JsonResponse({'error': 'Failed to update cart'}, status=500)

            return JsonResponse({'message': 'Cart updated successfully'}, status=200)
        except Exception as e:
            print(f"Error: {e}")
            return JsonResponse({'error': 'An error occurred while updating the cart'}, status=500)

    return JsonResponse({'error': 'Invalid request method'}, status=400)


def add_to_cart(request):
    if request.method == 'POST':
        if (not request.session.get('user', {})):
            print('ALO?')
            return JsonResponse({'error': 'not_logged_in'}, status=403)

        user_id = request.session.get('user', {}).get('id')
        data = json.loads(request.body)
        product_id = data.get('productId')
        quantity = data.get('quantity')
        payload = {
            'userId' : user_id,
            'productId': product_id,
            'quantity': quantity
        }
        print(payload)
        url = f"https://techshop-backend-c7hy.onrender.com/api/addToCart"
        try:
            response = requests.post(url, json = payload)
            if response.status_code != 200:
                return JsonResponse({'error': 'Failed to update cart'}, status=500)

            return JsonResponse({'message': 'Add to cart successfully'}, status=200)
        except Exception as e:
            print(f"Error: {e}")
            return JsonResponse({'error': 'An error occurred while add to cart'}, status=500)

    return JsonResponse({'error': 'Invalid request method'}, status=400)

def deleteAllCart(request):
    if request.method == "DELETE":
        user_id = request.session.get('user', {}).get('id')
        print('DELETE ALL CART', user_id)
        url = f"https://techshop-backend-c7hy.onrender.com/api/deleteAllCart/{user_id}"
        try:
            response = requests.delete(url)
            print(response)
            if response.status_code != 200:
                return JsonResponse({'error': 'Failed to delete all cart'}, status=500)
            return JsonResponse({'messages': 'Delete all cart successfully'})
        except Exception as e:
            print(f"Error: {e}")
        return JsonResponse({'error': 'An error occurred while deleting the cart'}, status=500)

    return JsonResponse({'error': 'Invalid request method'}, status=400)

#CHECKOUT
def checkout(request):
    if (not request.session.get('user', {})):
        return redirect('login')
    if request.method == 'POST':
        try:
            # Giải mã dữ liệu JSON từ request body
            data = json.loads(request.body)
            products = data.get('products', [])

            # Lưu sản phẩm vào session
            request.session['selected_products'] = products

            # Trả về phản hồi JSON, sau đó chuyển hướng từ frontend
            return JsonResponse({'message': 'Checkout successful'}, status=200)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
    
    # Nếu là GET request, hiển thị trang checkout với dữ liệu từ session
    selected_products = request.session.get('selected_products', [])
    context = {'products': selected_products}
    
    return render(request, 'checkout.html', context)

def createOrder(request):
    if request.method == 'POST':
        try:
            # Giải mã dữ liệu JSON từ request body
            data = json.loads(request.body)
            userId = request.session.get('user', {}).get('id')
            productIds = data.get('productIds', [])
            quantities = data.get('quantities', [])
            phone = data.get('phone')
            name = data.get('name')
            address = data.get('address')

            # Xây dựng dữ liệu để gửi đến API bên ngoài
            api_data = {
                'userId': userId,
                'productIds': productIds,
                'quantities': quantities,
                'phone': phone,
                'name': name,
                'address': address
            }


            # Gửi yêu cầu đến API bên ngoài
            api_url = 'https://techshop-backend-c7hy.onrender.com/api/orderItem'
            # api_url = 'http://127.0.0.1:3000/api/orderItem'
            response = requests.post(api_url, json=api_data)

            # Xử lý phản hồi từ API
            if response.status_code == 200:
                jsonData = response.json()    
                paymentUrl = jsonData.get('paymentUrl')
                return JsonResponse({'message': 'Order created successfully', 'paymentUrl': paymentUrl}, status=200)
            else:
                # Nếu API trả về lỗi, truyền lỗi về cho frontend
                return JsonResponse({'error': 'Failed to create order', 'details': response.json()}, status=response.status_code)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except requests.RequestException as e:
            return JsonResponse({'error': 'Error while connecting to the external API', 'details': str(e)}, status=500)

    return JsonResponse({'error': 'Method not allowed'}, status=405)



def orderHistory(request):
    if (not request.session.get('user', {})):
        return redirect('login')
    userId = request.session.get('user', {}).get('id')
    
    api_url = f'https://techshop-backend-c7hy.onrender.com/api/getOrderByUser/{userId}'
    
    try:
        response = requests.get(api_url)
        response.raise_for_status()
        data = response.json()
    except requests.exceptions.HTTPError as http_err:
        data = []
    except requests.exceptions.RequestException as req_err:
        data = []
    
    
    context = {
        'orders': data,
    }
    
    print(context)
    return render(request, 'orderHistory.html', context)

def rateProduct(request):
    if request.method == 'POST':
        try:
            # Lấy dữ liệu từ body của yêu cầu
            data = json.loads(request.body)
            product_id = data.get('productId')
            rating = data.get('rating')
            order_id = data.get('orderId')  # Thêm orderId nếu cần
            print(f"Product ID: {product_id}, Rating: {rating}, Order ID: {order_id}")

            if not product_id or rating is None:
                return JsonResponse({'error': 'Product ID and rating are required'}, status=400)

            # URL API với dữ liệu từ body
            api_url = 'https://techshop-backend-c7hy.onrender.com/api/rateProduct'

            payload = {
                'productId': product_id,
                'rating': rating,
                'orderId': order_id  # Gửi orderId nếu cần
            }
            print(payload)
            # Gửi request đến API
            response = requests.post(api_url, json=payload)

            if response.status_code == 200:
                return JsonResponse({'message': 'Product rating updated successfully', 'product': response.json()})
            else:
                return JsonResponse({'error': 'Failed to update product rating'}, status=response.status_code)

        except requests.exceptions.RequestException as e:
            print(f"Request Error: {e}")
            return JsonResponse({'error': 'Internal server error'}, status=500)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON format'}, status=400)
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=405)


def user(request):
    user_id = request.session.get('user', {}).get('id')
    if not user_id:
        return render(request, 'userMobile.html')

    api_url = f'https://techshop-backend-c7hy.onrender.com/api/getUserById/{user_id}'
    try:
        response = requests.get(api_url)
        response.raise_for_status()
        user_data = response.json()
        print(user_data)
    except requests.exceptions.RequestException as req_err:
        return JsonResponse({'error': f'Request error occurred: {req_err}'}, status=500)
    return render(request, 'userMobile.html', {'user':user_data})


def changePassword(request):
    if request.method == 'PUT':
        print('doi mk')
        try:
            data = json.loads(request.body)
            current_password = data.get('old_password')
            new_password = data.get('new_password')
            email = request.session['user']['email']  # Lấy email từ session
            print(current_password, email)
            # Kiểm tra mật khẩu cũ thông qua API
            login_api_url = 'https://techshop-backend-c7hy.onrender.com/api/login'  # Đảm bảo URL chính xác
            login_response = requests.post(login_api_url, json={
                'email': email,
                'password': current_password
            })

            if login_response.status_code != 200:
                return JsonResponse({'error': 'Mật khẩu cũ không chính xác.'}, status=400)

            # Gửi yêu cầu đến API để thay đổi mật khẩu
            change_password_api_url = 'https://techshop-backend-c7hy.onrender.com/api/changeUserPwd'  # Đảm bảo URL chính xác
            response = requests.put(change_password_api_url, json={
                'email': email,
                'currentPassword': current_password,
                'newPassword': new_password
            })

            if response.status_code == 200:
                return JsonResponse({'message': 'Mật khẩu đã được cập nhật thành công.'})
            else:
                error_data = response.json()
                return JsonResponse({'error': error_data.get('error', 'Đã xảy ra lỗi.')}, status=response.status_code)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

    # Nếu là phương thức GET, hiển thị trang đổi mật khẩu
    return render(request, 'changePassword.html')

