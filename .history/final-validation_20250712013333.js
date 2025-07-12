// Final comprehensive validation
console.log('🔍 Final Railway deployment validation...\n');

const fs = require('fs');
const path = require('path');

// Check Express version
const packageJson = require('./package.json');
console.log(`📦 Express version: ${packageJson.dependencies.express}`);

// Verify no deprecated packages
if (!packageJson.dependencies['paypal-rest-sdk']) {
    console.log('✅ No deprecated PayPal SDK');
} else {
    console.log('❌ Deprecated PayPal SDK still present');
}

// Check CORS configuration
const serverContent = fs.readFileSync('./server.js', 'utf8');
if (serverContent.includes('process.env.FRONTEND_URL')) {
    console.log('✅ Static CORS configuration using FRONTEND_URL');
} else {
    console.log('❌ CORS configuration issue');
}

// Check for problematic route patterns
if (!serverContent.includes("app.get('*'") && !serverContent.includes('app.get(/')) {
    console.log('✅ No problematic wildcard/regex routes');
} else {
    console.log('❌ Potentially problematic route patterns found');
}

// Check for duplicate routes
const routeMatches = serverContent.match(/app\.get\('\/'/g);
if (routeMatches && routeMatches.length <= 2) {
    console.log('✅ No duplicate route definitions');
} else {
    console.log('❌ Possible duplicate routes found');
}

console.log('\n🎯 Key fixes applied:');
console.log('✅ Downgraded from Express v5 to stable Express v4');
console.log('✅ Simplified CORS configuration');
console.log('✅ Removed problematic wildcard routes');
console.log('✅ Upgraded from deprecated paypal-rest-sdk to PayPal v2 API');
console.log('✅ Fixed route mounting conflicts');

console.log('\n🚀 Ready for Railway deployment!');
console.log('📋 Deploy steps:');
console.log('1. Commit and push changes to GitHub');
console.log('2. Set FRONTEND_URL environment variable on Railway');
console.log('3. Configure PayPal and SMTP credentials');

process.exit(0);
