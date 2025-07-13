#!/usr/bin/env node

/**
 * Railway Environment Variables Template (SECURE VERSION)
 * This script reads from .env file and generates Railway variable list
 * NO HARDCODED CREDENTIALS - reads from environment
 */

require('dotenv').config();

console.log('🚂 RAILWAY ENVIRONMENT VARIABLES (SECURE)');
console.log('==========================================');
console.log('Copy these to Railway Dashboard → Your Project → Variables:');
console.log('');

// Read from environment variables (not hardcoded)
const envVars = {
    'REDIS_URL': process.env.REDIS_URL || 'MISSING_FROM_ENV',
    'NODE_ENV': 'production', // Always production for Railway
    'PORT': process.env.PORT || '3000',
    'SESSION_SECRET': process.env.SESSION_SECRET || 'MISSING_FROM_ENV',
    'JWT_SECRET': process.env.JWT_SECRET || 'MISSING_FROM_ENV',
    'JWT_EXPIRES_IN': process.env.JWT_EXPIRES_IN || '7d',
    'ADMIN_EMAIL': process.env.ADMIN_EMAIL || 'MISSING_FROM_ENV',
    'ADMIN_PASSWORD': process.env.ADMIN_PASSWORD || 'MISSING_FROM_ENV',
    'PAYPAL_CLIENT_ID': process.env.PAYPAL_CLIENT_ID || 'MISSING_FROM_ENV',
    'PAYPAL_CLIENT_SECRET': process.env.PAYPAL_CLIENT_SECRET || 'MISSING_FROM_ENV',
    'PAYPAL_MODE': process.env.PAYPAL_MODE || 'sandbox',
    'SMTP_HOST': process.env.SMTP_HOST || 'smtp.gmail.com',
    'SMTP_PORT': process.env.SMTP_PORT || '587',
    'SMTP_USER': process.env.SMTP_USER || 'MISSING_FROM_ENV',
    'SMTP_PASS': process.env.SMTP_PASS || 'MISSING_FROM_ENV',
    'EMAIL_FROM': process.env.EMAIL_FROM || 'MISSING_FROM_ENV',
    'MAX_FILE_SIZE': process.env.MAX_FILE_SIZE || '50mb',
    'UPLOAD_PATH': process.env.UPLOAD_PATH || './uploads'
};

// Check for missing values
const missing = Object.entries(envVars).filter(([key, value]) => value === 'MISSING_FROM_ENV');

if (missing.length > 0) {
    console.log('⚠️ WARNING: Missing environment variables in .env file:');
    missing.forEach(([key]) => console.log(`   - ${key}`));
    console.log('');
    console.log('📝 Please update your .env file with these values before deploying.');
    console.log('');
}

console.log('📋 Variables to set in Railway Dashboard:');
console.log('');

Object.entries(envVars).forEach(([key, value]) => {
    if (value !== 'MISSING_FROM_ENV') {
        console.log(`${key}=${value}`);
    }
});

console.log('');
console.log('📋 INSTRUCTIONS:');
console.log('1. Go to https://railway.app/dashboard');
console.log('2. Click on your project');
console.log('3. Click "Variables" tab');
console.log('4. Add each variable above (one by one)');
console.log('5. Click "Deploy" to redeploy');
console.log('');
console.log('⚠️ IMPORTANT: Railway does NOT read .env files!');
console.log('   All variables must be set in Railway dashboard.');

module.exports = envVars;
