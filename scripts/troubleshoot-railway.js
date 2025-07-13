#!/usr/bin/env node

/**
 * Railway Deployment Troubleshooter
 * Helps diagnose and fix common Railway deployment issues
 */

console.log('🔧 RAILWAY DEPLOYMENT TROUBLESHOOTER');
console.log('=====================================');
console.log('');

// Check if running locally or in production
const isProduction = process.env.NODE_ENV === 'production';
const isRailway = process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID;

console.log('📍 Environment Detection:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
console.log(`   Platform: ${isRailway ? 'Railway' : 'Local'}`);
console.log(`   Production: ${isProduction ? 'Yes' : 'No'}`);
console.log('');

// Critical environment variables check
const criticalVars = [
    'REDIS_URL',
    'SESSION_SECRET', 
    'JWT_SECRET',
    'ADMIN_EMAIL',
    'ADMIN_PASSWORD'
];

const optionalVars = [
    'PAYPAL_CLIENT_ID',
    'PAYPAL_CLIENT_SECRET',
    'SMTP_USER',
    'SMTP_PASS'
];

console.log('🔍 Environment Variables Status:');
console.log('');

console.log('🚨 CRITICAL VARIABLES:');
let missingCritical = [];
criticalVars.forEach(varName => {
    const exists = !!process.env[varName];
    const status = exists ? '✅' : '❌';
    console.log(`   ${status} ${varName}: ${exists ? 'SET' : 'MISSING'}`);
    if (!exists) missingCritical.push(varName);
});

console.log('');
console.log('💡 OPTIONAL VARIABLES:');
let missingOptional = [];
optionalVars.forEach(varName => {
    const exists = !!process.env[varName];
    const status = exists ? '✅' : '⚠️';
    console.log(`   ${status} ${varName}: ${exists ? 'SET' : 'NOT SET'}`);
    if (!exists) missingOptional.push(varName);
});

console.log('');
console.log('📊 SUMMARY:');
if (missingCritical.length === 0) {
    console.log('✅ All critical variables are set');
} else {
    console.log(`❌ Missing ${missingCritical.length} critical variables: ${missingCritical.join(', ')}`);
}

if (missingOptional.length > 0) {
    console.log(`⚠️ Missing ${missingOptional.length} optional variables: ${missingOptional.join(', ')}`);
}

// Test Redis connection if URL is available
console.log('');
console.log('🔗 Database Connection Test:');
if (process.env.REDIS_URL) {
    console.log('   REDIS_URL found, testing connection...');
    
    const Redis = require('ioredis');
    const redis = new Redis(process.env.REDIS_URL, {
        connectTimeout: 5000,
        lazyConnect: true,
        retryAttempts: 1
    });
    
    redis.ping()
        .then(() => {
            console.log('   ✅ Redis connection successful');
            redis.disconnect();
        })
        .catch(err => {
            console.log('   ❌ Redis connection failed:', err.message);
            console.log('   💡 Check REDIS_URL format in Railway dashboard');
        });
} else {
    console.log('   ❌ REDIS_URL not found - this will cause deployment failure');
}

console.log('');
console.log('🛠️ NEXT STEPS:');

if (missingCritical.length > 0) {
    console.log('1. 🚨 URGENT: Set missing critical variables in Railway dashboard');
    console.log('   → Go to: https://railway.app/dashboard');
    console.log('   → Your Project → Variables tab');
    console.log('   → Add missing variables');
    console.log('');
    console.log('   Missing critical variables:');
    missingCritical.forEach(varName => {
        console.log(`   - ${varName}`);
    });
}

if (isRailway && missingCritical.length === 0) {
    console.log('1. ✅ All critical variables are set');
    console.log('2. 🔄 If deployment still failing, try:');
    console.log('   → Force redeploy in Railway dashboard');
    console.log('   → Check Railway build logs for errors');
    console.log('   → Verify health endpoint: /health');
}

if (!isRailway) {
    console.log('1. 📝 This appears to be running locally');
    console.log('2. 🚂 For Railway deployment:');
    console.log('   → Set all variables in Railway dashboard (not .env)');
    console.log('   → Railway completely ignores .env files');
    console.log('   → Run: npm run railway-fix for copy-paste instructions');
}

console.log('');
console.log('📖 Helpful Commands:');
console.log('   npm run railway-fix     → Show variables to copy to Railway');
console.log('   npm run verify-deployment <url> → Test deployed app');
console.log('   npm run check-env       → Check environment setup');

module.exports = {
    missingCritical,
    missingOptional,
    isProduction,
    isRailway
};
