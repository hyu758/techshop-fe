const products = JSON.parse(document.getElementById('products-data').textContent)
console.log('CHECKOUT', products)
function getCSRFToken() {
    return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
}

document.addEventListener('DOMContentLoaded', function () {
  const renderCart = (items) => {
    const cartItemsContainer = document.getElementById('cartItems')
    cartItemsContainer.innerHTML = ''

    items.forEach((item, index) => {
      const row = `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>${item.price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</td>
                  <td>${(item.quantity * item.price).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</td>
                </tr>
              `
      cartItemsContainer.insertAdjacentHTML('beforeend', row)
    })

    document.getElementById('totalPrice').textContent = getTotal(products).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })
  }

  const getTotal = (cart) => {
    return cart.reduce((total, item) => total + item.quantity * item.price, 0)
  }
  const getProductIdsAndQuantities = (items) => {
    const productIds = items.map((item) => item.id)
    const quantities = items.map((item) => item.quantity)
    return { productIds, quantities }
  }

  // Gửi yêu cầu POST đến API /createOrder
  const handleCheckout = async (e) => {
    e.preventDefault()

    // Lấy dữ liệu từ form
    const name = document.getElementById('name').value
    const email = document.getElementById('email').value // không bắt buộc theo API của bạn, nhưng có thể cần cho frontend
    const address = document.getElementById('address').value
    const phone = document.getElementById('phone').value

    // Lấy userId (giả định rằng userId được lưu trong localStorage hoặc session)
    const userId = localStorage.getItem('userId') // Thay bằng cách lấy userId chính xác trong ứng dụng của bạn

    // Kiểm tra nếu không có sản phẩm trong giỏ hàng
    if (products.length === 0) {
      Swal.fire('Thông báo', 'Giỏ hàng trống. Vui lòng thêm sản phẩm để tiếp tục.', 'warning')
      return
    }

    // Lấy productIds và quantities từ giỏ hàng
    const { productIds, quantities } = getProductIdsAndQuantities(products)

    // Chuẩn bị dữ liệu để gửi
    const orderData = {
      userId: userId,
      productIds: productIds,
      quantities: quantities,
      phone: phone,
      name: name,
      address: address
    }

    try {
      const response = await fetch('/api/createOrder/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCSRFToken() // Hàm để lấy CSRF token nếu dùng Django CSRF
        },
        body: JSON.stringify(orderData)
      })

      if (response.ok) {
        const result = await response.json()
        // Hiển thị thông báo thành công
        console.log(response)
        Swal.fire('Thành công', 'Đơn hàng của bạn đã được tạo thành công!', 'success').then(() => {
          window.location.href = '/' // Chuyển hướng tới trang xác nhận đơn hàng
        })
      } else {
        Swal.fire('Lỗi', 'Đã có lỗi xảy ra. Vui lòng thử lại.', 'error')
      }
    } catch (error) {
      console.error('Error:', error)
      Swal.fire('Lỗi', 'Không thể kết nối đến máy chủ. Vui lòng thử lại.', 'error')
    }
  }

  // Xử lý khi submit form checkout
  const checkoutForm = document.getElementById('checkoutForm')
  checkoutForm.addEventListener('submit', handleCheckout)
  const init = async () => {
    renderCart(products)
  }

  init()
})