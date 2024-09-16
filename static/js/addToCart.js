function getCSRFToken() {
    return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
}
let isAddingToCart = false;
document.addEventListener('click', function (event) {
    if (event.target.matches('.cart-link')) {
        if (isAddingToCart) return;
        isAddingToCart = true;
        const productId = event.target.getAttribute('data-product-id');
        const quantity = 1; // Số lượng sản phẩm để thêm vào giỏ hàng

        fetch('/api/addToCart/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify({
                productId: productId,
                quantity: quantity
            }),
        })
        .then(response => response.json())
        .then(data => {
            console.log('ADD TO CART?', data)
            if (data.error === 'not_logged_in') {
                // Hiển thị popup yêu cầu đăng nhập
                Swal.fire({
                    title: 'Bạn chưa đăng nhập',
                    text: 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Đăng nhập',
                    cancelButtonText: 'Hủy'
                }).then((result) => {
                    if (result.isConfirmed) {
                        // Điều hướng đến trang đăng nhập
                        window.location.href = '/login/';
                    }
                });
            } else {
                // Hiển thị thông báo thêm vào giỏ hàng thành công
                Swal.fire({
                    title: 'Thành công!',
                    text: 'Sản phẩm đã được thêm vào giỏ hàng.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        })
        .catch(error => {
            console.error('Error adding item to cart:', error);
        })
        .finally(() => {
            isAddingToCart = false;  // Reset lại trạng thái
        });
    }
});
