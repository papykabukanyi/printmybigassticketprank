const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const emailService = require('../services/emailService');

const router = express.Router();

// All routes require auth middleware (applied in server.js) and admin middleware

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

module.exports = router;
