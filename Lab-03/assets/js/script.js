// Biến toàn cục
let allProducts = [];
let categories = [];
let filteredProducts = [];
let currentPage = 1;
let itemsPerPage = 10;
let sortConfig = { key: null, direction: 'asc' };
let searchTerm = '';

// Khởi tạo dashboard khi tải trang
document.addEventListener('DOMContentLoaded', () => {
    // Khởi tạo tooltip
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl, {
        html: true,
        placement: 'top'
    }));
    
    // Lấy dữ liệu từ API
    Promise.all([
        fetchProducts(),
        fetchCategories()
    ]).then(() => {
        initializeDashboard();
    }).catch(error => {
        console.error('Lỗi khởi tạo dashboard:', error);
        showError('Không thể tải dữ liệu sản phẩm. Vui lòng thử lại sau.');
    });
    
    // Thiết lập các sự kiện
    setupEventListeners();
});

// Lấy sản phẩm từ API
function fetchProducts() {
    return fetch('https://api.escuelajs.co/api/v1/products')
        .then(response => {
            if (!response.ok) {
                throw new Error('Lỗi khi lấy dữ liệu sản phẩm');
            }
            return response.json();
        })
        .then(data => {
            allProducts = data;
            filteredProducts = [...allProducts];
            document.getElementById('totalItems').textContent = allProducts.length;
        })
        .catch(error => {
            console.error('Lỗi lấy sản phẩm:', error);
            throw error;
        });
}

// Lấy danh mục từ API
function fetchCategories() {
    return fetch('https://api.escuelajs.co/api/v1/categories')
        .then(response => {
            if (!response.ok) {
                throw new Error('Lỗi khi lấy danh mục');
            }
            return response.json();
        })
        .then(data => {
            categories = data;
            populateCategoryDropdowns();
        })
        .catch(error => {
            console.error('Lỗi lấy danh mục:', error);
            // Sử dụng danh mục mặc định nếu API lỗi
            categories = [
                { id: 1, name: 'Điện thoại' },
                { id: 2, name: 'Máy tính' },
                { id: 3, name: 'Phụ kiện' },
                { id: 4, name: 'Đồ gia dụng' }
            ];
            populateCategoryDropdowns();
        });
}

// Điền dữ liệu vào dropdown danh mục
function populateCategoryDropdowns() {
    const editCategorySelect = document.getElementById('editProductCategory');
    const createCategorySelect = document.getElementById('createProductCategory');
    
    // Xóa options cũ
    editCategorySelect.innerHTML = '<option value="">-- Chọn danh mục --</option>';
    createCategorySelect.innerHTML = '<option value="">-- Chọn danh mục --</option>';
    
    // Thêm options mới
    categories.forEach(category => {
        const editOption = document.createElement('option');
        editOption.value = category.id;
        editOption.textContent = category.name;
        editCategorySelect.appendChild(editOption);
        
        const createOption = document.createElement('option');
        createOption.value = category.id;
        createOption.textContent = category.name;
        createCategorySelect.appendChild(createOption);
    });
}

// Khởi tạo dashboard sau khi có dữ liệu
function initializeDashboard() {
    const itemsPerPageSelect = document.getElementById('itemsPerPage');
    itemsPerPage = parseInt(itemsPerPageSelect.value);
    
    // Sắp xếp mặc định theo ID giảm dần để sản phẩm mới lên trên
    sortProducts('id', 'desc');
    
    // Hiển thị bảng
    renderTable();
    renderPagination();
}

// Thiết lập các sự kiện
function setupEventListeners() {
    // Tìm kiếm theo tên
    document.getElementById('searchInput').addEventListener('input', (e) => {
        searchTerm = e.target.value.trim();
        applySearch();
    });
    
    // Thay đổi số sản phẩm mỗi trang
    document.getElementById('itemsPerPage').addEventListener('change', (e) => {
        itemsPerPage = parseInt(e.target.value);
        currentPage = 1;
        renderTable();
        renderPagination();
    });
    
    // Xuất CSV
    document.getElementById('exportBtn').addEventListener('click', exportToCSV);
    
    // Sắp xếp theo cột
    document.querySelectorAll('table th').forEach((th, index) => {
        if (index === 1) { // Cột tên sản phẩm
            th.addEventListener('click', () => sortTable('title'));
        } else if (index === 2) { // Cột giá
            th.addEventListener('click', () => sortTable('price'));
        }
    });
    
    // Form chỉnh sửa
    document.getElementById('editProductForm').addEventListener('submit', handleEditProduct);
    
    // Form tạo mới
    document.getElementById('createProductForm').addEventListener('submit', handleCreateProduct);
}

// Áp dụng tìm kiếm
function applySearch() {
    if (searchTerm === '') {
        filteredProducts = [...allProducts];
    } else {
        const searchLower = searchTerm.toLowerCase();
        filteredProducts = allProducts.filter(product => 
            product.title.toLowerCase().includes(searchLower)
        );
    }
    
    currentPage = 1;
    
    // Giữ nguyên sắp xếp hiện tại
    if (sortConfig.key) {
        sortProducts(sortConfig.key, sortConfig.direction);
    }
    
    renderTable();
    renderPagination();
    document.getElementById('totalItems').textContent = filteredProducts.length;
}

// Sắp xếp bảng
function sortTable(key) {
    if (sortConfig.key === key) {
        sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    } else {
        sortConfig.key = key;
        sortConfig.direction = 'asc';
    }
    
    sortProducts(key, sortConfig.direction);
    renderTable();
    renderPagination();
}

// Sắp xếp mảng sản phẩm
function sortProducts(key, direction) {
    filteredProducts.sort((a, b) => {
        let aValue, bValue;
        
        if (key === 'title') {
            aValue = a.title.toLowerCase();
            bValue = b.title.toLowerCase();
        } else if (key === 'price') {
            aValue = parseFloat(a.price);
            bValue = parseFloat(b.price);
        } else if (key === 'category') {
            aValue = a.category?.name?.toLowerCase() || '';
            bValue = b.category?.name?.toLowerCase() || '';
        } else if (key === 'id') {
            aValue = a.id;
            bValue = b.id;
        } else {
            aValue = a[key];
            bValue = b[key];
        }
        
        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
    });
}

// Hiển thị bảng sản phẩm
function renderTable() {
    const tableBody = document.getElementById('productsTableBody');
    tableBody.innerHTML = '';
    
    // Hiển thị thông báo không có kết quả
    if (filteredProducts.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-5">
                    <div class="alert alert-info mb-0">
                        <i class="bi bi-info-circle me-2"></i>
                        ${searchTerm ? `Không tìm thấy sản phẩm nào với từ khóa "${searchTerm}"` : 'Không có sản phẩm nào'}
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    // Tính toán phân trang
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredProducts.length);
    const pageProducts = filteredProducts.slice(startIndex, endIndex);
    
    // Tạo các dòng trong bảng
    pageProducts.forEach(product => {
        const row = document.createElement('tr');
        row.className = 'table-row';
        row.setAttribute('data-bs-toggle', 'tooltip');
        row.setAttribute('data-bs-html', 'true');
        row.setAttribute('title', `<strong>Mô tả:</strong><br>${product.description || 'Không có mô tả'}`);
        
        // Định dạng giá tiền
        const formattedPrice = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'USD'
        }).format(product.price);
        
        // Lấy hình ảnh đầu tiên hoặc dùng placeholder
        const imageUrl = product.images && product.images.length > 0 
            ? product.images[0] 
            : 'https://via.placeholder.com/60x60?text=Không+có+hình';
        
        // Tên danh mục
        const categoryName = product.category?.name || 'Khác';
        
        row.innerHTML = `
            <td class="align-middle fw-bold">${product.id}</td>
            <td class="align-middle product-title">${product.title}</td>
            <td class="align-middle price-highlight">${formattedPrice}</td>
            <td class="align-middle">
                <span class="category-badge">${categoryName}</span>
            </td>
            <td class="align-middle">
                <img src="${imageUrl}" class="product-image" alt="${product.title}" 
                     onerror="this.src='https://via.placeholder.com/60x60?text=Lỗi+hình'">
            </td>
            <td class="align-middle">
                <button class="btn edit-btn btn-sm px-3" data-id="${product.id}" 
                        data-bs-toggle="modal" data-bs-target="#productModal">
                    <i class="bi bi-pencil-square me-1"></i>Sửa
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Thêm sự kiện cho nút Sửa
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', () => {
            const productId = button.getAttribute('data-id');
            openEditModal(productId);
        });
    });
    
    // Khởi tạo tooltip cho các dòng mới
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach(tooltipTriggerEl => {
        const tooltip = bootstrap.Tooltip.getInstance(tooltipTriggerEl);
        if (tooltip) tooltip.dispose();
        new bootstrap.Tooltip(tooltipTriggerEl, {
            html: true,
            placement: 'top',
            trigger: 'hover'
        });
    });
}

// Hiển thị phân trang
function renderPagination() {
    const paginationElement = document.getElementById('pagination');
    paginationElement.innerHTML = '';
    
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    
    if (totalPages <= 1) {
        paginationElement.parentElement.style.display = 'none';
        return;
    }
    
    paginationElement.parentElement.style.display = 'block';
    
    // Nút Previous
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" aria-label="Previous"><span aria-hidden="true">&laquo;</span> Trước</a>`;
    prevLi.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            renderTable();
            renderPagination();
        }
    });
    paginationElement.appendChild(prevLi);
    
    // Các số trang
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${currentPage === i ? 'active' : ''}`;
        pageLi.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        pageLi.addEventListener('click', (e) => {
            e.preventDefault();
            currentPage = i;
            renderTable();
            renderPagination();
        });
        paginationElement.appendChild(pageLi);
    }
    
    // Nút Next
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" aria-label="Next">Sau <span aria-hidden="true">&raquo;</span></a>`;
    nextLi.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
            renderPagination();
        }
    });
    paginationElement.appendChild(nextLi);
    
    // Hiển thị thông tin phân trang
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, filteredProducts.length);
    const pageInfo = document.createElement('div');
    pageInfo.className = 'text-center text-muted mt-2 small';
    pageInfo.textContent = `Hiển thị ${startIndex}–${endIndex} trên tổng số ${filteredProducts.length} sản phẩm`;
    paginationElement.parentElement.appendChild(pageInfo);
}

// Mở modal chỉnh sửa
function openEditModal(productId) {
    const product = allProducts.find(p => p.id == productId);
    if (!product) {
        showNotification('Không tìm thấy sản phẩm', 'danger');
        return;
    }
    
    // Cập nhật tiêu đề modal
    document.getElementById('productModalLabel').textContent = 'Chỉnh Sửa Sản Phẩm';
    
    // Điền thông tin chi tiết
    document.getElementById('modalProductTitle').textContent = product.title;
    document.getElementById('modalProductDescription').textContent = product.description || 'Không có mô tả';
    document.getElementById('modalProductPrice').textContent = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'USD'
    }).format(product.price);
    
    document.getElementById('modalProductCategory').textContent = product.category?.name || 'Khác';
    document.getElementById('modalProductId').textContent = product.id;
    
    const creationDate = new Date(product.creationAt || product.createdAt || new Date());
    document.getElementById('modalProductCreation').textContent = creationDate.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Hiển thị hình ảnh
    const imageUrl = product.images && product.images.length > 0 
        ? product.images[0] 
        : 'https://via.placeholder.com/300x200?text=Không+có+hình';
    document.getElementById('modalProductImage').src = imageUrl;
    
    // Điền form chỉnh sửa
    document.getElementById('editProductId').value = product.id;
    document.getElementById('editProductTitle').value = product.title;
    document.getElementById('editProductPrice').value = product.price;
    document.getElementById('editProductDescription').value = product.description || '';
    document.getElementById('editProductCategory').value = product.category?.id || '';
    document.getElementById('editProductImage').value = product.images && product.images.length > 0 ? product.images[0] : '';
}

// Xử lý form chỉnh sửa
function handleEditProduct(e) {
    e.preventDefault();
    
    const productId = document.getElementById('editProductId').value;
    const updatedProduct = {
        title: document.getElementById('editProductTitle').value.trim(),
        price: parseFloat(document.getElementById('editProductPrice').value),
        description: document.getElementById('editProductDescription').value.trim(),
        categoryId: parseInt(document.getElementById('editProductCategory').value),
        images: [document.getElementById('editProductImage').value.trim() || 'https://via.placeholder.com/300x200?text=No+Image']
    };
    
    // Kiểm tra dữ liệu
    if (!updatedProduct.title || updatedProduct.title.length < 3) {
        showNotification('Tên sản phẩm phải có ít nhất 3 ký tự', 'warning');
        return;
    }
    
    if (updatedProduct.price <= 0) {
        showNotification('Giá sản phẩm phải lớn hơn 0', 'warning');
        return;
    }
    
    // Hiển thị trạng thái loading
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang lưu...';
    
    // Gọi API cập nhật
    fetch(`https://api.escuelajs.co/api/v1/products/${productId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedProduct)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Lỗi khi cập nhật sản phẩm');
        }
        return response.json();
    })
    .then(data => {
        // Cập nhật dữ liệu local
        const index = allProducts.findIndex(p => p.id == productId);
        if (index !== -1) {
            allProducts[index] = { ...allProducts[index], ...data };
        }
        
        // Cập nhật filteredProducts
        filteredProducts = [...allProducts];
        if (searchTerm) {
            applySearch();
        } else if (sortConfig.key) {
            sortProducts(sortConfig.key, sortConfig.direction);
            renderTable();
            renderPagination();
        } else {
            renderTable();
            renderPagination();
        }
        
        // Đóng modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
        modal.hide();
        
        // Hiển thị thông báo thành công
        showNotification(`✅ Đã cập nhật sản phẩm "${data.title}" thành công!`, 'success');
    })
    .catch(error => {
        console.error('Lỗi cập nhật sản phẩm:', error);
        showNotification(`❌ Lỗi: Không thể cập nhật sản phẩm. Vui lòng thử lại.`, 'danger');
    })
    .finally(() => {
        // Khôi phục nút
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    });
}

// Xử lý form tạo mới
function handleCreateProduct(e) {
    e.preventDefault();
    
    const newProduct = {
        title: document.getElementById('createProductTitle').value.trim(),
        price: parseFloat(document.getElementById('createProductPrice').value),
        description: document.getElementById('createProductDescription').value.trim(),
        categoryId: parseInt(document.getElementById('createProductCategory').value),
        images: [document.getElementById('createProductImage').value.trim()]
    };
    
    // Kiểm tra dữ liệu
    if (!newProduct.title || newProduct.title.length < 3) {
        showNotification('Tên sản phẩm phải có ít nhất 3 ký tự', 'warning');
        return;
    }
    
    if (newProduct.price <= 0) {
        showNotification('Giá sản phẩm phải lớn hơn 0', 'warning');
        return;
    }
    
    if (!newProduct.images[0] || !newProduct.images[0].startsWith('http')) {
        showNotification('Vui lòng nhập URL hình ảnh hợp lệ', 'warning');
        return;
    }
    
    // Hiển thị trạng thái loading
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang tạo...';
    
    // Gọi API tạo mới
    fetch('https://api.escuelajs.co/api/v1/products', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newProduct)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Lỗi khi tạo sản phẩm mới');
        }
        return response.json();
    })
    .then(data => {
        // Thêm sản phẩm mới vào đầu danh sách
        allProducts.unshift(data);
        
        // Cập nhật filteredProducts
        filteredProducts = [...allProducts];
        if (searchTerm) {
            applySearch();
        } else {
            currentPage = 1;
            sortProducts('id', 'desc'); // Sắp xếp lại để sản phẩm mới lên trên
            renderTable();
            renderPagination();
        }
        
        // Reset form và đóng modal
        e.target.reset();
        const modal = bootstrap.Modal.getInstance(document.getElementById('createProductModal'));
        modal.hide();
        
        // Hiển thị thông báo thành công
        showNotification(`✅ Đã tạo sản phẩm "${data.title}" thành công!`, 'success');
        
        // Cuộn lên đầu trang để xem sản phẩm mới
        document.querySelector('.table-container').scrollIntoView({ behavior: 'smooth' });
    })
    .catch(error => {
        console.error('Lỗi tạo sản phẩm:', error);
        showNotification(`❌ Lỗi: Không thể tạo sản phẩm. ${error.message || 'Vui lòng thử lại.'}`, 'danger');
    })
    .finally(() => {
        // Khôi phục nút
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    });
}

// Xuất dữ liệu ra file CSV
function exportToCSV() {
    // Lấy dữ liệu trang hiện tại
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredProducts.length);
    const pageProducts = filteredProducts.slice(startIndex, endIndex);
    
    if (pageProducts.length === 0) {
        showNotification('Không có dữ liệu để xuất', 'warning');
        return;
    }
    
    // Tạo header CSV
    const headers = ['ID', 'Tên sản phẩm', 'Giá (USD)', 'Danh mục', 'Mô tả', 'Hình ảnh'];
    
    // Tạo các dòng dữ liệu
    const rows = pageProducts.map(product => {
        return [
            product.id,
            `"${product.title.replace(/"/g, '""')}"`, // Escape dấu ngoặc kép
            product.price,
            `"${product.category?.name || 'Khác'}"`,
            `"${(product.description || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
            `"${product.images?.join('|') || ''}"`
        ].join(',');
    });
    
    // Tạo nội dung CSV
    const csvContent = [
        '\uFEFF' + headers.join(','), // Thêm BOM để hỗ trợ Unicode tiếng Việt
        ...rows
    ].join('\n');
    
    // Tạo file download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `san_pham_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification(`✅ Đã xuất ${pageProducts.length} sản phẩm thành công!`, 'success');
    
    // Ghi log cho mục đích demo
    console.log(`Đã xuất ${pageProducts.length} sản phẩm vào lúc ${new Date().toLocaleTimeString('vi-VN')}`);
}

// Hiển thị thông báo
function showNotification(message, type = 'info') {
    // Loại bỏ thông báo cũ
    const existing = document.querySelector('.toast.show');
    if (existing) {
        const toast = bootstrap.Toast.getInstance(existing);
        if (toast) toast.hide();
        setTimeout(() => {
            existing.remove();
            createNewToast(message, type);
        }, 300);
    } else {
        createNewToast(message, type);
    }
}

function createNewToast(message, type) {
    const toastContainer = document.querySelector('.toast-container');
    
    // Tạo toast
    const toastId = 'notificationToast_' + Date.now();
    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center text-white bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body fw-medium">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Đóng"></button>
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    // Hiển thị toast
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, {
        delay: type === 'success' ? 3000 : 4000
    });
    toast.show();
    
    // Xóa toast sau khi ẩn
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

// Hiển thị lỗi
function showError(message) {
    const tableBody = document.getElementById('productsTableBody');
    tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center py-5">
                <div class="alert alert-danger mb-0">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    ${message}
                </div>
                <button class="btn btn-primary mt-3" onclick="location.reload()">
                    <i class="bi bi-arrow-clockwise me-1"></i>Tải lại trang
                </button>
            </td>
        </tr>
    `;
}