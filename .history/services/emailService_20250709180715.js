const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        try {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });

            // Only verify connection if credentials are provided
            if (process.env.SMTP_USER && process.env.SMTP_PASS) {
                this.transporter.verify((error, success) => {
                    if (error) {
                        console.error('Email service configuration error:', error.message);
                        console.log('💡 Email notifications will be disabled. Configure SMTP credentials in .env to enable emails.');
                    } else {
                        console.log('✅ Email service ready');
                    }
                });
            } else {
                console.log('⚠️  SMTP credentials not configured. Email notifications will be disabled.');
                console.log('💡 Configure SMTP_USER and SMTP_PASS in .env to enable email notifications.');
            }
        } catch (error) {
            console.error('Email service initialization error:', error.message);
            console.log('💡 Email notifications will be disabled.');
        }
    }

    async sendOrderConfirmation(email, order) {
        if (!this.transporter || !process.env.SMTP_USER) {
            console.log('📧 Email not sent - SMTP not configured');
            return { messageId: 'not-configured' };
        }
        
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: `Order Confirmation - Order #${order.id}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333; text-align: center;">Order Confirmation</h2>
                    
                    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3>Order Details</h3>
                        <p><strong>Order ID:</strong> ${order.id}</p>
                        <p><strong>Total Amount:</strong> $${order.totalAmount}</p>
                        <p><strong>Status:</strong> ${order.status}</p>
                        <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>

                    <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3>What's Next?</h3>
                        <ul>
                            <li>We'll start processing your boarding pass print immediately</li>
                            <li>You'll receive tracking information once your order ships</li>
                            <li>Estimated delivery: 3-5 business days</li>
                        </ul>
                    </div>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL}/orders/${order.id}" 
                           style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                            Track Your Order
                        </a>
                    </div>

                    <p style="color: #666; font-size: 14px; text-align: center;">
                        Thank you for choosing our boarding pass printing service!
                    </p>
                </div>
            `
        };

        return this.transporter.sendMail(mailOptions);
    }

    async sendOrderStatusUpdate(email, order, newStatus) {
        if (!this.transporter || !process.env.SMTP_USER) {
            console.log('📧 Email not sent - SMTP not configured');
            return { messageId: 'not-configured' };
        }
        
        const statusMessages = {
            processing: 'Your order is being processed',
            printing: 'Your boarding pass is being printed',
            shipped: 'Your order has been shipped',
            delivered: 'Your order has been delivered',
            cancelled: 'Your order has been cancelled'
        };

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: `Order Update - Order #${order.id}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333; text-align: center;">Order Status Update</h2>
                    
                    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3>Order #${order.id}</h3>
                        <p style="font-size: 18px; color: #007bff;"><strong>${statusMessages[newStatus]}</strong></p>
                        <p><strong>Updated:</strong> ${new Date().toLocaleDateString()}</p>
                    </div>

                    ${newStatus === 'shipped' && order.trackingNumber ? `
                        <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3>Tracking Information</h3>
                            <p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>
                            <p>You can track your package using the tracking number above.</p>
                        </div>
                    ` : ''}

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL}/orders/${order.id}" 
                           style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                            View Order Details
                        </a>
                    </div>
                </div>
            `
        };

        return this.transporter.sendMail(mailOptions);
    }

    async sendTrackingInfo(email, order, trackingNumber) {
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: `Your Order Has Shipped - Tracking #${trackingNumber}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333; text-align: center;">Your Order Has Shipped!</h2>
                    
                    <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3>Tracking Information</h3>
                        <p><strong>Order ID:</strong> ${order.id}</p>
                        <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
                        <p><strong>Carrier:</strong> ${order.carrier || 'Standard Shipping'}</p>
                        ${order.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${new Date(order.estimatedDelivery).toLocaleDateString()}</p>` : ''}
                    </div>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL}/orders/${order.id}/tracking" 
                           style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                            Track Package
                        </a>
                    </div>

                    <p style="color: #666; font-size: 14px; text-align: center;">
                        Your boarding pass print is on its way!
                    </p>
                </div>
            `
        };

        return this.transporter.sendMail(mailOptions);
    }

    async sendCustomEmail(email, subject, message, order = null) {
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: subject,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">${subject}</h2>
                    
                    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        ${message.replace(/\n/g, '<br>')}
                    </div>

                    ${order ? `
                        <div style="background: #e9ecef; padding: 15px; border-radius: 4px; margin: 20px 0;">
                            <p><strong>Related Order:</strong> ${order.id}</p>
                        </div>
                    ` : ''}

                    <p style="color: #666; font-size: 14px; text-align: center;">
                        Best regards,<br>
                        Boarding Pass Print Team
                    </p>
                </div>
            `
        };

        return this.transporter.sendMail(mailOptions);
    }

    async sendWelcomeEmail(email, firstName) {
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Welcome to Boarding Pass Print!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333; text-align: center;">Welcome ${firstName}!</h2>
                    
                    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p>Thank you for joining Boarding Pass Print! We're excited to help you create amazing large-format prints of your boarding passes.</p>
                        
                        <h3>What we offer:</h3>
                        <ul>
                            <li>High-quality prints in 3 different sizes</li>
                            <li>Fast processing and shipping</li>
                            <li>Easy order tracking</li>
                            <li>Excellent customer support</li>
                        </ul>
                    </div>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL}" 
                           style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                            Start Your Order
                        </a>
                    </div>

                    <p style="color: #666; font-size: 14px; text-align: center;">
                        Need help? Contact us anytime!
                    </p>
                </div>
            `
        };

        return this.transporter.sendMail(mailOptions);
    }
}

module.exports = new EmailService();
