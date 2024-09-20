const cartItems = JSON.parse(document.getElementById('cartItems').textContent);
const totalPrice = document.getElementById('totalPrice');
totalPrice.textContent = '0₫';
let selectedItems = [];
console.log(cartItems)
function getCSRFToken() {
    return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
}

function renderCartItems() {
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const checkboxesState = {};  // Lưu trạng thái của các checkbox

    document.querySelectorAll('.item-checkbox').forEach(checkbox => {
        checkboxesState[checkbox.getAttribute('data-id')] = checkbox.checked;
    });

    cartItemsContainer.innerHTML = "";  // Xóa sạch nội dung cũ trước khi render mới

    if (!cartItems) {
        return;
    }

    cartItems.forEach(item => {
        const isChecked = checkboxesState[item.id] || false;  // Lấy trạng thái checkbox lưu trữ
        const row = `
          <tr>
              <td>
                <input type="checkbox" class="item-checkbox" data-id="${item.id}" ${isChecked ? 'checked' : ''} />
              </td>
              <td style="width: 40%;">
                  <div class="d-flex align-items-center gap-4">
                        <img src="${item.image_url}" class="card-img-top border-2 w-50 mt-2 hidden sm:table-cell" alt="${item.name}" />
                        <a href="/product/${item.id}" class="product-name sm:text-base text-sm">${item.name}</a>
                  </div>
              </td>
              <td>
                  <div class="flex items-center">
                      <button class="btn btn-outline-primary d-sm-block d-none" onclick="decrement(${item.id})">-</button>
                      <input type="number" class="form-control mx-2 sm:text-base text-sm" value="${item.quantity}" onchange="handleChange(this.value, ${item.id})" style="width: 70px; text-align: center;" />
                      <button class="btn btn-outline-primary d-sm-block d-none" onclick="increment(${item.id})">+</button>
                  </div>
              </td>
              <td class="fw-semibold sm:text-base text-sm">${formatCurrency(item.price)}₫</td>
              <td class="d-sm-block d-none hidden sm:table-cell fw-semibold sm:text-base text-sm">${formatCurrency(item.quantity * item.price)}₫</td>
              <td>
                  <button class="btn btn-outline-primary sm:text-base text-sm" onclick="removeFromCart(${item.id})">Xóa</button>
              </td>
          </tr>
      `;
        cartItemsContainer.innerHTML += row;  // Thêm từng dòng vào bảng
    });
    
    // Cập nhật tổng giá cho các sản phẩm được chọn
    updateSelectedItems();
}

function updateSelectedItems() {
    selectedItems = [];
    console.log('select', selectedItems)
    let sum = 0;
    document.querySelectorAll('.item-checkbox:checked').forEach(checkbox => {
        const itemId = parseInt(checkbox.getAttribute('data-id'));
        const item = cartItems.find(item => item.id === itemId);
        if (item) {
            selectedItems.push(item);
        }
    });
    selectedItems.forEach(item =>{
        sum += item.quantity * item.price;
    })
    totalPrice.textContent = formatCurrency(sum) + '₫';
}

function increment(itemId) {
    let item = cartItems.find(item => item.id === itemId);
    if (item) {
        item.quantity++;
        renderCartItems();
    }
}

function decrement(itemId) {
    let item = cartItems.find(item => item.id === itemId);
    if (item && item.quantity > 1) {
        item.quantity--;
        renderCartItems();
    }
}

function handleChange(newQuantity, itemId) {
    // Chuyển đổi giá trị nhập vào thành số nguyên
    newQuantity = parseInt(newQuantity, 10);
    
    // Tìm sản phẩm trong giỏ hàng
    let item = cartItems.find(item => item.id === itemId);
    
    if (item) {
        // Kiểm tra và điều chỉnh số lượng nếu không hợp lệ
        if (newQuantity < 1){
            item.quantity = 1;
        }
        else{
            item.quantity = Math.min(newQuantity, item.stock_quantity)
        }
        renderCartItems();
    }
}

window.addEventListener('beforeunload', function () {
    updateCartItems();
});

function updateCartItems() {
    console.log('UPDATE CART ITEM')
    if (!cartItems) return;
    fetch('/api/updateCart/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({
            cartItems: cartItems
        }),
    })
    .then(response => response.json())
    .then(data => console.log('Cart updated:', data))
    .catch(error => console.error('Error updating cart:', error));
}

async function removeFromCart(itemId) {
    try {
        const response = await fetch(`/api/deleteFromCart`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify({
                productID: itemId
            })
        });

        if (response.ok) {
            const index = cartItems.findIndex(item => item.id === itemId);
            if (index > -1) {
                cartItems.splice(index, 1);
                console.log(`Xóa sản phẩm có ID: ${itemId}`);
                renderCartItems();  // Render lại giỏ hàng sau khi xóa
            }
        } else {
            console.error('Failed to delete item from cart:', await response.json());
        }
    } catch (error) {
        console.error('Error deleting item from cart:', error);
    }
}

function formatCurrency(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

async function removeAllItemsFromCart() {
    try {
        const response = await fetch('/api/deleteAllCart/', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            }
        });

        if (response.ok) {
            cartItems.length = 0; // Xoá tất cả các mục trong cartItems
            renderCartItems(); // Render lại giỏ hàng sau khi xóa
            Swal.fire(
                'Đã xoá!',
                'Tất cả sản phẩm đã được xoá.',
                'success'
            );
        } else {
            console.error('Failed to delete all items from cart:', await response.json());
        }
    } catch (error) {
        console.error('Error deleting all items from cart:', error);
    }
}

document.getElementById('deleteAllButton').addEventListener('click', function() {
    Swal.fire({
        title: 'Bạn có chắc chắn muốn xoá tất cả không?',
        text: "Hành động này sẽ không thể hoàn tác!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Xoá',
        cancelButtonText: 'Huỷ'
    }).then((result) => {
        if (result.isConfirmed) {
            removeAllItemsFromCart();
        }
    });
});

document.getElementById('selectAllCheckbox').addEventListener('change', function() {
    const isChecked = this.checked;
    console.log('check', isChecked)

    document.querySelectorAll('.item-checkbox').forEach(checkbox => {
        checkbox.checked = isChecked
    });
    updateSelectedItems()
});
document.getElementById('cartItemsContainer').addEventListener('change', function(e) {
    if (e.target.classList.contains('item-checkbox')) {
        updateSelectedItems(); // Cập nhật mảng selectedItems khi checkbox thay đổi
    }
});

document.getElementById('checkoutButton').addEventListener('click', function () {
    if (selectedItems.length === 0) {
        Swal.fire('Thông báo', 'Vui lòng chọn ít nhất một sản phẩm để thanh toán.', 'warning');
        return;
    }
    console.log('??', selectedItems)
    fetch('/checkout/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({ products: selectedItems })
    })
    .then(response => {
        if (response.ok) {
            // Sau khi gửi dữ liệu thành công, chuyển hướng tới trang checkout
            window.location.href = '/checkout/';
        } else {
            throw new Error('Checkout failed');
        }
    })
    .catch(error => {
        console.error('Checkout error:', error);
        Swal.fire('Lỗi', 'Đã có lỗi xảy ra trong quá trình check out.', 'error');
    });
});


// Khởi tạo giỏ hàng khi trang được tải
renderCartItems();
