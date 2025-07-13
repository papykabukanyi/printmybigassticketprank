#!/usr/bin/env node

/**
 * RAILWAY VARIABLE COPY HELPER
 * This script outputs all variables in a format easy to copy to Railway
 */

console.log('🚨 RAILWAY DEPLOYMENT FIX - COPY THESE VARIABLES');
console.log('================================================');
console.log('');
console.log('🚂 Go to: https://railway.app/dashboard → Your Project → Variables');
console.log('📝 Add each variable below (click "Add Variable" for each one):');
console.log('');

const variables = [
    { name: 'REDIS_URL', value: 'redis://default:wipIKRLferhupCxLZxNOirxKzzXFFNTU@centerbeam.proxy.rlwy.net:36797', critical: true },
    { name: 'NODE_ENV', value: 'production', critical: true },
    { name: 'PORT', value: '3000', critical: true },
    { name: 'SESSION_SECRET', value: 'railway-boarding-pass-session-secret-2025', critical: true },
    { name: 'JWT_SECRET', value: 'railway-boarding-pass-jwt-secret-2025', critical: true },
    { name: 'JWT_EXPIRES_IN', value: '7d', critical: true },
    { name: 'ADMIN_EMAIL', value: 'admin@boardingpassprint.com', critical: true },
    { name: 'ADMIN_PASSWORD', value: 'SecureAdmin2025!', critical: true },
    { name: 'PAYPAL_CLIENT_ID', value: 'Ac6pmPJOdOg9gTpowD1JxvQ0RrFSBH7WiVLt43TsCKJdmI51PWSq6BikGoYdYQotnEotE0yUNk6jxd8U', critical: false },
    { name: 'PAYPAL_CLIENT_SECRET', value: 'ECxG-tx-wLz-2FIuEPvljUyoY21R5a8cHNTYC8Sm9mKdXZspndgng4kJ820qTwrQb5Hpuwcj7RLH4OzA', critical: false },
    { name: 'PAYPAL_MODE', value: 'sandbox', critical: false },
    { name: 'SMTP_HOST', value: 'smtp.gmail.com', critical: false },
    { name: 'SMTP_PORT', value: '587', critical: false },
    { name: 'SMTP_USER', value: 'papykabukanyi@gmail.com', critical: false },
    { name: 'SMTP_PASS', value: 'lcqowjuwimhsptwq', critical: false },
    { name: 'EMAIL_FROM', value: 'papykabukanyi@gmail.com', critical: false },
    { name: 'MAX_FILE_SIZE', value: '50mb', critical: false },
    { name: 'UPLOAD_PATH', value: './uploads', critical: false }
];

// Critical variables first
console.log('🔥 CRITICAL VARIABLES (Add these first):');
console.log('---------------------------------------');
variables.filter(v => v.critical).forEach((variable, index) => {
    console.log(`${index + 1}. Variable Name: ${variable.name}`);
    console.log(`   Variable Value: ${variable.value}`);
    console.log('');
});

console.log('💡 OPTIONAL VARIABLES (Add these for full functionality):');
console.log('--------------------------------------------------------');
variables.filter(v => !v.critical).forEach((variable, index) => {
    console.log(`${index + 1}. Variable Name: ${variable.name}`);
    console.log(`   Variable Value: ${variable.value}`);
    console.log('');
});

console.log('📋 INSTRUCTIONS:');
console.log('1. Copy each Variable Name and Variable Value above');
console.log('2. In Railway dashboard, click "Add Variable"');
console.log('3. Paste the Variable Name in the name field');
console.log('4. Paste the Variable Value in the value field');
console.log('5. Click "Save" or "Add"');
console.log('6. Repeat for ALL variables above');
console.log('7. After adding all, click "Deploy" to redeploy');
console.log('');
console.log('⚠️  CRITICAL: Railway completely ignores your .env file!');
console.log('   Variables MUST be set in Railway dashboard manually.');
console.log('');
console.log('✅ Success check: Visit /health endpoint after deployment');
console.log('   Should show: {"status":"healthy","services":{"redis":"connected"}}');

module.exports = variables;
