function getCSRFToken() {
  return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
}
const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;

function isEmailValid(email) {
  // Check if the email is defined and not too long
  if (!email || email.length > 254) return false;

  // Use a regex check for the standard email format
  if (!emailRegex.test(email)) return false;

  // Split into local part and domain part
  const parts = email.split("@");
  if (parts.length !== 2) return false; // Đảm bảo có đúng 1 '@'

  const localPart = parts[0];
  const domainPart = parts[1];

  // Kiểm tra độ dài phần tên
  if (localPart.length < 1 || localPart.length > 64) return false;

  // Kiểm tra độ dài và nội dung của phần tên miền
  const domainParts = domainPart.split(".");
  if (domainParts.length < 2) return false; // Phần tên miền phải có ít nhất 2 phần
  if (domainParts.some(part => part.length < 1 || part.length > 63)) return false;

  // Nếu tất cả các kiểm tra đều vượt qua, email là hợp lệ
  return true;
}


document.getElementById('registerForm').addEventListener('submit', async function (event) {
  event.preventDefault();

  const formData = new FormData(this);
  const data = Object.fromEntries(formData.entries());
  // Kiểm tra tính hợp lệ của email
  if (!isEmailValid(data.email)) {
    Swal.fire({
      icon: 'error',
      title: 'Lỗi!',
      text: 'Địa chỉ email không hợp lệ.'
    });
    return; // Ngăn chặn gửi form nếu email không hợp lệ
  }

  try {
    const response = await fetch(this.action, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCSRFToken()
      }
    });

    const result = await response.json();

    if (response.ok) {
      Swal.fire({
        icon: 'success',
        title: 'Đăng ký thành công!',
        text: result.message || 'Bạn có thể đăng nhập.'
      }).then(() => {
        window.location.href = '/login';
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: result.error || 'Đã có lỗi xảy ra.'
      });
    }
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Lỗi!',
      text: 'Không thể kết nối tới server.'
    });
  }
});
