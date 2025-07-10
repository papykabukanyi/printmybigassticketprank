// Quick server test
require('dotenv').config();

console.log('Testing server startup...');

try {
    const express = require('express');
    const app = express();
    
    // Import routes to test for path-to-regexp errors
    const authRoutes = require('./routes/auth');
    const productRoutes = require('./routes/products');
    const orderRoutes = require('./routes/orders');
    const adminRoutes = require('./routes/admin');
    const paymentRoutes = require('./routes/payment');
    const uploadRoutes = require('./routes/upload');
    
    console.log('✅ All route modules loaded successfully');
    
    // Test route mounting
    app.use('/api/auth', authRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/orders', orderRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/payment', paymentRoutes);
    app.use('/api/upload', uploadRoutes);
    
    console.log('✅ All routes mounted successfully');
    console.log('🎉 Server test passed! No path-to-regexp errors found.');
    
} catch (error) {
    console.log('❌ Server test failed:', error.message);
    console.log('Error details:', error);
}
