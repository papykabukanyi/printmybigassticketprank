#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Run this after deploying to Railway to verify everything works
 */

const https = require('https');
const http = require('http');

// Replace with your actual Railway app URL
const APP_URL = process.argv[2] || 'https://your-app.railway.app';

console.log(`🔍 Testing deployment at: ${APP_URL}\n`);

// Test endpoints
const tests = [
    {
        name: 'Health Check',
        path: '/health',
        expected: 200
    },
    {
        name: 'Main Page',
        path: '/',
        expected: 200
    },
    {
        name: 'Admin Login Page',
        path: '/admin/login',
        expected: 200
    },
    {
        name: 'API Config',
        path: '/api/config',
        expected: 200
    },
    {
        name: 'Products API',
        path: '/api/products',
        expected: 200
    }
];

async function testEndpoint(test) {
    return new Promise((resolve) => {
        const url = new URL(APP_URL + test.path);
        const client = url.protocol === 'https:' ? https : http;
        
        const req = client.request(url, { timeout: 10000 }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const success = res.statusCode === test.expected;
                resolve({
                    ...test,
                    status: res.statusCode,
                    success,
                    response: data.length > 200 ? data.substring(0, 200) + '...' : data
                });
            });
        });
        
        req.on('error', (err) => {
            resolve({
                ...test,
                status: 'ERROR',
                success: false,
                error: err.message
            });
        });
        
        req.on('timeout', () => {
            req.destroy();
            resolve({
                ...test,
                status: 'TIMEOUT',
                success: false,
                error: 'Request timeout'
            });
        });
        
        req.end();
    });
}

async function runTests() {
    const results = [];
    
    for (const test of tests) {
        process.stdout.write(`Testing ${test.name}... `);
        const result = await testEndpoint(test);
        
        if (result.success) {
            console.log(`✅ PASS (${result.status})`);
        } else {
            console.log(`❌ FAIL (${result.status || result.error})`);
        }
        
        results.push(result);
    }
    
    console.log('\n📊 Test Summary:');
    console.log('================');
    
    const passed = results.filter(r => r.success).length;
    const total = results.length;
    
    results.forEach(result => {
        const icon = result.success ? '✅' : '❌';
        console.log(`${icon} ${result.name}: ${result.status}`);
        if (result.error) {
            console.log(`   Error: ${result.error}`);
        }
    });
    
    console.log(`\n🎯 Results: ${passed}/${total} tests passed`);
    
    if (passed === total) {
        console.log('\n🎉 All tests passed! Your deployment is working correctly.');
        console.log(`\n🔗 Quick Links:`);
        console.log(`   Main Site: ${APP_URL}`);
        console.log(`   Admin Login: ${APP_URL}/admin/login`);
        console.log(`   Health Check: ${APP_URL}/health`);
    } else {
        console.log('\n⚠️ Some tests failed. Check Railway logs for errors.');
        console.log('💡 Common issues:');
        console.log('   • REDIS_URL not set in Railway dashboard');
        console.log('   • Other environment variables missing');
        console.log('   • Redis server not accessible');
    }
}

// Run if called directly
if (require.main === module) {
    if (!process.argv[2]) {
        console.log('Usage: node verify-deployment.js <your-railway-app-url>');
        console.log('Example: node verify-deployment.js https://your-app.railway.app');
        process.exit(1);
    }
    runTests().catch(console.error);
}

module.exports = { testEndpoint, runTests };
