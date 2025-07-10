const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const emailService = require('../services/emailService');

const router = express.Router();

// PayPal configuration
const paypal = require('paypal-rest-sdk');

paypal.configure({
    mode: process.env.PAYPAL_MODE || 'sandbox',
    client_id: process.env.PAYPAL_CLIENT_ID,
    client_secret: process.env.PAYPAL_CLIENT_SECRET
});

// Create PayPal payment
router.post('/create-payment', authMiddleware, [
    body('productId').notEmpty(),
    body('quantity').isInt({ min: 1 }),
    body('shippingAddress').isObject(),
    body('boardingPassDetails').isObject()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { productId, quantity, shippingAddress, boardingPassDetails } = req.body;

        // Get product details
        const product = await db.getProductById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const subtotal = product.price * quantity;
        const shipping = product.shipping;
        const total = subtotal + shipping;

        // Create order in database
        const orderData = {
            userId: req.user.id,
            productId,
            quantity,
            subtotal: subtotal.toFixed(2),
            shipping: shipping.toFixed(2),
            totalAmount: total.toFixed(2),
            shippingAddress: JSON.stringify(shippingAddress),
            boardingPassDetails: JSON.stringify(boardingPassDetails),
            status: 'pending',
            paymentStatus: 'pending'
        };

        const orderId = await db.createOrder(orderData);

        // Create PayPal payment
        const payment = {
            intent: 'sale',
            payer: {
                payment_method: 'paypal'
            },
            redirect_urls: {
                return_url: `${process.env.FRONTEND_URL}/payment/success?orderId=${orderId}`,
                cancel_url: `${process.env.FRONTEND_URL}/payment/cancel?orderId=${orderId}`
            },
            transactions: [{
                item_list: {
                    items: [{
                        name: `${product.name} x${quantity}`,
                        sku: productId,
                        price: subtotal.toFixed(2),
                        currency: 'USD',
                        quantity: 1
                    }, {
                        name: 'Shipping',
                        sku: 'shipping',
                        price: shipping.toFixed(2),
                        currency: 'USD',
                        quantity: 1
                    }]
                },
                amount: {
                    currency: 'USD',
                    total: total.toFixed(2)
                },
                description: `Boarding Pass Print - ${product.size}`
            }]
        };

        paypal.payment.create(payment, (error, payment) => {
            if (error) {
                console.error('PayPal payment creation error:', error);
                return res.status(500).json({ error: 'Payment creation failed' });
            }

            // Store payment ID in order
            db.updateOrder(orderId, { paypalPaymentId: payment.id });

            // Find approval URL
            const approvalUrl = payment.links.find(link => link.rel === 'approval_url');
            
            res.json({
                orderId,
                paymentId: payment.id,
                approvalUrl: approvalUrl.href,
                totalAmount: total.toFixed(2)
            });
        });

    } catch (error) {
        console.error('Payment creation error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Execute PayPal payment
router.post('/execute-payment', authMiddleware, [
    body('paymentId').notEmpty(),
    body('payerId').notEmpty(),
    body('orderId').notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { paymentId, payerId, orderId } = req.body;

        // Get order from database
        const order = await db.getOrderById(orderId);
        if (!order || order.userId !== req.user.id) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const execute_payment_json = {
            payer_id: payerId,
            transactions: [{
                amount: {
                    currency: 'USD',
                    total: order.totalAmount
                }
            }]
        };

        paypal.payment.execute(paymentId, execute_payment_json, async (error, payment) => {
            if (error) {
                console.error('PayPal payment execution error:', error);
                await db.updateOrder(orderId, { 
                    paymentStatus: 'failed',
                    status: 'cancelled'
                });
                return res.status(500).json({ error: 'Payment execution failed' });
            }

            // Update order status
            await db.updateOrder(orderId, {
                paymentStatus: 'completed',
                status: 'processing',
                paypalTransactionId: payment.transactions[0].related_resources[0].sale.id,
                paidAt: new Date().toISOString()
            });

            // Send confirmation email
            try {
                await emailService.sendOrderConfirmation(req.user.email, order);
            } catch (emailError) {
                console.error('Email sending error:', emailError);
            }

            res.json({
                message: 'Payment completed successfully',
                orderId,
                transactionId: payment.transactions[0].related_resources[0].sale.id
            });
        });

    } catch (error) {
        console.error('Payment execution error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get payment status
router.get('/status/:orderId', authMiddleware, async (req, res) => {
    try {
        const order = await db.getOrderById(req.params.orderId);
        if (!order || order.userId !== req.user.id) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({
            orderId: order.id,
            status: order.status,
            paymentStatus: order.paymentStatus,
            totalAmount: order.totalAmount
        });
    } catch (error) {
        console.error('Payment status error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
