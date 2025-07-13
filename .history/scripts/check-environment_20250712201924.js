#!/usr/bin/env node

/**
 * Railway Environment Setup Helper
 * This script helps verify your Railway environment variables are set correctly
 */

const required = [
    'REDIS_URL',
    'JWT_SECRET',
    'SESSION_SECRET'
];

const recommended = [
    'PAYPAL_CLIENT_ID',
    'PAYPAL_CLIENT_SECRET',
    'ADMIN_EMAIL',
    'ADMIN_PASSWORD'
];

const optional = [
    'SMTP_HOST',
    'SMTP_USER',
    'SMTP_PASS',
    'EMAIL_FROM'
];

console.log('🔧 Railway Environment Variables Check\n');

console.log('📋 REQUIRED Variables:');
required.forEach(key => {
    const value = process.env[key];
    const status = value ? '✅' : '❌';
    console.log(`   ${status} ${key}: ${value ? 'Set' : 'MISSING'}`);
});

console.log('\n💡 RECOMMENDED Variables (for full functionality):');
recommended.forEach(key => {
    const value = process.env[key];
    const status = value ? '✅' : '⚠️';
    console.log(`   ${status} ${key}: ${value ? 'Set' : 'Not set'}`);
});

console.log('\n🔧 OPTIONAL Variables:');
optional.forEach(key => {
    const value = process.env[key];
    const status = value ? '✅' : '⭕';
    console.log(`   ${status} ${key}: ${value ? 'Set' : 'Not set'}`);
});

// Check if running in Railway
const isRailway = process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID;
console.log(`\n🚂 Platform: ${isRailway ? 'Railway' : 'Local/Other'}`);

if (isRailway) {
    console.log(`   Project: ${process.env.RAILWAY_PROJECT_NAME || 'Unknown'}`);
    console.log(`   Environment: ${process.env.RAILWAY_ENVIRONMENT || 'Unknown'}`);
}

// Summary
const missingRequired = required.filter(key => !process.env[key]);
const missingRecommended = recommended.filter(key => !process.env[key]);

console.log('\n📊 Summary:');
if (missingRequired.length === 0) {
    console.log('✅ All required variables are set');
} else {
    console.log(`❌ Missing ${missingRequired.length} required variables: ${missingRequired.join(', ')}`);
}

if (missingRecommended.length > 0) {
    console.log(`⚠️ Missing ${missingRecommended.length} recommended variables: ${missingRecommended.join(', ')}`);
}

// Instructions
if (missingRequired.length > 0 || missingRecommended.length > 0) {
    console.log('\n🛠️ To fix in Railway:');
    console.log('1. Go to your Railway project dashboard');
    console.log('2. Click on "Variables" tab');
    console.log('3. Add the missing variables');
    console.log('4. Redeploy your application');
    console.log('\n📖 See DEPLOYMENT.md for exact values to use');
}

// Test Redis connection if URL is provided
if (process.env.REDIS_URL) {
    console.log('\n🔗 Testing Redis connection...');
    const Redis = require('ioredis');
    
    const redis = new Redis(process.env.REDIS_URL, {
        connectTimeout: 5000,
        lazyConnect: true
    });
    
    redis.ping()
        .then(() => {
            console.log('✅ Redis connection successful');
            redis.disconnect();
        })
        .catch(err => {
            console.log('❌ Redis connection failed:', err.message);
        });
} else {
    console.log('\n⚠️ Skipping Redis test - REDIS_URL not set');
}

module.exports = { required, recommended, optional };
