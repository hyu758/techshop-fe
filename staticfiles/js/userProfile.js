let isUploadingImage = false;
let isUpdatingProfile = false;
const showAlert = (message, type) => {
  Swal.fire({
    icon: type,
    title: message,
    showConfirmButton: true,
    timer: 3000
  });
};

document.getElementById('imageUploadForm').addEventListener('submit', function (event) {
  event.preventDefault(); // Ngăn chặn hành động gửi form mặc định
  if (isUploadingImage) return;
  isUploadingImage = true;
  const formData = new FormData(this);

  fetch("{% url 'upload_image' %}", {
      method: 'POST',
      headers: {
          'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
      },
      body: formData
  })
  .then(response => response.json())
  .then(data => {
      if (data.message) {
          // Cập nhật hình ảnh trên trang
          document.getElementById('avatar-preview').src = data.img_link;
          showAlert(data.message, 'success');
      } else if (data.error) {
          showAlert(data.error, 'error');
      }
  })
  .catch(error => {
      console.error('Error:', error);
      showAlert('An error occurred', 'error');
  })
  .finally(() => {
    isUploadingImage = false;  // Reset lại trạng thái
});
});

// Xử lý thông báo cập nhật thông tin người dùng
document.getElementById('profileForm').addEventListener('submit', function (event) {
  if (isUpdatingProfile) return;
  event.preventDefault(); // Ngăn chặn hành động gửi form mặc định
  isUpdatingProfile = true;
  const phoneInput = document.getElementById('phone_number');
  const phoneError = document.getElementById('phone-error');
  
  // Kiểm tra định dạng số điện thoại
  const phonePattern = /^[0-9]{10,15}$/; // Chỉ cho phép từ 10 đến 15 chữ số
  if (!phonePattern.test(phoneInput.value)) {
    phoneError.style.display = 'block'; // Hiển thị thông báo lỗi
    event.preventDefault(); // Ngăn chặn gửi form
    return;
  } else {
    phoneError.style.display = 'none'; // Ẩn thông báo lỗi nếu hợp lệ
  }
  const formData = new FormData(this);
  fetch("{% url 'profile' %}", {
      method: 'POST',
      headers: {
          'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
      },
      body: formData
  })
  .then(response => response.json())
  .then(data => {
      if (data.message) {
          showAlert(data.message, 'success');
      } else if (data.error) {
          showAlert(data.error, 'error');
      }
  })
  .catch(error => {
      console.error('Error:', error);
      showAlert('An error occurred', 'error');
  })
  .finally(() => {
    isUpdatingProfile = false;
  });
});

