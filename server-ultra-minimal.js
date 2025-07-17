const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Minimal middleware
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint - THIS IS CRITICAL FOR RAILWAY
app.get('/ping', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Health endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Fallback for all routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
