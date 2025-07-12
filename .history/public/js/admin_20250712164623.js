// Global variables
let currentAdmin = null;
let currentPage = 1;
let currentStatusFilter = 'all';
let sessionTimer = null;
let warningTimer = null;
let countdownTimer = null;
let sessionTimeLeft = 15 * 60; // 15 minutes in seconds

// API Base URL
const API_BASE = '/api';

// Initialize the admin application
document.addEventListener('DOMContentLoaded', function() {
    checkAdminAuth();
});

// Check if admin is authenticated
async function checkAdminAuth() {
    try {
        const response = await fetch(`${API_BASE}/admin/auth-check`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.isAdmin) {
                currentAdmin = data.user;
                document.getElementById('admin-name').textContent = data.user.firstName;
                
                // Show admin management if super admin
                if (data.user.permissions && data.user.permissions.includes('super_admin')) {
                    document.getElementById('nav-admins').style.display = 'block';
                }
                
                // Start session management
                startSessionTimer();
                loadDashboardData();
            } else {
                redirectToLogin();
            }
        } else {
            redirectToLogin();
        }
    } catch (error) {
        console.error('Admin auth check error:', error);
        redirectToLogin();
    }
}

function redirectToLogin() {
    window.location.href = '/admin/login';
}

// Session Management
function startSessionTimer() {
    // Update session timer display every second
    const timerInterval = setInterval(() => {
        sessionTimeLeft--;
        updateSessionDisplay();
        
        if (sessionTimeLeft <= 0) {
            clearInterval(timerInterval);
            forceLogout();
        } else if (sessionTimeLeft === 120) { // 2 minutes warning
            showSessionWarning();
        }
    }, 1000);

    // Set warning timer (13 minutes)
    warningTimer = setTimeout(showSessionWarning, 13 * 60 * 1000);
    
    // Set logout timer (15 minutes)
    sessionTimer = setTimeout(forceLogout, 15 * 60 * 1000);
}

function updateSessionDisplay() {
    const minutes = Math.floor(sessionTimeLeft / 60);
    const seconds = sessionTimeLeft % 60;
    const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    const sessionElement = document.getElementById('time-left');
    if (sessionElement) {
        sessionElement.textContent = timeDisplay;
        
        // Change color based on time left
        const timerElement = document.getElementById('session-timer');
        if (sessionTimeLeft <= 120) { // Last 2 minutes
            timerElement.style.color = '#dc3545'; // Red
        } else if (sessionTimeLeft <= 300) { // Last 5 minutes
            timerElement.style.color = '#fd7e14'; // Orange
        } else {
            timerElement.style.color = '#666';
        }
    }
}

function showSessionWarning() {
    showAlert('Your session will expire in 2 minutes. Click anywhere to extend your session.', 'warning', 10000);
    
    // Add click listener to extend session
    document.addEventListener('click', extendSession, { once: true });
}

function extendSession() {
    // Clear existing timers
    if (sessionTimer) clearTimeout(sessionTimer);
    if (warningTimer) clearTimeout(warningTimer);
    
    // Reset session time
    sessionTimeLeft = 15 * 60;
    
    // Restart timers
    startSessionTimer();
    
    showAlert('Session extended for 15 more minutes', 'success');
}

async function forceLogout() {
    try {
        await fetch(`${API_BASE}/admin/logout`, {
            method: 'POST',
            credentials: 'include'
        });
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    window.location.href = '/admin/login';
}

// Navigation functions
function showDashboard() {
    hideAllContent();
    document.getElementById('dashboard-content').style.display = 'block';
    document.getElementById('page-title').textContent = 'Dashboard';
    setActiveNav(0);
    loadDashboardData();
}

function showOrders() {
    hideAllContent();
    document.getElementById('orders-content').style.display = 'block';
    document.getElementById('page-title').textContent = 'Orders Management';
    setActiveNav(1);
    loadOrders();
}

function showUsers() {
    hideAllContent();
    document.getElementById('users-content').style.display = 'block';
    document.getElementById('page-title').textContent = 'Users Management';
    setActiveNav(2);
    loadUsers();
}

function showSettings() {
    hideAllContent();
    document.getElementById('settings-content').style.display = 'block';
    document.getElementById('page-title').textContent = 'Settings';
    setActiveNav(3);
    loadSettings();
}

function hideAllContent() {
    document.querySelectorAll('[id$="-content"]').forEach(el => {
        el.style.display = 'none';
    });
}

function setActiveNav(index) {
    document.querySelectorAll('.sidebar .nav-link').forEach((link, i) => {
        if (i === index) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Dashboard functions
async function loadDashboardData() {
    try {
        const response = await fetch(`${API_BASE}/admin/stats`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            updateDashboardStats(data);
            updateRecentOrders(data.recentOrders || []);
        } else {
            showAlert('Failed to load dashboard data.', 'danger');
        }
    } catch (error) {
        console.error('Dashboard loading error:', error);
        showAlert('Failed to load dashboard data.', 'danger');
    }
}

function updateDashboardStats(stats) {
    document.getElementById('total-orders').textContent = stats.totalOrders || 0;
    document.getElementById('total-revenue').textContent = `$${stats.totalRevenue || '0.00'}`;
    document.getElementById('pending-orders').textContent = stats.pendingOrders || 0;
    document.getElementById('total-users').textContent = stats.totalUsers || 0;
}

function updateRecentOrders(orders) {
    const tbody = document.getElementById('recent-orders-table');
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No recent orders</td></tr>';
        return;
    }
    
    tbody.innerHTML = orders.map(order => `
        <tr>
            <td><code>${order.id.substring(0, 8)}...</code></td>
            <td>${order.user?.firstName || 'Unknown'} ${order.user?.lastName || ''}</td>
            <td>${order.product?.name || 'Unknown'}</td>
            <td>$${order.totalAmount}</td>
            <td><span class="order-status status-${order.status}">${order.status.toUpperCase()}</span></td>
            <td>${new Date(order.createdAt).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="viewOrderDetails('${order.id}')">
                    <i class="bi bi-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-warning" onclick="updateOrderStatusModal('${order.id}')">
                    <i class="bi bi-pencil"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Orders management
async function loadOrders(page = 1, status = 'all') {
    try {
        const response = await fetch(`${API_BASE}/admin/orders?page=${page}&status=${status}`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            updateOrdersTable(data.orders);
            updatePagination(data.page, data.totalPages);
            currentPage = data.page;
        } else {
            showAlert('Failed to load orders.', 'danger');
        }
    } catch (error) {
        console.error('Orders loading error:', error);
        showAlert('Failed to load orders.', 'danger');
    }
}

function updateOrdersTable(orders) {
    const tbody = document.getElementById('orders-table');
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No orders found</td></tr>';
        return;
    }
    
    tbody.innerHTML = orders.map(order => `
        <tr>
            <td><code>${order.id.substring(0, 8)}...</code></td>
            <td>
                ${order.user?.firstName || 'Unknown'} ${order.user?.lastName || ''}<br>
                <small class="text-muted">${order.user?.email || ''}</small>
            </td>
            <td>${order.product?.name || 'Unknown'}</td>
            <td>${order.quantity}</td>
            <td>$${order.totalAmount}</td>
            <td><span class="order-status status-${order.status}">${order.status.toUpperCase()}</span></td>
            <td>${new Date(order.createdAt).toLocaleDateString()}</td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-primary" onclick="viewOrderDetails('${order.id}')" title="View Details">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-warning" onclick="updateOrderStatusModal('${order.id}')" title="Update Status">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-info" onclick="sendCustomEmail('${order.id}')" title="Send Email">
                        <i class="bi bi-envelope"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function updatePagination(currentPage, totalPages) {
    const pagination = document.getElementById('orders-pagination');
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '<ul class="pagination pagination-sm">';
    
    // Previous button
    if (currentPage > 1) {
        paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="loadOrders(${currentPage - 1}, '${currentStatusFilter}')">Previous</a></li>`;
    }
    
    // Page numbers
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
        const active = i === currentPage ? 'active' : '';
        paginationHTML += `<li class="page-item ${active}"><a class="page-link" href="#" onclick="loadOrders(${i}, '${currentStatusFilter}')">${i}</a></li>`;
    }
    
    // Next button
    if (currentPage < totalPages) {
        paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="loadOrders(${currentPage + 1}, '${currentStatusFilter}')">Next</a></li>`;
    }
    
    paginationHTML += '</ul>';
    pagination.innerHTML = paginationHTML;
}

function filterOrders() {
    const status = document.getElementById('status-filter').value;
    currentStatusFilter = status;
    currentPage = 1;
    loadOrders(1, status);
}

// Order details modal
async function viewOrderDetails(orderId) {
    try {
        const response = await fetch(`${API_BASE}/admin/orders/${orderId}`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const order = await response.json();
            displayOrderDetails(order);
            
            const modal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
            modal.show();
        } else {
            showAlert('Failed to load order details.', 'danger');
        }
    } catch (error) {
        console.error('Order details error:', error);
        showAlert('Failed to load order details.', 'danger');
    }
}

function displayOrderDetails(order) {
    const shippingAddress = typeof order.shippingAddress === 'string' 
        ? JSON.parse(order.shippingAddress) 
        : order.shippingAddress;
    
    const boardingPassDetails = typeof order.boardingPassDetails === 'string'
        ? JSON.parse(order.boardingPassDetails)
        : order.boardingPassDetails;
    
    document.getElementById('order-details-content').innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h6>Order Information</h6>
                <table class="table table-sm">
                    <tr><td><strong>Order ID:</strong></td><td>${order.id}</td></tr>
                    <tr><td><strong>Status:</strong></td><td><span class="order-status status-${order.status}">${order.status.toUpperCase()}</span></td></tr>
                    <tr><td><strong>Payment Status:</strong></td><td>${order.paymentStatus || 'Unknown'}</td></tr>
                    <tr><td><strong>Order Date:</strong></td><td>${new Date(order.createdAt).toLocaleDateString()}</td></tr>
                    <tr><td><strong>Total Amount:</strong></td><td>$${order.totalAmount}</td></tr>
                    ${order.trackingNumber ? `<tr><td><strong>Tracking:</strong></td><td>${order.trackingNumber}</td></tr>` : ''}
                </table>
                
                <h6 class="mt-4">Customer Information</h6>
                <table class="table table-sm">
                    <tr><td><strong>Name:</strong></td><td>${order.user?.firstName || ''} ${order.user?.lastName || ''}</td></tr>
                    <tr><td><strong>Email:</strong></td><td>${order.user?.email || 'Unknown'}</td></tr>
                </table>
                
                <h6 class="mt-4">Product Information</h6>
                <table class="table table-sm">
                    <tr><td><strong>Product:</strong></td><td>${order.product?.name || 'Unknown'}</td></tr>
                    <tr><td><strong>Size:</strong></td><td>${order.product?.size || 'Unknown'}</td></tr>
                    <tr><td><strong>Quantity:</strong></td><td>${order.quantity}</td></tr>
                    <tr><td><strong>Unit Price:</strong></td><td>$${order.product?.price || '0.00'}</td></tr>
                    <tr><td><strong>Shipping:</strong></td><td>$${order.shipping}</td></tr>
                </table>
            </div>
            
            <div class="col-md-6">
                <h6>Shipping Address</h6>
                <div class="bg-light p-3 rounded">
                    ${shippingAddress?.fullName || ''}<br>
                    ${shippingAddress?.address || ''}<br>
                    ${shippingAddress?.city || ''}, ${shippingAddress?.state || ''} ${shippingAddress?.zipCode || ''}<br>
                    ${shippingAddress?.country || ''}
                </div>
                
                ${boardingPassDetails?.fileId ? `
                    <h6 class="mt-4">Boarding Pass</h6>
                    <div class="bg-light p-3 rounded text-center">
                        <p><strong>File ID:</strong> ${boardingPassDetails.fileId}</p>
                        <button class="btn btn-sm btn-primary" onclick="downloadBoardingPass('${boardingPassDetails.fileId}')">
                            <i class="bi bi-download"></i> Download File
                        </button>
                    </div>
                ` : ''}
                
                <h6 class="mt-4">Actions</h6>
                <div class="d-grid gap-2">
                    <button class="btn btn-warning" onclick="updateOrderStatusModal('${order.id}')">
                        <i class="bi bi-pencil"></i> Update Status
                    </button>
                    <button class="btn btn-info" onclick="sendCustomEmail('${order.id}')">
                        <i class="bi bi-envelope"></i> Send Email
                    </button>
                    ${order.status === 'shipped' ? `
                        <button class="btn btn-success" onclick="addTrackingNumber('${order.id}')">
                            <i class="bi bi-truck"></i> Update Tracking
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

// Status update modal
function updateOrderStatusModal(orderId) {
    document.getElementById('update-order-id').value = orderId;
    
    const modal = new bootstrap.Modal(document.getElementById('statusUpdateModal'));
    modal.show();
}

async function updateOrderStatus() {
    const orderId = document.getElementById('update-order-id').value;
    const newStatus = document.getElementById('new-status').value;
    const trackingNumber = document.getElementById('tracking-number').value;
    
    if (!orderId || !newStatus) {
        showAlert('Please fill in all required fields.', 'warning');
        return;
    }
    
    if (newStatus === 'shipped' && !trackingNumber) {
        showAlert('Tracking number is required when setting status to shipped.', 'warning');
        return;
    }
    
    try {
        // Update status
        const statusResponse = await fetch(`${API_BASE}/admin/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus }),
            credentials: 'include'
        });
        
        if (!statusResponse.ok) {
            throw new Error('Status update failed');
        }
        
        // Add tracking number if provided
        if (trackingNumber) {
            const trackingResponse = await fetch(`${API_BASE}/admin/orders/${orderId}/tracking`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    trackingNumber,
                    estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days from now
                }),
                credentials: 'include'
            });
            
            if (!trackingResponse.ok) {
                throw new Error('Tracking update failed');
            }
        }
        
        bootstrap.Modal.getInstance(document.getElementById('statusUpdateModal')).hide();
        showAlert('Order status updated successfully!', 'success');
        
        // Refresh current view
        if (document.getElementById('orders-content').style.display !== 'none') {
            loadOrders(currentPage, currentStatusFilter);
        } else {
            loadDashboardData();
        }
        
    } catch (error) {
        console.error('Status update error:', error);
        showAlert('Failed to update order status.', 'danger');
    }
}

// Users management
async function loadUsers() {
    try {
        // This would need to be implemented in the backend
        const tbody = document.getElementById('users-table');
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">User management coming soon...</td></tr>';
    } catch (error) {
        console.error('Users loading error:', error);
        showAlert('Failed to load users.', 'danger');
    }
}

// Settings management
function loadSettings() {
    // Load current settings from environment or database
    // This is a simplified version - in production, you'd want to load from a secure settings API
    document.getElementById('smtp-host').value = 'smtp.gmail.com';
    document.getElementById('smtp-port').value = '587';
    document.getElementById('paypal-mode').value = 'sandbox';
}

function updateEmailSettings() {
    showAlert('Email settings would be updated in production. This requires server restart.', 'info');
}

function updatePayPalSettings() {
    showAlert('PayPal settings would be updated in production. This requires server restart.', 'info');
}

// Utility functions
function refreshData() {
    if (document.getElementById('dashboard-content').style.display !== 'none') {
        loadDashboardData();
    } else if (document.getElementById('orders-content').style.display !== 'none') {
        loadOrders(currentPage, currentStatusFilter);
    } else if (document.getElementById('users-content').style.display !== 'none') {
        loadUsers();
    }
    showAlert('Data refreshed!', 'success');
}

async function logout() {
    await forceLogout();
}

function downloadBoardingPass(fileId) {
    // This would download the boarding pass file
    showAlert('Download functionality would be implemented here.', 'info');
}

function sendCustomEmail(orderId) {
    // This would open a modal to send custom emails
    showAlert('Custom email functionality would be implemented here.', 'info');
}

function addTrackingNumber(orderId) {
    // This would open a modal to add/update tracking information
    updateOrderStatusModal(orderId);
    document.getElementById('new-status').value = 'shipped';
    document.getElementById('tracking-fields').style.display = 'block';
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
