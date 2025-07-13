#!/usr/bin/env node

/**
 * RAILWAY VARIABLE SETUP HELPER (SECURE VERSION)
 * Reads from .env file instead of hardcoding credentials
 */

require('dotenv').config();

console.log('🚨 RAILWAY DEPLOYMENT FIX - SECURE VERSION');
console.log('===========================================');
console.log('');
console.log('🚂 Go to: https://railway.app/dashboard → Your Project → Variables');
console.log('📝 Add each variable below (click "Add Variable" for each one):');
console.log('');

// Define variable importance but read values from environment
const variableConfig = [
    { name: 'REDIS_URL', critical: true },
    { name: 'NODE_ENV', critical: true, defaultValue: 'production' },
    { name: 'PORT', critical: true, defaultValue: '3000' },
    { name: 'SESSION_SECRET', critical: true },
    { name: 'JWT_SECRET', critical: true },
    { name: 'JWT_EXPIRES_IN', critical: true, defaultValue: '7d' },
    { name: 'ADMIN_EMAIL', critical: true },
    { name: 'ADMIN_PASSWORD', critical: true },
    { name: 'PAYPAL_CLIENT_ID', critical: false },
    { name: 'PAYPAL_CLIENT_SECRET', critical: false },
    { name: 'PAYPAL_MODE', critical: false, defaultValue: 'sandbox' },
    { name: 'SMTP_HOST', critical: false, defaultValue: 'smtp.gmail.com' },
    { name: 'SMTP_PORT', critical: false, defaultValue: '587' },
    { name: 'SMTP_USER', critical: false },
    { name: 'SMTP_PASS', critical: false },
    { name: 'EMAIL_FROM', critical: false },
    { name: 'MAX_FILE_SIZE', critical: false, defaultValue: '50mb' },
    { name: 'UPLOAD_PATH', critical: false, defaultValue: './uploads' }
];

// Get values from environment
const variables = variableConfig.map(config => ({
    ...config,
    value: process.env[config.name] || config.defaultValue || 'MISSING_FROM_ENV'
}));

// Check for missing critical values
const missingCritical = variables.filter(v => v.critical && v.value === 'MISSING_FROM_ENV');

if (missingCritical.length > 0) {
    console.log('❌ ERROR: Missing critical environment variables in .env file:');
    missingCritical.forEach(v => console.log(`   - ${v.name}`));
    console.log('');
    console.log('📝 Please add these to your .env file first, then run this script again.');
    console.log('');
    process.exit(1);
}

// Critical variables first
console.log('🔥 CRITICAL VARIABLES (Add these first):');
console.log('---------------------------------------');
variables.filter(v => v.critical).forEach((variable, index) => {
    if (variable.value !== 'MISSING_FROM_ENV') {
        console.log(`${index + 1}. Variable Name: ${variable.name}`);
        console.log(`   Variable Value: ${variable.value}`);
        console.log('');
    }
});

console.log('💡 OPTIONAL VARIABLES (Add these for full functionality):');
console.log('--------------------------------------------------------');
variables.filter(v => !v.critical).forEach((variable, index) => {
    if (variable.value !== 'MISSING_FROM_ENV') {
        console.log(`${index + 1}. Variable Name: ${variable.name}`);
        console.log(`   Variable Value: ${variable.value}`);
        console.log('');
    }
});

const missingOptional = variables.filter(v => !v.critical && v.value === 'MISSING_FROM_ENV');
if (missingOptional.length > 0) {
    console.log('⚠️ OPTIONAL VARIABLES MISSING FROM .env:');
    missingOptional.forEach(v => console.log(`   - ${v.name}`));
    console.log('');
}

console.log('📋 INSTRUCTIONS:');
console.log('1. Copy each Variable Name and Variable Value above');
console.log('2. In Railway dashboard, click "Add Variable"');
console.log('3. Paste the Variable Name in the name field');
console.log('4. Paste the Variable Value in the value field');
console.log('5. Click "Save" or "Add"');
console.log('6. Repeat for ALL variables above');
console.log('7. After adding all, click "Deploy" to redeploy');
console.log('');
console.log('⚠️ CRITICAL: Railway completely ignores your .env file!');
console.log('   Variables MUST be set in Railway dashboard manually.');
console.log('');
console.log('✅ Success check: Visit /health endpoint after deployment');
console.log('   Should show: {"status":"healthy","services":{"redis":"connected"}}');

module.exports = variables;
