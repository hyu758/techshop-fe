function getCSRFToken() {
    return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
  }
document.getElementById('registerForm').addEventListener('submit', async function (event) {
    event.preventDefault()
  
    const formData = new FormData(this)
    const data = Object.fromEntries(formData.entries())
    console.log(data) // Kiểm tra dữ liệu trước khi gửi
  
    try {
      const response = await fetch(this.action, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCSRFToken()
        }
      })
  
      const result = await response.json()
  
      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Đăng ký thành công!',
          text: result.message || 'Bạn có thể đăng nhập.'
        }).then(() => {
          window.location.href = '/login'
        })
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: result.error || 'Đã có lỗi xảy ra.'
        })
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Không thể kết nối tới server.'
      })
    }
  })