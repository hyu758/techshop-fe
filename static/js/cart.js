
const cartItems = JSON.parse(document.getElementById('cartItems').textContent)
console.log(cartItems)

function renderCartItems() {
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const totalPrice = document.getElementById('totalPrice');
    cartItemsContainer.innerHTML = "";  // Xóa sạch nội dung cũ trước khi render mới
    let sum = 0;
    cartItems.forEach(item => {
        const row = `
          <tr>
              <td style="width: 25%;">
                  <a href="/product/${item.id}" class="product-name">${item.name}</a>
                  <img src="${item.image_url}" class="card-img-top border-2 w-25 mt-2 hidden sm:table-cell" alt="${item.name}" />
              </td>
              <td>
                  <div class="flex items-center">
                      <button class="btn btn-outline-primary" onclick="decrement(${item.id})">-</button>
                      <input type="number" class="form-control mx-2" value="${item.quantity}" onchange="handleChange(this.value, ${item.id})" style="width: 75px; text-align: center;" min="1" />
                      <button class="btn btn-outline-primary" onclick="increment(${item.id})">+</button>
                  </div>
              </td>
              <td>${formatCurrency(item.price)}₫</td>
              <td class="hidden sm:table-cell">${formatCurrency(item.quantity * item.price)}₫</td>
              <td>
                  <button class="btn btn-outline-primary" onclick="removeFromCart(${item.id})">Xóa</button>
              </td>
          </tr>
      `;
        cartItemsContainer.innerHTML += row;  // Thêm từng dòng vào bảng
        sum += item.quantity * item.price;
    });
    totalPrice.textContent = formatCurrency(sum) + '₫';
}
function increment(itemId) {
    let item = cartItems.find(item => item.id === itemId);
    if (item) {
        item.quantity++;
        renderCartItems()
    }
}

function decrement(itemId) {
    let item = cartItems.find(item => item.id === itemId);
    if (item && item.quantity > 1) {
        item.quantity--;
        renderCartItems()
    }
}

function handleChange(newQuantity, itemId) {
    let item = cartItems.find(item => item.id === itemId);
    if (item && newQuantity >= 1) {
        item.quantity = newQuantity;
        renderCartItems()
    }
}

window.addEventListener('beforeunload', function () {
    updateCartItems();
});

function updateCartItems() {
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
                'X-CSRFToken': getCSRFToken()  // Thêm CSRF token vào header nếu cần
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

// Khởi tạo giỏ hàng khi trang được tải
renderCartItems();