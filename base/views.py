import requests
from django.shortcuts import render, redirect
from django.http import JsonResponse

def test(request):
    return render(request, 'base.html')
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

    return render(request, 'login.html')

def home(request):
    return render(request, 'home.html')