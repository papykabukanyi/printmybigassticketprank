const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');

// Load environment variables
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Railway
app.set('trust proxy', 1);

// Basic middleware
app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax'
    }
}));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// Essential endpoints
app.get('/ping', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        message: 'Server is running'
    });
});

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        port: PORT
    });
});

// API config endpoint
app.get('/api/config', (req, res) => {
    res.json({
        paypalClientId: process.env.PAYPAL_CLIENT_ID || 'sb',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Main routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.redirect('/admin/login');
});

app.get('/admin/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

// Try to load and use routes with error handling
try {
    const authRoutes = require('./routes/auth');
    const productRoutes = require('./routes/products');
    const orderRoutes = require('./routes/orders');
    const adminRoutes = require('./routes/admin');
    const paymentRoutes = require('./routes/payment');
    const uploadRoutes = require('./routes/upload');
    
    app.use('/api/auth', authRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/orders', orderRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/payment', paymentRoutes);
    app.use('/api/upload', uploadRoutes);
    
    console.log('✅ All API routes loaded successfully');
} catch (error) {
    console.warn('⚠️ Some API routes failed to load:', error.message);
    console.log('🚀 Server will start anyway with basic functionality');
}

// Fallback for all other routes
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'API endpoint not found' });
    } else {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Server starting on Railway...`);
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: /health`);
    console.log(`📍 Ping: /ping`);
    console.log(`🏠 Home: /`);
    console.log(`👨‍💼 Admin: /admin/login`);
    console.log(`\n✅ Server is ready!`);
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
    console.log('👋 Received SIGTERM, shutting down gracefully');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('👋 Received SIGINT, shutting down gracefully');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

module.exports = app;
