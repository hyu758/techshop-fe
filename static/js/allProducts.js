function parsePrice(priceString) {
    // Loại bỏ dấu phân cách hàng nghìn và chuyển đổi thành số
    return parseFloat(priceString.replace(/,/g, ''));
}
function getCSRFToken() {
    return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
}
let products = [];
const productsData = JSON.parse(document.getElementById('products-data').textContent);
products = productsData;

document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const cateid = urlParams.get('cateid');
    const br = urlParams.get('brand')
    const resetFiltersButton = document.getElementById('reset-filters');
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const searchResultsPanel = document.getElementById('search-results-panel');
    const preloader = document.querySelector('.spinner-wrapper');
    const paginationContainer = document.querySelector('.pagination.loop-pagination');
    const productList = document.querySelector('#product-list');
    const priceFilters = document.querySelectorAll('.widget-price-filter a');
    const brandFilters = document.querySelectorAll('.widget-product-brands .tags-item a');
    const applyPriceFilterButton = document.getElementById('apply-price-filter');
    const tabs = document.querySelectorAll('.tabs .tab');
    const sortSelect = document.getElementById('sort-select');
    const sortOptions = sortSelect.querySelectorAll('option');

    let products = JSON.parse(document.getElementById('products-data').textContent);
    let currentPage = 1;
    const pageSize = 9; // Số sản phẩm trên mỗi trang
    let currentPriceRange = '';
    let currentCategoryId = '0';
    let currentBrand = '';
    let searchQuery = '';
    let currentSortOrder = 'name-asc';

    if (cateid) {
        tabs.forEach(tab => {
            if (tab.getAttribute('cate-id') === cateid) {
                tab.classList.add('active');
                // Cập nhật currentCategoryId để áp dụng filter đúng
                currentCategoryId = cateid;
            } else {
                tab.classList.remove('active');
            }
        });
    }
    if (br) {
        brandFilters.forEach(filter => {
            if (filter.textContent.trim() === br) {
                filter.classList.add('active');
                currentBrand = br;
            } else {
                filter.classList.remove('active');
            }
        });
    }
    function parsePrice(priceString) {
        return parseFloat(priceString.replace(/,/g, ''));
    }

    function applyFilters() {
        console.log('Products:', products);
        console.log('Current Price Range:', currentPriceRange);
        console.log('Current Brand:', currentBrand);
        console.log('Current Category ID:', currentCategoryId);
        console.log('Search Query:', searchQuery);

        const [minPrice, maxPrice] = currentPriceRange.split('-').map(Number);
        const filteredProducts = products.filter(product => {
            const price = parsePrice(product.price);
            const inPriceRange = price >= (minPrice || 0) && price <= (maxPrice || Infinity);
            const inBrand = currentBrand ? product.brand === currentBrand : true;
            const inCategory = currentCategoryId === '0' || product.category_id === parseInt(currentCategoryId, 10);
            const matchesSearchQuery = product.name.toLowerCase().includes(searchQuery.toLowerCase().trim());

            return inPriceRange && inBrand && inCategory && matchesSearchQuery;
        });
        filteredProducts.sort((a, b) => {
            if (currentSortOrder === 'name-asc') {
                return a.name.localeCompare(b.name);
            } else if (currentSortOrder === 'name-desc') {
                return b.name.localeCompare(a.name);
            } else if (currentSortOrder === 'price-asc') {
                return parsePrice(a.price) - parsePrice(b.price);
            } else if (currentSortOrder === 'price-desc') {
                return parsePrice(b.price) - parsePrice(a.price);
            }
            return 0;
        });
        const totalPages = Math.ceil(filteredProducts.length / pageSize);
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = currentPage * pageSize;
        const productsToDisplay = filteredProducts.slice(startIndex, endIndex);

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
                      <button type="button" class="btn-wrap cart-link d-flex align-items-center" data-product-id="${product.id}">add to cart <i class="icon icon-arrow-io"></i></button>
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

        productList.innerHTML = productHTML;
        preloader.classList.add('d-none');
        preloader.classList.remove('d-block');
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
                applyFilters();
            });
            paginationContainer.appendChild(pageButton);
        }

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

    function displaySearchResults(results) {
        searchResultsPanel.innerHTML = '';
        if (results.length > 0) {
            results.forEach(result => {
                const resultItem = document.createElement('div');
                resultItem.classList.add('search-result-item');
                resultItem.innerHTML = `
                <div class="card mb-3" style="max-width: 540px;">
                  <div class="row g-0">
                    <div class="col-md-4 image-holder d-flex align-items-center justify-content-center px-2">
                        <a href="/product/${result.id}/">
                            <img src="${result.image_url}" alt="${result.name}" class="product-image">
                        </a>
                    </div>
                    <div class="col-md-8">
                        <div class="card-body">
                            <div class="search-result-details">
                                <a href="/product/${result.id}/" class="search-result-title">${result.name}</a>
                                <div class="d-flex align-items-center gap-1">
                                    <div class="d-flex rating">${getRating(result.rating)}</div>
                                    <div class="text-secondary">Đã bán: ${result.sold_quantity}</div>
                                </div>
                                <div class="text-danger">${result.price}₫</div>
                            </div>
                        </div>
                    </div>
                  </div>
                </div>
                
            
                `;
                searchResultsPanel.appendChild(resultItem);
            });
        }
    }

    function onSearch(searchTerm) {
        return new Promise((resolve) => {
            const filteredProducts = products.filter(product => product.name.toLowerCase().includes(searchTerm.toLowerCase()));
            resolve(filteredProducts.map(product => ({
                id: product.id,
                name: product.name,
                image_url: product.image_url,
                rating: product.rating,
                sold_quantity: product.sold_quantity,
                price: product.price
            })));
        });
    }

    searchInput.addEventListener('input', function (event) {
        searchQuery = event.target.value;
        if (searchQuery) {
            onSearch(searchQuery).then(results => {
                displaySearchResults(results);
                searchResultsPanel.classList.remove('d-none');
            });
        } else {
            searchResultsPanel.classList.add('d-none');
        }
    });

    searchForm.addEventListener('submit', function (event) {
        event.preventDefault();
        searchQuery = searchInput.value;
        if (searchQuery) {
            applyFilters()
            onSearch(searchQuery).then(results => {
                displaySearchResults(results);
                searchResultsPanel.classList.remove('d-none');
            });
        }
    });

    document.addEventListener('click', function (event) {
        if (!searchResultsPanel.contains(event.target) && !searchForm.contains(event.target)) {
            searchResultsPanel.classList.add('d-none');
        }
    });

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

    priceFilters.forEach(filter => {
        filter.addEventListener('click', function (event) {
            event.preventDefault();
            let priceRange = this.getAttribute('data-price-filter');
            let [min, max] = priceRange.split('-').map(Number);

            min *= 1000000
            max *= 1000000

            currentPriceRange = `${min}-${max}`;
            console.log("currentPriceRange", currentPriceRange);

            priceFilters.forEach(pf => pf.classList.remove('active'));
            this.classList.add('active');
            currentPage = 1;
            applyFilters();
        });
    });

    applyPriceFilterButton.addEventListener('click', function () {
        const minPrice = parseFloat(document.getElementById('price-min').value) || 0;
        const maxPrice = parseFloat(document.getElementById('price-max').value) || Infinity;

        currentPriceRange = `${minPrice}-${maxPrice}`;
        console.log("currentPriceRange", currentPriceRange);

        priceFilters.forEach(pf => pf.classList.remove('active'));
        currentPage = 1;
        applyFilters();
    });

    brandFilters.forEach(filter => {
        filter.addEventListener('click', function (event) {
            event.preventDefault();
            const brand = this.textContent.trim();

            currentBrand = brand;

            brandFilters.forEach(bf => bf.classList.remove('active'));
            this.classList.add('active');

            currentPage = 1;
            applyFilters();
        });
    });
    function resetFilters() {
        // Reset price filters
        priceFilters.forEach(pf => pf.classList.remove('active'));

        document.getElementById('price-min').value = ''
        document.getElementById('price-max').value = ''

        // Reset brand filters
        brandFilters.forEach(bf => bf.classList.remove('active'));

        // Reset other filters
        currentPriceRange = '';
        currentBrand = '';
        currentCategoryId = '0';
        currentPage = 1;

        console.log("ngu")

        applyFilters();
    }


    resetFiltersButton.addEventListener('click', function (event) {
        event.preventDefault();
        resetFilters();
    });

    sortSelect.addEventListener('change', function (e) {
        const selectedValue = this.value;
        currentSortOrder = selectedValue;
        sortOptions.forEach(opt => opt.classList.remove('active'));
        const activeOption = Array.from(sortOptions).find(opt => opt.value === selectedValue);
        if (activeOption) {
            activeOption.classList.add('active');
        }
        applyFilters();
    });
    applyFilters();
});

