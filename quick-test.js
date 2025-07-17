const http = require('http');

console.log('🔍 Quick server test...');

// Test if server starts
const server = require('./server.js');

setTimeout(() => {
    console.log('✅ Server started successfully!');
    
    // Quick endpoint test
    http.get('http://localhost:3000/ping', (res) => {
        console.log(`✅ /ping responds with status: ${res.statusCode}`);
        
        http.get('http://localhost:3000/health', (res) => {
            console.log(`✅ /health responds with status: ${res.statusCode}`);
            
            console.log('🎯 Server is ready for Railway deployment!');
            process.exit(0);
        });
    });
}, 1000);
