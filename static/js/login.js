function getCSRFToken() {
    return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
}
document.getElementById('loginForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());


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
                title: 'Đăng nhập thành công!',
                text: 'Bạn sẽ được chuyển đến trang chủ.'
            }).then(() => {
                window.location.href = '/';
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Đăng nhập thất bại!',
                text: result.error || 'Email hoặc mật khẩu không chính xác.'
            });
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Lỗi kết nối!',
            text: 'Không thể kết nối tới server.'
        });
    }
});
