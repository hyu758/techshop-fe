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

  // Hàm để kiểm tra số điện thoại có hợp lệ hay không
  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/; // Regex cho số điện thoại Việt Nam
    return phoneRegex.test(phone);
  }

  // Gửi yêu cầu POST đến API /createOrder
  const handleCheckout = async (e) => {
    e.preventDefault()

    // Lấy dữ liệu từ form
    const name = document.getElementById('name').value
    const email = document.getElementById('email').value
    const address = document.getElementById('address').value
    const phone = document.getElementById('phone').value

    // Kiểm tra nếu không có sản phẩm trong giỏ hàng
    if (products.length === 0) {
      Swal.fire('Thông báo', 'Giỏ hàng trống. Vui lòng thêm sản phẩm để tiếp tục.', 'warning')
      return
    }

    // Kiểm tra tính hợp lệ của số điện thoại
    if (!validatePhoneNumber(phone)) {
      Swal.fire('Lỗi', 'Số điện thoại không hợp lệ. Vui lòng nhập đúng số điện thoại.', 'error')
      return
    }

    // Lấy productIds và quantities từ giỏ hàng
    const { productIds, quantities } = getProductIdsAndQuantities(products)

    // Chuẩn bị dữ liệu để gửi
    const orderData = {
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
          'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify(orderData)
      })

      if (response.ok) {
        const result = await response.json();
        console.log(result.paymentUrl);
        Swal.fire('Thành công', 'Đơn hàng của bạn đã được tạo thành công! \nBạn sẽ được chuyển đến trang thanh toán.', 'success').then(() => {
          setTimeout(() => {
            window.location.href = result.paymentUrl; // Chuyển hướng đến paymentUrl
          }, 1234); // 1,234 giây
        });
      } else {
        const errorResult = await response.json();
        Swal.fire('Lỗi', errorResult.error || 'Đã có lỗi xảy ra. Vui lòng thử lại.', 'error');
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
