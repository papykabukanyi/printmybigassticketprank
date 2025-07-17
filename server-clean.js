const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// CRITICAL: Trust proxy for Railway
app.set('trust proxy', 1);

// Basic JSON middleware
app.use(express.json());

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// CRITICAL: Health check endpoint for Railway
app.get('/ping', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Detailed health check
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Admin login page
app.get('/admin/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

// Admin redirect
app.get('/admin', (req, res) => {
    res.redirect('/admin/login');
});

// Fallback for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
