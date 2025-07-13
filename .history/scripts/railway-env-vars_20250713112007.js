#!/usr/bin/env node

/**
 * Railway Environment Variables Export
 * Copy these exact values to Railway Dashboard → Variables
 */

console.log('🚂 RAILWAY ENVIRONMENT VARIABLES');
console.log('================================');
console.log('Copy these to Railway Dashboard → Your Project → Variables:');
console.log('');

const envVars = {
    'REDIS_URL': 'redis://default:wipIKRLferhupCxLZxNOirxKzzXFFNTU@centerbeam.proxy.rlwy.net:36797',
    'NODE_ENV': 'production',
    'PORT': '3000',
    'SESSION_SECRET': 'railway-boarding-pass-session-secret-2025',
    'JWT_SECRET': 'railway-boarding-pass-jwt-secret-2025',
    'JWT_EXPIRES_IN': '7d',
    'ADMIN_EMAIL': 'admin@boardingpassprint.com',
    'ADMIN_PASSWORD': 'SecureAdmin2025!',
    'PAYPAL_CLIENT_ID': 'Ac6pmPJOdOg9gTpowD1JxvQ0RrFSBH7WiVLt43TsCKJdmI51PWSq6BikGoYdYQotnEotE0yUNk6jxd8U',
    'PAYPAL_CLIENT_SECRET': 'ECxG-tx-wLz-2FIuEPvljUyoY21R5a8cHNTYC8Sm9mKdXZspndgng4kJ820qTwrQb5Hpuwcj7RLH4OzA',
    'PAYPAL_MODE': 'sandbox',
    'SMTP_HOST': 'smtp.gmail.com',
    'SMTP_PORT': '587',
    'SMTP_USER': 'papykabukanyi@gmail.com',
    'SMTP_PASS': 'lcqowjuwimhsptwq',
    'EMAIL_FROM': 'papykabukanyi@gmail.com',
    'MAX_FILE_SIZE': '50mb',
    'UPLOAD_PATH': './uploads'
};

Object.entries(envVars).forEach(([key, value]) => {
    console.log(`${key}=${value}`);
});

console.log('');
console.log('📋 INSTRUCTIONS:');
console.log('1. Go to https://railway.app/dashboard');
console.log('2. Click on your project');
console.log('3. Click "Variables" tab');
console.log('4. Add each variable above (one by one)');
console.log('5. Click "Deploy" to redeploy');
console.log('');
console.log('⚠️  IMPORTANT: Railway does NOT read .env files!');
console.log('   All variables must be set in Railway dashboard.');

module.exports = envVars;
