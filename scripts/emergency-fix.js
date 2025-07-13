#!/usr/bin/env node

console.log('🚨 RAILWAY EMERGENCY FIX');
console.log('========================');
console.log('');
console.log('Your Railway app is down because it needs environment variables!');
console.log('');
console.log('🔧 QUICK FIX:');
console.log('1. Go to: https://railway.app/dashboard');
console.log('2. Click your project');
console.log('3. Click "Variables" tab');
console.log('4. Add these variables:');
console.log('');

const criticalVars = [
    ['REDIS_URL', 'redis://default:wipIKRLferhupCxLZxNOirxKzzXFFNTU@centerbeam.proxy.rlwy.net:36797'],
    ['NODE_ENV', 'production'],
    ['PORT', '3000'],
    ['SESSION_SECRET', 'railway-boarding-pass-session-secret-2025'],
    ['JWT_SECRET', 'railway-boarding-pass-jwt-secret-2025'],
    ['ADMIN_EMAIL', 'admin@boardingpassprint.com'],
    ['ADMIN_PASSWORD', 'SecureAdmin2025!']
];

console.log('🔥 CRITICAL VARIABLES (add these first):');
criticalVars.forEach(([name, value], i) => {
    console.log(`${i + 1}. Name: ${name}`);
    console.log(`   Value: ${value}`);
    console.log('');
});

console.log('⚡ AFTER ADDING ALL VARIABLES:');
console.log('- Click "Deploy" button');
console.log('- Wait 2-3 minutes');
console.log('- Your site will work!');
console.log('');
console.log('💡 Railway ignores .env files - must use dashboard!');
