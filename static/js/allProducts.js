function parsePrice(priceString) {
    // Loại bỏ dấu phân cách hàng nghìn và chuyển đổi thành số
    return parseFloat(priceString.replace(/,/g, ''));
}

let products = [];
const productsData = JSON.parse(document.getElementById('products-data').textContent);
products = productsData;

// Khi trang được tải, lấy dữ liệu sản phẩm từ thẻ script và lưu vào biến toàn cục
document.addEventListener('DOMContentLoaded', function () {
    const preloader = document.querySelector('.spinner-wrapper');
    const paginationContainer = document.querySelector('.pagination.loop-pagination');
    const productList = document.querySelector('#product-list');
    const priceFilters = document.querySelectorAll('.widget-price-filter a');
    const brandFilters = document.querySelectorAll('.widget-product-brands .tags-item a');
    let currentPage = 1;
    const pageSize = 9; // Số sản phẩm trên mỗi trang
    let currentPriceRange = '';
    let currentCategoryId = '0'; // Thay đổi nếu cần
    let currentBrand = ''; // Thay đổi theo thương hiệu

    function applyFilters() {
        console.log('Products:', products);
        console.log('Current Price Range:', currentPriceRange);
        console.log('Current Brand:', currentBrand);
        console.log('Current Category ID:', currentCategoryId);

        // Lọc sản phẩm dựa trên các tiêu chí
        const filteredProducts = products.filter(product => {
            const [minPrice, maxPrice] = currentPriceRange.split('-').map(Number);
            const inPriceRange = parsePrice(product.price) >= (parseInt(minPrice) || 0) && parsePrice(product.price) <= (parseInt(maxPrice) || Infinity);
            const inBrand = currentBrand ? product.brand === currentBrand : true;
            const inCategory = currentCategoryId === '0' || product.category_id === parseInt(currentCategoryId, 10);

            return inPriceRange && inBrand && inCategory;
        });

        // Xác định số lượng trang
        const totalPages = Math.ceil(filteredProducts.length / pageSize);
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = currentPage * pageSize;

        // Chỉ lấy sản phẩm trong khoảng trang hiện tại
        const productsToDisplay = filteredProducts.slice(startIndex, endIndex);

        // Xây dựng HTML cho sản phẩm
        let productHTML = '';
        productsToDisplay.forEach(product => {
            let rating = getRating(product.rating);
            productHTML += `
                <div class="product-item col-lg-4 col-md-6 col-sm-6" style="margin-bottom: 80px !important" data-category-id="${product.category_id}">
                  <div class="image-holder">
                    <a href="/product/${product.id}/">
                      <img src="${product.image_url}" alt="${product.name}" class="product-image">
                    </a>
                  </div>
                  <div class="cart-concern border-1">
                    <div class="cart-button d-flex justify-content-between align-items-center">
                      <button type="button" class="btn-wrap cart-link d-flex align-items-center">add to cart <i class="icon icon-arrow-io"></i></button>
                      <button type="button" class="view-btn tooltip d-flex">
                        <i class="icon icon-screen-full"></i>
                        <span class="tooltip-text">Quick view</span>
                      </button>
                      <button type="button" class="wishlist-btn">
                        <i class="icon icon-heart"></i>
                      </button>
                    </div>
                  </div>
                  <div class="product-detail">
                    <h3 class="product-title">
                      <a href="/product/${product.id}/">${product.name}</a>
                    </h3>
                    <div class="d-flex align-items-center gap-2 mb-2">
                      <div class="d-flex rating">
                        ${rating}
                      </div>
                      <div class="fs-6 text-secondary px-2 border-start">Đã bán: ${product.sold_quantity}</div>
                    </div>
                    <div class="item-price text-danger fs-4 fw-semibold">${product.price}₫</div>
                  </div>
                </div>
              `;
        });

        // Cập nhật nội dung danh sách sản phẩm
        productList.innerHTML = productHTML;

        // Hiển thị/ẩn loader
        preloader.classList.add('d-none');
        preloader.classList.remove('d-block');

        // Cập nhật phân trang
        renderPagination(totalPages);
    }

    function renderPagination(totalPages) {
        paginationContainer.innerHTML = '';
    
        for (let page = 1; page <= totalPages; page++) {
            const pageButton = document.createElement('a');
            pageButton.classList.add('page-numbers');
            if (page === currentPage) {
                pageButton.classList.add('current');
            }
            pageButton.textContent = page;
    
            pageButton.addEventListener('click', function () {
                currentPage = page;
                applyFilters(); // Gọi applyFilters để cập nhật sản phẩm trên trang
            });
    
            paginationContainer.appendChild(pageButton);
        }
    
        // Thêm các nút 'Previous' và 'Next'
        if (currentPage > 1) {
            const prevButton = document.createElement('a');
            prevButton.classList.add('pagination-arrow', 'd-flex', 'align-items-center');
            prevButton.innerHTML = '<i class="icon icon-arrow-left"></i>';
            prevButton.addEventListener('click', function () {
                currentPage--;
                applyFilters();
            });
            paginationContainer.prepend(prevButton);
        }
    
        if (currentPage < totalPages) {
            const nextButton = document.createElement('a');
            nextButton.classList.add('pagination-arrow', 'd-flex', 'align-items-center');
            nextButton.innerHTML = '<i class="icon icon-arrow-right"></i>';
            nextButton.addEventListener('click', function () {
                currentPage++;
                applyFilters();
            });
            paginationContainer.appendChild(nextButton);
        }
    }
    
    // Xử lý sự kiện click cho các tab lọc sản phẩm
    const tabs = document.querySelectorAll('.tabs .tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            const categoryId = this.getAttribute('cate-id');
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            currentCategoryId = categoryId;
            currentPage = 1;
            applyFilters();
        });
    });

    // Xử lý sự kiện click cho các bộ lọc giá
    priceFilters.forEach(filter => {
        filter.addEventListener('click', function (event) {
            event.preventDefault();
            // Lấy khoảng giá từ thuộc tính data-price-filter
            let priceRange = this.getAttribute('data-price-filter');
            // Tách giá từ khoảng giá
            let [min, max] = priceRange.split('-').map(Number);

            // Cập nhật khoảng giá
            currentPriceRange = `${min * 1000000}-${max * 1000000}`;
            console.log("currentPriceRange", currentPriceRange);

            // Đánh dấu filter giá hiện tại
            priceFilters.forEach(pf => pf.classList.remove('active'));
            this.classList.add('active');
            currentPage = 1;
            applyFilters();
        });
    });

    // Xử lý sự kiện click cho nút áp dụng khoảng giá
    document.getElementById('apply-price-filter').addEventListener('click', function () {
        const minPrice = parseFloat(document.getElementById('price-min').value) || 0;
        const maxPrice = parseFloat(document.getElementById('price-max').value) || 999999999; // Giá tối đa lớn hơn bất kỳ giá sản phẩm nào

        // Cập nhật khoảng giá
        currentPriceRange = `${minPrice}-${maxPrice}`;
        console.log("currentPriceRange", currentPriceRange);

        // Đánh dấu filter giá hiện tại
        priceFilters.forEach(pf => pf.classList.remove('active'));
        currentPage = 1;
        applyFilters();
    });

    // Xử lý sự kiện click cho các bộ lọc thương hiệu
    brandFilters.forEach(filter => {
        filter.addEventListener('click', function (event) {
            event.preventDefault();
            // Lấy brand từ thuộc tính href
            const brand = this.textContent.trim();

            // Cập nhật brand hiện tại
            currentBrand = brand;

            // Đánh dấu filter thương hiệu hiện tại
            brandFilters.forEach(bf => bf.classList.remove('active'));
            this.classList.add('active');

            // Cập nhật các sản phẩm và phân trang
            currentPage = 1;
            applyFilters();
        });
    });

    // Xử lý phân trang
    function updatePagination() {
        // Lấy số lượng sản phẩm hiện tại
        const productsData = JSON.parse(document.getElementById('products-data').textContent);
        const filteredProducts = productsData.filter(product => {
            // Áp dụng các bộ lọc hiện tại
            const minPrice = parseFloat(currentPriceRange.split('-')[0]) || 0;
            const maxPrice = parseFloat(currentPriceRange.split('-')[1]) || Infinity;
            const inPriceRange = product.price >= minPrice && product.price <= maxPrice;

            const inBrand = currentBrand ? product.brand === currentBrand : true;
            const inCategory = currentCategoryId === '0' || product.category_id === currentCategoryId;

            return inPriceRange && inBrand && inCategory;
        });

        // Tính số trang dựa trên số lượng sản phẩm và kích thước trang
        const totalPages = Math.ceil(filteredProducts.length / pageSize);

        // Cập nhật nội dung phân trang
        const paginationContainer = document.querySelector('.pagination.loop-pagination');
        paginationContainer.innerHTML = '';

        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('a');
            pageButton.classList.add('page-numbers');
            if (i === currentPage) {
                pageButton.classList.add('current');
            }
            pageButton.textContent = i;

            pageButton.addEventListener('click', function () {
                currentPage = i;
                applyFilters();
            });

            paginationContainer.appendChild(pageButton);
        }
    }

    // Lần đầu tiên áp dụng bộ lọc
    applyFilters();
});
