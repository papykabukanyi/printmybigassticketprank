const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const emailService = require('../services/emailService');

const router = express.Router();

// PayPal configuration
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_BASE_URL = process.env.PAYPAL_MODE === 'live' 
    ? 'https://api.paypal.com' 
    : 'https://api.sandbox.paypal.com';

// Get PayPal access token
async function getPayPalAccessToken() {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    
    const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });
    
    const data = await response.json();
    return data.access_token;
}

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
        const accessToken = await getPayPalAccessToken();
        
        const paymentData = {
            intent: 'CAPTURE',
            purchase_units: [{
                reference_id: orderId,
                amount: {
                    currency_code: 'USD',
                    value: total.toFixed(2),
                    breakdown: {
                        item_total: {
                            currency_code: 'USD',
                            value: subtotal.toFixed(2)
                        },
                        shipping: {
                            currency_code: 'USD',
                            value: shipping.toFixed(2)
                        }
                    }
                },
                items: [{
                    name: `${product.name} x${quantity}`,
                    unit_amount: {
                        currency_code: 'USD',
                        value: (subtotal / quantity).toFixed(2)
                    },
                    quantity: quantity.toString(),
                    category: 'PHYSICAL_GOODS'
                }],
                description: `Boarding Pass Print - ${product.size}`
            }],
            application_context: {
                return_url: `${process.env.FRONTEND_URL}/payment/success?orderId=${orderId}`,
                cancel_url: `${process.env.FRONTEND_URL}/payment/cancel?orderId=${orderId}`,
                brand_name: 'Boarding Pass Print',
                landing_page: 'BILLING',
                user_action: 'PAY_NOW'
            }
        };

        const paymentResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(paymentData)
        });

        const payment = await paymentResponse.json();

        if (!paymentResponse.ok) {
            console.error('PayPal payment creation error:', payment);
            return res.status(500).json({ error: 'Payment creation failed' });
        }

        // Store payment ID in order
        await db.updateOrder(orderId, { paypalPaymentId: payment.id });

        // Find approval URL
        const approvalUrl = payment.links.find(link => link.rel === 'approve');
        
        res.json({
            orderId,
            paymentId: payment.id,
            approvalUrl: approvalUrl.href,
            totalAmount: total.toFixed(2)
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
