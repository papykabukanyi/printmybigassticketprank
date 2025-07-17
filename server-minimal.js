const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Railway
app.set('trust proxy', 1);

// Basic middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Critical Railway health check endpoint
app.get('/ping', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        message: 'Railway deployment successful!'
    });
});

// Detailed health check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        port: PORT,
        message: 'All systems operational'
    });
});

// Main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Catch all for SPA routing
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'API endpoint not found' });
    } else {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server with extensive logging
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('\n🚀 RAILWAY MINIMAL SERVER STARTED');
    console.log('================================');
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health Check: /ping`);
    console.log(`📊 Detailed Health: /health`);
    console.log(`🏠 Main Site: /`);
    console.log('================================');
    console.log('✅ Railway deployment should now work!');
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});

module.exports = app;
