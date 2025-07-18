const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payment');
const uploadRoutes = require('./routes/upload');

// Import middleware
const authMiddleware = require('./middleware/auth');
const { adminMiddleware } = require('./middleware/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Railway deployment
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable for PayPal integration
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Allow all origins in development
        if (process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        
        // In production, allow specified origins
        const allowedOrigins = [
            process.env.FRONTEND_URL,
            'https://your-app.railway.app',
            'http://localhost:3000',
            'http://127.0.0.1:3000'
        ].filter(Boolean);
        
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        
        // Allow same-origin requests
        return callback(null, true);
    },
    credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(compression());

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set to false for development
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        sameSite: 'lax' // More permissive for development
    }
}));

// Logging
app.use(morgan('combined'));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/upload', uploadRoutes);

// Config endpoint for frontend
app.get('/api/config', (req, res) => {
    res.json({
        paypalClientId: process.env.PAYPAL_CLIENT_ID || 'sb',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Health check endpoint for Railway
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Serve frontend pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Admin routes with proper authentication
app.get('/admin/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

app.get('/admin', (req, res) => {
    res.redirect('/admin/login');
});

app.get('/admin/dashboard', authMiddleware, adminMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Handle 404 for unmatched routes
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'API endpoint not found' });
    } else {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Environment variables validation
function validateEnvironment() {
    const required = ['REDIS_URL'];
    const missing = required.filter(key => !process.env[key]);
    
    console.log('\n🔧 Environment Check:');
    console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`PORT: ${PORT}`);
    console.log(`REDIS_URL: ${process.env.REDIS_URL ? '✅ Set' : '❌ Missing'}`);
    console.log(`PAYPAL_CLIENT_ID: ${process.env.PAYPAL_CLIENT_ID ? '✅ Set' : '⚠️ Missing (payments disabled)'}`);
    console.log(`ADMIN_EMAIL: ${process.env.ADMIN_EMAIL || 'admin@boardingpassprint.com'}`);
    
    if (missing.length > 0) {
        console.error(`\n❌ Missing required environment variables: ${missing.join(', ')}`);
        console.error('📋 Please set these in Railway dashboard (not .env file)');
        console.error('📖 See DEPLOYMENT.md for setup instructions');
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    } else {
        console.log('✅ All required environment variables are set');
    }
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Server starting...`);
    console.log(`📍 Running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Validate environment
    validateEnvironment();
    
    // Initialize admin user on first start if needed
    setTimeout(async () => {
        try {
            console.log('\n👨‍💼 Admin Setup:');
            const db = require('./config/database');
            const bcrypt = require('bcryptjs');
            
            console.log('Checking for admin user...');
            const adminEmail = process.env.ADMIN_EMAIL || 'admin@boardingpassprint.com';
            const existingAdmin = await db.getUserByEmail(adminEmail);
            
            if (!existingAdmin) {
                console.log('Creating super admin user...');
                const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'SecureAdmin2025!', 12);
                const adminData = {
                    email: adminEmail,
                    password: hashedPassword,
                    firstName: 'Super',
                    lastName: 'Admin',
                    role: 'admin',
                    permissions: JSON.stringify(['super_admin', 'all']),
                    isActive: 'true',
                    createdAt: new Date().toISOString()
                };
                await db.createUser(adminData);
                console.log('✅ Super admin user created successfully');
                console.log(`📧 Email: ${adminEmail}`);
                console.log(`🔑 Password: ${process.env.ADMIN_PASSWORD || 'SecureAdmin2025!'}`);
            } else {
                console.log('✅ Admin user already exists');
                console.log(`📧 Email: ${adminEmail}`);
            }
            
            console.log('\n🎯 Quick Start:');
            console.log(`🌐 Health Check: /health`);
            console.log(`👨‍💼 Admin Login: /admin/login`);
            console.log(`🏪 Main Site: /`);
            
        } catch (error) {
            console.log('⚠️ Admin user creation error:', error.message);
            console.log('💡 This might be due to Redis connection issues');
            console.log('🔍 Check REDIS_URL in Railway dashboard');
        }
    }, 3000);
});

module.exports = app;
