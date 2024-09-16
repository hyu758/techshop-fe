function getCSRFToken() {
    return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
}
document.addEventListener('click', function (event) {
    if (event.target.matches('.cart-link')) {
        const productId = event.target.getAttribute('data-product-id');
        const quantity = 1; // Số lượng sản phẩm để thêm vào giỏ hàng
        console.log('ADD TO CART');
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
                console.log('Item added to cart:', data);

                // Hiển thị thông báo thành công
                Swal.fire({
                    icon: 'success',
                    title: 'Thành công!',
                    text: 'Sản phẩm đã được thêm vào giỏ hàng.',
                    position: 'top-end',
                    toast: true,
                    timer: 3000,
                    timerProgressBar: true,
                    showConfirmButton: false,
                    backdrop: true,

                });
            })
            .catch(error => {
                console.error('Error adding item to cart:', error);

                // Hiển thị thông báo lỗi
                Swal.fire({
                    icon: 'error',
                    title: 'Lỗi!',
                    text: 'Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng.',
                    position: 'top-end',
                    toast: true,
                    timer: 3000,
                    timerProgressBar: true,
                    showConfirmButton: false,
                    backdrop: true,
                });
            });
    }
});
