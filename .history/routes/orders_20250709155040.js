const express = require('express');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const emailService = require('../services/emailService');

const router = express.Router();

// Get user orders
router.get('/', authMiddleware, async (req, res) => {
    try {
        const orders = await db.getUserOrders(req.user.id);
        
        // Enrich orders with product details
        const enrichedOrders = await Promise.all(orders.map(async (order) => {
            const product = await db.getProductById(order.productId);
            return {
                ...order,
                product,
                shippingAddress: JSON.parse(order.shippingAddress || '{}'),
                boardingPassDetails: JSON.parse(order.boardingPassDetails || '{}')
            };
        }));

        res.json(enrichedOrders);
    } catch (error) {
        console.error('Orders fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get specific order
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const order = await db.getOrderById(req.params.id);
        if (!order || order.userId !== req.user.id) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const product = await db.getProductById(order.productId);
        
        res.json({
            ...order,
            product,
            shippingAddress: JSON.parse(order.shippingAddress || '{}'),
            boardingPassDetails: JSON.parse(order.boardingPassDetails || '{}')
        });
    } catch (error) {
        console.error('Order fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Track shipment
router.get('/:id/tracking', authMiddleware, async (req, res) => {
    try {
        const order = await db.getOrderById(req.params.id);
        if (!order || order.userId !== req.user.id) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (!order.trackingNumber) {
            return res.json({
                status: order.status,
                message: 'Tracking information not yet available'
            });
        }

        // Mock tracking data - replace with real shipping API
        const trackingSteps = [
            { status: 'Order Confirmed', date: order.createdAt, completed: true },
            { status: 'In Production', date: order.productionStarted || null, completed: !!order.productionStarted },
            { status: 'Shipped', date: order.shippedAt || null, completed: !!order.shippedAt },
            { status: 'Delivered', date: order.deliveredAt || null, completed: !!order.deliveredAt }
        ];

        res.json({
            orderId: order.id,
            trackingNumber: order.trackingNumber,
            status: order.status,
            estimatedDelivery: order.estimatedDelivery,
            trackingSteps
        });
    } catch (error) {
        console.error('Tracking fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
