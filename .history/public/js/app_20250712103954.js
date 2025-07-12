// Global variables
let currentUser = null;
let currentProduct = null;
let uploadedFileId = null;

// API Base URL
const API_BASE = '/api';

// Print customization variables
let customizationSettings = {
    paperQuality: 'standard',
    finish: 'matte',
    border: 'none',
    customFile: null
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    loadProducts();
    setupEventListeners();
    
    // Customization file upload
    document.getElementById('customizeFile').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            customizationSettings.customFile = file;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('customize-preview-image').src = e.target.result;
                document.getElementById('customize-upload-preview').style.display = 'block';
                document.getElementById('approve-btn').disabled = false;
                
                // Update preview
                updatePrintPreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Customization option changes
    document.getElementById('paperQuality').addEventListener('change', function() {
        customizationSettings.paperQuality = this.value;
        updateCustomizationSummary();
        updatePrintPreview();
    });
    
    document.getElementById('finish').addEventListener('change', function() {
        customizationSettings.finish = this.value;
        updateCustomizationSummary();
        updatePrintPreview();
    });
    
    document.getElementById('border').addEventListener('change', function() {
        customizationSettings.border = this.value;
        updateCustomizationSummary();
        updatePrintPreview();
    });
});

// Check if user is authenticated
async function checkAuthStatus() {
    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            updateNavigation();
        } else {
            showGuestNavigation();
        }
    } catch (error) {
        console.error('Auth check error:', error);
        showGuestNavigation();
    }
}

// Update navigation based on auth status
function updateNavigation() {
    document.getElementById('nav-login').style.display = 'none';
    document.getElementById('nav-register').style.display = 'none';
    document.getElementById('nav-user').style.display = 'block';
    document.getElementById('user-name').textContent = currentUser.firstName;
}

function showGuestNavigation() {
    document.getElementById('nav-login').style.display = 'block';
    document.getElementById('nav-register').style.display = 'block';
    document.getElementById('nav-user').style.display = 'none';
}

// Load products from API
async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE}/products`);
        const products = await response.json();
        
        const container = document.getElementById('products-container');
        container.innerHTML = '';
        
        products.forEach(product => {
            const productCard = createProductCard(product);
            container.appendChild(productCard);
        });
    } catch (error) {
        console.error('Products loading error:', error);
        showAlert('Error loading products. Please refresh the page.', 'danger');
    }
}

// Create product card element
function createProductCard(product) {
    const col = document.createElement('div');
    col.className = 'col-md-4 mb-4';
    
    col.innerHTML = `
        <div class="card product-card h-100">
            <div class="card-body text-center">
                <div class="mb-3">
                    <i class="bi bi-card-image" style="font-size: 3rem; color: #6c757d;"></i>
                </div>
                <h5 class="card-title">${product.name}</h5>
                <p class="card-text text-muted">${product.description}</p>
                <div class="mb-3">
                    <span class="price-tag">$${product.price}</span>
                    <small class="text-muted d-block mt-1">+ $${product.shipping} shipping</small>
                </div>
                <div class="mb-3">
                    <small class="text-muted"><strong>Size:</strong> ${product.size}</small>
                </div>
                <button class="btn btn-primary btn-lg w-100" onclick="selectProduct('${product.id}')">
                    <i class="bi bi-cart-plus"></i> Order Now
                </button>
            </div>
        </div>
    `;
    
    return col;
}

// Select product and open order modal
async function selectProduct(productId) {
    try {
        const response = await fetch(`${API_BASE}/products/${productId}`);
        currentProduct = await response.json();
        
        document.getElementById('selected-product').innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h6>${currentProduct.name}</h6>
                    <p class="text-muted mb-1">${currentProduct.description}</p>
                    <p class="mb-0"><strong>Size:</strong> ${currentProduct.size}</p>
                    <p class="mb-0"><strong>Price:</strong> $${currentProduct.price} + $${currentProduct.shipping} shipping</p>
                </div>
            </div>
        `;
        
        updateOrderSummary();
        
        const modal = new bootstrap.Modal(document.getElementById('orderModal'));
        modal.show();
    } catch (error) {
        console.error('Product selection error:', error);
        showAlert('Error loading product details.', 'danger');
    }
}

// Update order summary
function updateOrderSummary() {
    if (!currentProduct) return;
    
    const quantity = parseInt(document.getElementById('quantity').value) || 1;
    let itemPrice = currentProduct.price;
    
    // Add customization costs if applicable
    if (customizationSettings.customFile) {
        switch (customizationSettings.paperQuality) {
            case 'premium': itemPrice += 5; break;
            case 'photo': itemPrice += 10; break;
        }
        
        switch (customizationSettings.finish) {
            case 'glossy': itemPrice += 3; break;
            case 'laminated': itemPrice += 8; break;
        }
        
        switch (customizationSettings.border) {
            case 'white':
            case 'black': itemPrice += 2; break;
        }
    }
    
    const subtotal = itemPrice * quantity;
    const shipping = currentProduct.shipping;
    const total = subtotal + shipping;
    
    document.getElementById('order-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('order-shipping').textContent = `$${shipping.toFixed(2)}`;
    document.getElementById('order-total').textContent = `$${total.toFixed(2)}`;
}

// Setup event listeners
function setupEventListeners() {
    // Quantity change
    document.getElementById('quantity').addEventListener('input', updateOrderSummary);
    
    // File upload
    document.getElementById('boardingPassFile').addEventListener('change', handleFileUpload);
    
    // Status change for tracking number
    document.getElementById('new-status')?.addEventListener('change', function() {
        const trackingFields = document.getElementById('tracking-fields');
        if (this.value === 'shipped') {
            trackingFields.style.display = 'block';
        } else {
            trackingFields.style.display = 'none';
        }
    });
}

// Handle file upload
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file
    if (!file.type.startsWith('image/')) {
        showAlert('Please upload an image file.', 'warning');
        return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB
        showAlert('File size must be less than 10MB.', 'warning');
        return;
    }
    
    try {
        const formData = new FormData();
        formData.append('boardingPass', file);
        
        // Use guest upload if user is not authenticated
        const uploadEndpoint = currentUser 
            ? `${API_BASE}/upload/boarding-pass`
            : `${API_BASE}/upload/boarding-pass-guest`;
        
        const response = await fetch(uploadEndpoint, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            uploadedFileId = data.fileId;
            
            // Show preview
            const preview = document.getElementById('upload-preview');
            const previewImage = document.getElementById('preview-image');
            
            // Create preview URL from uploaded file
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImage.src = e.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
            
            showAlert('File uploaded successfully!', 'success');
        } else {
            const error = await response.json();
            showAlert(error.error || 'Upload failed.', 'danger');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showAlert('Upload failed. Please try again.', 'danger');
    }
}

// Remove uploaded file
function removeUpload() {
    document.getElementById('boardingPassFile').value = '';
    document.getElementById('upload-preview').style.display = 'none';
    uploadedFileId = null;
}

// Proceed to payment
async function proceedToPayment() {
    if (!currentProduct || !uploadedFileId) {
        showAlert('Please upload your boarding pass image first.', 'warning');
        return;
    }
    
    // Validate form
    const form = document.getElementById('orderForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const orderData = {
        productId: currentProduct.id,
        quantity: parseInt(document.getElementById('quantity').value),
        shippingAddress: {
            fullName: document.getElementById('fullName').value,
            address: document.getElementById('address').value,
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            zipCode: document.getElementById('zipCode').value,
            country: document.getElementById('country').value
        },
        boardingPassDetails: {
            fileId: uploadedFileId
        }
    };
    
    try {
        const response = await fetch(`${API_BASE}/payment/create-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData),
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            // Redirect to PayPal
            window.location.href = data.approvalUrl;
        } else {
            const error = await response.json();
            showAlert(error.error || 'Payment creation failed.', 'danger');
        }
    } catch (error) {
        console.error('Payment error:', error);
        showAlert('Payment failed. Please try again.', 'danger');
    }
}

// Authentication functions
function showLoginModal() {
    const modal = new bootstrap.Modal(document.getElementById('loginModal'));
    modal.show();
}

function showRegisterModal() {
    const modal = new bootstrap.Modal(document.getElementById('registerModal'));
    modal.show();
}

async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showAlert('Please fill in all fields.', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password }),
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            updateNavigation();
            
            bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
            showAlert('Login successful!', 'success');
        } else {
            const error = await response.json();
            showAlert(error.error || 'Login failed.', 'danger');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('Login failed. Please try again.', 'danger');
    }
}

async function register() {
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!firstName || !lastName || !email || !password) {
        showAlert('Please fill in all fields.', 'warning');
        return;
    }
    
    if (password !== confirmPassword) {
        showAlert('Passwords do not match.', 'warning');
        return;
    }
    
    if (password.length < 6) {
        showAlert('Password must be at least 6 characters long.', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ firstName, lastName, email, password }),
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            updateNavigation();
            
            bootstrap.Modal.getInstance(document.getElementById('registerModal')).hide();
            showAlert('Registration successful! Welcome!', 'success');
        } else {
            const error = await response.json();
            showAlert(error.error || 'Registration failed.', 'danger');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showAlert('Registration failed. Please try again.', 'danger');
    }
}

async function logout() {
    try {
        await fetch(`${API_BASE}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        
        currentUser = null;
        showGuestNavigation();
        showAlert('Logged out successfully.', 'info');
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Show user orders
async function showMyOrders() {
    try {
        const response = await fetch(`${API_BASE}/orders`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const orders = await response.json();
            displayOrders(orders);
            
            const modal = new bootstrap.Modal(document.getElementById('ordersModal'));
            modal.show();
        } else {
            showAlert('Failed to load orders.', 'danger');
        }
    } catch (error) {
        console.error('Orders loading error:', error);
        showAlert('Failed to load orders.', 'danger');
    }
}

function displayOrders(orders) {
    const container = document.getElementById('orders-container');
    
    if (orders.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">No orders found.</p>';
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="card mb-3">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-8">
                        <h6>Order #${order.id}</h6>
                        <p class="mb-1"><strong>Product:</strong> ${order.product?.name || 'Unknown'}</p>
                        <p class="mb-1"><strong>Quantity:</strong> ${order.quantity}</p>
                        <p class="mb-1"><strong>Total:</strong> $${order.totalAmount}</p>
                        <p class="mb-0"><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div class="col-md-4 text-end">
                        <span class="badge bg-${getStatusColor(order.status)} mb-2">${order.status.toUpperCase()}</span>
                        <div>
                            ${order.trackingNumber ? `
                                <button class="btn btn-sm btn-outline-primary" onclick="trackOrder('${order.id}')">
                                    <i class="bi bi-truck"></i> Track Order
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function getStatusColor(status) {
    const colors = {
        pending: 'warning',
        processing: 'info',
        printing: 'primary',
        shipped: 'success',
        delivered: 'success',
        cancelled: 'danger'
    };
    return colors[status] || 'secondary';
}

// Track order
async function trackOrder(orderId) {
    try {
        const response = await fetch(`${API_BASE}/orders/${orderId}/tracking`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const tracking = await response.json();
            showTrackingModal(tracking);
        } else {
            showAlert('Failed to load tracking information.', 'danger');
        }
    } catch (error) {
        console.error('Tracking error:', error);
        showAlert('Failed to load tracking information.', 'danger');
    }
}

function showTrackingModal(tracking) {
    // Create tracking modal content
    const modalContent = `
        <div class="modal fade" id="trackingModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Order Tracking</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <strong>Order ID:</strong> ${tracking.orderId}<br>
                            <strong>Status:</strong> ${tracking.status}<br>
                            ${tracking.trackingNumber ? `<strong>Tracking Number:</strong> ${tracking.trackingNumber}<br>` : ''}
                            ${tracking.estimatedDelivery ? `<strong>Estimated Delivery:</strong> ${new Date(tracking.estimatedDelivery).toLocaleDateString()}<br>` : ''}
                        </div>
                        
                        <div class="tracking-steps">
                            ${tracking.trackingSteps?.map(step => `
                                <div class="d-flex align-items-center mb-2">
                                    <div class="me-3">
                                        <i class="bi bi-${step.completed ? 'check-circle-fill text-success' : 'circle text-muted'}"></i>
                                    </div>
                                    <div class="flex-grow-1">
                                        <strong>${step.status}</strong>
                                        ${step.date ? `<br><small class="text-muted">${new Date(step.date).toLocaleDateString()}</small>` : ''}
                                    </div>
                                </div>
                            `).join('') || '<p>No tracking steps available yet.</p>'}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing tracking modal if any
    const existingModal = document.getElementById('trackingModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add new tracking modal
    document.body.insertAdjacentHTML('beforeend', modalContent);
    
    const modal = new bootstrap.Modal(document.getElementById('trackingModal'));
    modal.show();
    
    // Clean up after modal is hidden
    document.getElementById('trackingModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// Utility function to show alerts
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// URL parameter handling for payment success/cancel
window.addEventListener('load', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentId = urlParams.get('paymentId');
    const payerId = urlParams.get('PayerID');
    const orderId = urlParams.get('orderId');
    
    if (paymentId && payerId && orderId) {
        // Handle payment success
        executePayment(paymentId, payerId, orderId);
    } else if (urlParams.get('cancelled') === 'true') {
        showAlert('Payment was cancelled.', 'warning');
    }
});

async function executePayment(paymentId, payerId, orderId) {
    try {
        const response = await fetch(`${API_BASE}/payment/execute-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ paymentId, payerId, orderId }),
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            showAlert('Payment completed successfully! Your order is being processed.', 'success');
            
            // Clear URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);
        } else {
            const error = await response.json();
            showAlert(error.error || 'Payment execution failed.', 'danger');
        }
    } catch (error) {
        console.error('Payment execution error:', error);
        showAlert('Payment execution failed.', 'danger');
    }
}

// Open print customization modal
function openCustomizeModal() {
    // Ensure modal displays on top
    const customizeModal = document.getElementById('customizeModal');
    customizeModal.style.zIndex = '10001';
    
    const modal = new bootstrap.Modal(customizeModal, {
        backdrop: 'static',
        keyboard: false
    });
    
    // Add event listener to fix z-index when shown
    customizeModal.addEventListener('shown.bs.modal', function() {
        this.style.zIndex = '10001';
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.style.zIndex = '10000';
        }
    });
    
    modal.show();
    updateCustomizationSummary();
}

// Update customization summary
function updateCustomizationSummary() {
    if (!currentProduct) return;
    
    const basePrice = currentProduct.price;
    let paperCost = 0;
    let finishCost = 0;
    let borderCost = 0;
    
    // Calculate costs
    switch (customizationSettings.paperQuality) {
        case 'premium': paperCost = 5; break;
        case 'photo': paperCost = 10; break;
    }
    
    switch (customizationSettings.finish) {
        case 'glossy': finishCost = 3; break;
        case 'laminated': finishCost = 8; break;
    }
    
    switch (customizationSettings.border) {
        case 'white':
        case 'black': borderCost = 2; break;
    }
    
    const total = basePrice + paperCost + finishCost + borderCost;
    
    // Update display
    document.getElementById('base-price').textContent = `$${basePrice.toFixed(2)}`;
    document.getElementById('paper-cost').textContent = `$${paperCost.toFixed(2)}`;
    document.getElementById('finish-cost').textContent = `$${finishCost.toFixed(2)}`;
    document.getElementById('border-cost').textContent = `$${borderCost.toFixed(2)}`;
    document.getElementById('customize-total').textContent = `$${total.toFixed(2)}`;
}

// Update print preview
function updatePrintPreview(imageSrc) {
    const preview = document.getElementById('print-preview');
    
    if (imageSrc) {
        let borderStyle = '';
        switch (customizationSettings.border) {
            case 'white': borderStyle = 'border: 10px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.2);'; break;
            case 'black': borderStyle = 'border: 10px solid black;'; break;
        }
        
        let finishStyle = '';
        switch (customizationSettings.finish) {
            case 'glossy': finishStyle = 'filter: brightness(1.1) contrast(1.1);'; break;
            case 'laminated': finishStyle = 'filter: brightness(1.05); box-shadow: 0 4px 8px rgba(0,0,0,0.3);'; break;
        }
        
        preview.innerHTML = `
            <div style="display: inline-block; ${borderStyle}">
                <img src="${imageSrc}" alt="Preview" style="max-width: 100%; height: auto; ${finishStyle}">
            </div>
            <div class="mt-2">
                <small class="text-muted">
                    ${customizationSettings.paperQuality.charAt(0).toUpperCase() + customizationSettings.paperQuality.slice(1)} Paper, 
                    ${customizationSettings.finish.charAt(0).toUpperCase() + customizationSettings.finish.slice(1)} Finish
                    ${customizationSettings.border !== 'none' ? ', ' + customizationSettings.border.charAt(0).toUpperCase() + customizationSettings.border.slice(1) + ' Border' : ''}
                </small>
            </div>
        `;
    }
}

// Remove customization upload
function removeCustomizeUpload() {
    document.getElementById('customize-upload-preview').style.display = 'none';
    document.getElementById('customize-preview-image').src = '';
    document.getElementById('customizeFile').value = '';
    document.getElementById('approve-btn').disabled = true;
    customizationSettings.customFile = null;
    
    document.getElementById('print-preview').innerHTML = `
        <div class="text-center text-muted" style="padding-top: 100px;">
            <i class="bi bi-eye" style="font-size: 3rem;"></i>
            <p>Upload an image to see preview</p>
        </div>
    `;
}

// Approve customization
function approveCustomization() {
    if (!customizationSettings.customFile) {
        showAlert('Please upload an image first', 'warning');
        return;
    }
    
    // Update order modal with customization info
    document.getElementById('customization-info').style.display = 'block';
    document.getElementById('customization-details').textContent = 
        `${customizationSettings.paperQuality.charAt(0).toUpperCase() + customizationSettings.paperQuality.slice(1)} paper, ${customizationSettings.finish} finish`;
    
    // Set the file to the main upload
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(customizationSettings.customFile);
    document.getElementById('boardingPassFile').files = dataTransfer.files;
    
    // Show preview in order modal
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('preview-image').src = e.target.result;
        document.getElementById('upload-preview').style.display = 'block';
    };
    reader.readAsDataURL(customizationSettings.customFile);
    
    // Update pricing in order modal
    updateOrderSummary();
    
    // Close customization modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('customizeModal'));
    modal.hide();
    
    showAlert('Print customization applied successfully!', 'success');
}

// Show authentication options
function showAuthOptions() {
    const modal = new bootstrap.Modal(document.getElementById('authOptionsModal'));
    modal.show();
}

// Hide authentication options
function hideAuthOptions() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('authOptionsModal'));
    if (modal) modal.hide();
}

// Proceed to checkout (guest or authenticated)
function proceedToCheckout() {
    if (currentUser) {
        proceedToPayment();
    } else {
        proceedToGuestCheckout();
    }
}

// Proceed to guest checkout
function proceedToGuestCheckout() {
    // Validate form
    if (!validateOrderForm()) {
        return;
    }
    
    // Close order modal
    const orderModal = bootstrap.Modal.getInstance(document.getElementById('orderModal'));
    if (orderModal) orderModal.hide();
    
    // Show guest checkout confirmation
    showGuestCheckoutConfirmation();
}

// Show guest checkout confirmation
function showGuestCheckoutConfirmation() {
    const quantity = parseInt(document.getElementById('quantity').value) || 1;
    let itemPrice = currentProduct.price;
    
    // Add customization costs
    if (customizationSettings.customFile) {
        switch (customizationSettings.paperQuality) {
            case 'premium': itemPrice += 5; break;
            case 'photo': itemPrice += 10; break;
        }
        
        switch (customizationSettings.finish) {
            case 'glossy': itemPrice += 3; break;
            case 'laminated': itemPrice += 8; break;
        }
        
        switch (customizationSettings.border) {
            case 'white':
            case 'black': itemPrice += 2; break;
        }
    }
    
    const subtotal = itemPrice * quantity;
    const shipping = currentProduct.shipping;
    const total = subtotal + shipping;
    
    const shippingAddress = {
        fullName: document.getElementById('fullName').value,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        zipCode: document.getElementById('zipCode').value,
        country: document.getElementById('country').value
    };
    
    // Create order confirmation content
    const confirmationContent = `
        <div class="modal fade" id="guestCheckoutModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Review Your Order</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Order Details</h6>
                                <div class="card mb-3">
                                    <div class="card-body">
                                        <h6>${currentProduct.name}</h6>
                                        <p class="text-muted mb-1">${currentProduct.description}</p>
                                        <p class="mb-0"><strong>Quantity:</strong> ${quantity}</p>
                                        <p class="mb-0"><strong>Size:</strong> ${currentProduct.size}</p>
                                        ${customizationSettings.customFile ? `
                                            <hr>
                                            <p class="mb-0"><strong>Customizations:</strong></p>
                                            <small class="text-muted">
                                                ${customizationSettings.paperQuality.charAt(0).toUpperCase() + customizationSettings.paperQuality.slice(1)} paper, 
                                                ${customizationSettings.finish} finish
                                                ${customizationSettings.border !== 'none' ? ', ' + customizationSettings.border + ' border' : ''}
                                            </small>
                                        ` : ''}
                                    </div>
                                </div>
                                
                                <h6>Shipping Address</h6>
                                <div class="card">
                                    <div class="card-body">
                                        <p class="mb-1"><strong>${shippingAddress.fullName}</strong></p>
                                        <p class="mb-1">${shippingAddress.address}</p>
                                        <p class="mb-0">${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}</p>
                                        <p class="mb-0">${shippingAddress.country}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="col-md-6">
                                <h6>Order Summary</h6>
                                <div class="bg-light p-3 rounded mb-3">
                                    <div class="d-flex justify-content-between">
                                        <span>Subtotal:</span>
                                        <span>$${subtotal.toFixed(2)}</span>
                                    </div>
                                    <div class="d-flex justify-content-between">
                                        <span>Shipping:</span>
                                        <span>$${shipping.toFixed(2)}</span>
                                    </div>
                                    <hr>
                                    <div class="d-flex justify-content-between fw-bold">
                                        <span>Total:</span>
                                        <span>$${total.toFixed(2)}</span>
                                    </div>
                                </div>
                                
                                <div class="alert alert-info">
                                    <i class="bi bi-info-circle"></i>
                                    <strong>Guest Checkout</strong><br>
                                    You'll receive order updates via email. No account needed!
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Back to Edit</button>
                        <button type="button" class="btn btn-primary btn-lg" onclick="proceedToGuestPayment()">
                            <i class="bi bi-credit-card"></i> Proceed to Payment
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to DOM if it doesn't exist
    if (!document.getElementById('guestCheckoutModal')) {
        document.body.insertAdjacentHTML('beforeend', confirmationContent);
    }
    
    // Show the confirmation modal
    const modal = new bootstrap.Modal(document.getElementById('guestCheckoutModal'));
    modal.show();
}

// Proceed to guest payment
async function proceedToGuestPayment() {
    try {
        // Collect order data
        const quantity = parseInt(document.getElementById('quantity').value) || 1;
        let itemPrice = currentProduct.price;
        
        // Add customization costs
        const customizationCosts = {
            paperQuality: 0,
            finish: 0,
            border: 0
        };
        
        if (customizationSettings.customFile) {
            switch (customizationSettings.paperQuality) {
                case 'premium': customizationCosts.paperQuality = 5; break;
                case 'photo': customizationCosts.paperQuality = 10; break;
            }
            
            switch (customizationSettings.finish) {
                case 'glossy': customizationCosts.finish = 3; break;
                case 'laminated': customizationCosts.finish = 8; break;
            }
            
            switch (customizationSettings.border) {
                case 'white':
                case 'black': customizationCosts.border = 2; break;
            }
            
            itemPrice += customizationCosts.paperQuality + customizationCosts.finish + customizationCosts.border;
        }
        
        const shippingAddress = {
            fullName: document.getElementById('fullName').value,
            address: document.getElementById('address').value,
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            zipCode: document.getElementById('zipCode').value,
            country: document.getElementById('country').value
        };
        
        const orderData = {
            productId: currentProduct.id,
            quantity: quantity,
            shippingAddress: shippingAddress,
            boardingPassDetails: {
                customizations: customizationSettings.customFile ? {
                    paperQuality: customizationSettings.paperQuality,
                    finish: customizationSettings.finish,
                    border: customizationSettings.border,
                    costs: customizationCosts
                } : null
            },
            guestEmail: '', // Will be collected in payment process
            isGuest: true
        };
        
        // Upload file first if needed
        if (uploadedFileId || customizationSettings.customFile) {
            const file = customizationSettings.customFile || document.getElementById('boardingPassFile').files[0];
            if (file && !uploadedFileId) {
                const uploadResult = await uploadBoardingPassFile(file);
                if (!uploadResult.success) {
                    showAlert('File upload failed. Please try again.', 'danger');
                    return;
                }
                orderData.boardingPassDetails.fileId = uploadResult.fileId;
            } else if (uploadedFileId) {
                orderData.boardingPassDetails.fileId = uploadedFileId;
            }
        }
        
        // Create payment
        const response = await fetch(`${API_BASE}/payment/create-guest-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData),
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            // Redirect to PayPal
            window.location.href = data.approvalUrl;
        } else {
            const error = await response.json();
            showAlert(error.error || 'Payment creation failed', 'danger');
        }
        
    } catch (error) {
        console.error('Guest payment error:', error);
        showAlert('An error occurred. Please try again.', 'danger');
    }
}

// Validate order form
function validateOrderForm() {
    const requiredFields = ['fullName', 'address', 'city', 'state', 'zipCode'];
    let isValid = true;
    
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!field.value.trim()) {
            field.classList.add('is-invalid');
            isValid = false;
        } else {
            field.classList.remove('is-invalid');
        }
    });
    
    // Check if file is uploaded
    const hasFile = document.getElementById('boardingPassFile').files.length > 0 || 
                   customizationSettings.customFile || 
                   uploadedFileId;
    
    if (!hasFile) {
        showAlert('Please upload your boarding pass image', 'warning');
        isValid = false;
    }
    
    if (!isValid) {
        showAlert('Please fill in all required fields', 'warning');
    }
    
    return isValid;
}
