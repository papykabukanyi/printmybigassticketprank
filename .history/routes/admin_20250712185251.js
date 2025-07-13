const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { adminMiddleware, requirePermission } = require('../middleware/admin');
const emailService = require('../services/emailService');

const router = express.Router();

// Admin login (no middleware required)
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
], async (req, res) => {
    try {
        console.log('🔐 Admin login attempt:', req.body.email);
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('❌ Validation errors:', errors.array());
            return res.status(400).json({ error: 'Invalid email or password format' });
        }

        const { email, password } = req.body;
        
        console.log('🔍 Looking for user:', email);
        // Get user by email
        const user = await db.getUserByEmail(email);
        if (!user || user.role !== 'admin') {
            console.log('❌ User not found or not admin:', email, user ? user.role : 'no user');
            return res.status(401).json({ error: 'Invalid credentials or insufficient permissions' });
        }

        console.log('✅ Admin user found:', user.email);

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            console.log('❌ Invalid password for:', email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        console.log('✅ Password valid, generating token...');

        // Generate JWT token with short expiration for admin
        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email, 
                role: user.role,
                loginTime: Date.now()
            },
            process.env.JWT_SECRET,
            { expiresIn: '15m' } // 15 minutes for admin sessions
        );

        console.log('✅ Token generated, setting cookie...');

        // Set HTTP-only cookie
        res.cookie('adminToken', token, {
            httpOnly: true,
            secure: false, // Set to false for development/testing
            sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        // Update last login
        await db.updateUserLastLogin(user.id);

        console.log('✅ Admin login successful for:', email);

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                permissions: user.permissions || ['all']
            }
        });
    } catch (error) {
        console.error('❌ Admin login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin logout
router.post('/logout', (req, res) => {
    res.clearCookie('adminToken');
    res.clearCookie('token'); // Clear regular token too
    res.json({ success: true });
});

// Check admin authentication status
router.get('/auth-check', authMiddleware, adminMiddleware, (req, res) => {
    res.json({ 
        isAdmin: true, 
        user: {
            id: req.user.id,
            email: req.user.email,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            role: req.user.role,
            permissions: req.user.permissions || ['all']
        }
    });
});

// All routes below require auth and admin middleware

// Get dashboard statistics
router.get('/stats', adminMiddleware, async (req, res) => {
    try {
        const stats = await db.getAdminStats();
        
        // Get recent orders for quick overview
        const allOrders = await db.getAllOrders();
        const recentOrders = allOrders.slice(0, 10);

        res.json({
            ...stats,
            recentOrders
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all orders
router.get('/orders', adminMiddleware, async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        
        // Get both user orders and guest orders
        let userOrders = await db.getAllOrders();
        let guestOrders = await db.getGuestOrders();
        
        // Combine all orders
        let orders = [...userOrders, ...guestOrders];
        
        // Filter by status if provided
        if (status && status !== 'all') {
            orders = orders.filter(order => order.status === status);
        }

        // Sort by creation date (newest first)
        orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedOrders = orders.slice(startIndex, endIndex);

        // Enrich with product and user details
        const enrichedOrders = await Promise.all(paginatedOrders.map(async (order) => {
            const product = await db.getProductById(order.productId);
            let user = null;
            
            // Handle guest vs registered user orders
            if (order.userId) {
                user = await db.getUserById(order.userId);
                if (user) {
                    user = { 
                        id: user.id, 
                        email: user.email, 
                        firstName: user.firstName, 
                        lastName: user.lastName 
                    };
                }
            }
            
            return {
                ...order,
                product,
                user,
                isGuest: order.isGuest || !order.userId,
                guestEmail: order.guestEmail || null,
                customerName: order.isGuest || !order.userId 
                    ? (order.shippingAddress ? JSON.parse(order.shippingAddress).fullName : 'Guest Customer')
                    : user ? `${user.firstName} ${user.lastName}` : 'Unknown',
                customerEmail: order.isGuest || !order.userId 
                    ? order.guestEmail 
                    : user ? user.email : null,
                shippingAddress: typeof order.shippingAddress === 'string' 
                    ? JSON.parse(order.shippingAddress || '{}') 
                    : order.shippingAddress || {},
                boardingPassDetails: typeof order.boardingPassDetails === 'string' 
                    ? JSON.parse(order.boardingPassDetails || '{}') 
                    : order.boardingPassDetails || {},
                customizations: order.customizations 
                    ? (typeof order.customizations === 'string' 
                        ? JSON.parse(order.customizations) 
                        : order.customizations)
                    : null
            };
        }));

        res.json({
            orders: enrichedOrders,
            totalCount: orders.length,
            page: parseInt(page),
            totalPages: Math.ceil(orders.length / limit)
        });
    } catch (error) {
        console.error('Admin orders fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update order status
router.put('/orders/:id/status', adminMiddleware, [
    body('status').isIn(['pending', 'processing', 'printing', 'shipped', 'delivered', 'cancelled'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { status } = req.body;
        const orderId = req.params.id;

        const order = await db.getOrderById(orderId);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const updates = { status };

        // Add timestamps for specific statuses
        if (status === 'printing') {
            updates.productionStarted = new Date().toISOString();
        } else if (status === 'shipped') {
            updates.shippedAt = new Date().toISOString();
            // Generate tracking number if not exists
            if (!order.trackingNumber) {
                updates.trackingNumber = `TRK${Date.now()}`;
            }
        } else if (status === 'delivered') {
            updates.deliveredAt = new Date().toISOString();
        }

        await db.updateOrder(orderId, updates);

        // Send status update email
        try {
            const user = await db.getUserById(order.userId);
            if (user) {
                await emailService.sendOrderStatusUpdate(user.email, order, status);
            }
        } catch (emailError) {
            console.error('Email sending error:', emailError);
        }

        res.json({ message: 'Order status updated successfully' });
    } catch (error) {
        console.error('Order status update error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add tracking number
router.put('/orders/:id/tracking', adminMiddleware, [
    body('trackingNumber').notEmpty().trim(),
    body('carrier').optional().trim(),
    body('estimatedDelivery').optional().isISO8601()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { trackingNumber, carrier, estimatedDelivery } = req.body;
        const orderId = req.params.id;

        const order = await db.getOrderById(orderId);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const updates = { 
            trackingNumber,
            status: 'shipped',
            shippedAt: new Date().toISOString()
        };

        if (carrier) updates.carrier = carrier;
        if (estimatedDelivery) updates.estimatedDelivery = estimatedDelivery;

        await db.updateOrder(orderId, updates);

        // Send tracking email
        try {
            const user = await db.getUserById(order.userId);
            if (user) {
                await emailService.sendTrackingInfo(user.email, order, trackingNumber);
            }
        } catch (emailError) {
            console.error('Email sending error:', emailError);
        }

        res.json({ message: 'Tracking information added successfully' });
    } catch (error) {
        console.error('Tracking update error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get order details
router.get('/orders/:id', adminMiddleware, async (req, res) => {
    try {
        const order = await db.getOrderById(req.params.id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const product = await db.getProductById(order.productId);
        const user = await db.getUserById(order.userId);

        res.json({
            ...order,
            product,
            user: user ? { 
                id: user.id, 
                email: user.email, 
                firstName: user.firstName, 
                lastName: user.lastName 
            } : null,
            shippingAddress: JSON.parse(order.shippingAddress || '{}'),
            boardingPassDetails: JSON.parse(order.boardingPassDetails || '{}')
        });
    } catch (error) {
        console.error('Admin order fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Send custom email to customer
router.post('/orders/:id/email', adminMiddleware, [
    body('subject').notEmpty().trim(),
    body('message').notEmpty().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { subject, message } = req.body;
        const orderId = req.params.id;

        const order = await db.getOrderById(orderId);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const user = await db.getUserById(order.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await emailService.sendCustomEmail(user.email, subject, message, order);

        res.json({ message: 'Email sent successfully' });
    } catch (error) {
        console.error('Custom email error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin Management Routes - Only Super Admin can access these

// Get all admin users
router.get('/admins', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        // Check if user is super admin
        if (!req.user.permissions || !req.user.permissions.includes('super_admin')) {
            return res.status(403).json({ error: 'Super admin access required' });
        }

        const admins = await db.getAllAdmins();
        res.json(admins);
    } catch (error) {
        console.error('Get admins error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add new admin
router.post('/admins', [
    body('email').isEmail().normalizeEmail(),
    body('firstName').trim().isLength({ min: 1 }),
    body('lastName').trim().isLength({ min: 1 }),
    body('password').isLength({ min: 8 }),
    body('permissions').optional().isArray()
], authMiddleware, adminMiddleware, async (req, res) => {
    try {
        // Check if user is super admin
        if (!req.user.permissions || !req.user.permissions.includes('super_admin')) {
            return res.status(403).json({ error: 'Super admin access required' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, firstName, lastName, password, permissions } = req.body;

        // Check if admin already exists
        const existingUser = await db.getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create admin user
        const adminData = {
            email,
            firstName,
            lastName,
            password: hashedPassword,
            role: 'admin',
            permissions: permissions || ['orders', 'users', 'settings'],
            createdAt: new Date().toISOString(),
            isActive: true
        };

        const newAdmin = await db.createUser(adminData);
        
        // Remove password from response
        delete newAdmin.password;

        res.status(201).json({
            success: true,
            admin: newAdmin
        });
    } catch (error) {
        console.error('Create admin error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update admin permissions
router.put('/admins/:id/permissions', [
    body('permissions').isArray()
], authMiddleware, adminMiddleware, async (req, res) => {
    try {
        // Check if user is super admin
        if (!req.user.permissions || !req.user.permissions.includes('super_admin')) {
            return res.status(403).json({ error: 'Super admin access required' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const adminId = req.params.id;
        const { permissions } = req.body;

        // Can't modify super admin permissions
        const targetAdmin = await db.getUserById(adminId);
        if (!targetAdmin) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        if (targetAdmin.permissions && targetAdmin.permissions.includes('super_admin')) {
            return res.status(400).json({ error: 'Cannot modify super admin permissions' });
        }

        await db.updateUserPermissions(adminId, permissions);

        res.json({
            success: true,
            message: 'Permissions updated successfully'
        });
    } catch (error) {
        console.error('Update permissions error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Deactivate admin (can't delete, only deactivate for audit purposes)
router.put('/admins/:id/deactivate', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        // Check if user is super admin
        if (!req.user.permissions || !req.user.permissions.includes('super_admin')) {
            return res.status(403).json({ error: 'Super admin access required' });
        }

        const adminId = req.params.id;

        // Can't deactivate super admin
        const targetAdmin = await db.getUserById(adminId);
        if (!targetAdmin) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        if (targetAdmin.permissions && targetAdmin.permissions.includes('super_admin')) {
            return res.status(400).json({ error: 'Cannot deactivate super admin' });
        }

        // Can't deactivate yourself
        if (targetAdmin.id === req.user.id) {
            return res.status(400).json({ error: 'Cannot deactivate your own account' });
        }

        await db.deactivateUser(adminId);

        res.json({
            success: true,
            message: 'Admin deactivated successfully'
        });
    } catch (error) {
        console.error('Deactivate admin error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Reactivate admin
router.put('/admins/:id/activate', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        // Check if user is super admin
        if (!req.user.permissions || !req.user.permissions.includes('super_admin')) {
            return res.status(403).json({ error: 'Super admin access required' });
        }

        const adminId = req.params.id;
        await db.activateUser(adminId);

        res.json({
            success: true,
            message: 'Admin activated successfully'
        });
    } catch (error) {
        console.error('Activate admin error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
