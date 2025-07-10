#!/usr/bin/env node

// Pre-deployment validation script
const fs = require('fs');
const path = require('path');

console.log('🔍 Running pre-deployment validation...\n');

// Check required files
const requiredFiles = [
    'server.js',
    'package.json',
    '.env',
    'railway.json',
    'Procfile',
    'config/database.js',
    'middleware/auth.js',
    'middleware/admin.js',
    'routes/auth.js',
    'routes/products.js',
    'routes/orders.js',
    'routes/admin.js',
    'routes/payment.js',
    'routes/upload.js',
    'services/emailService.js',
    'public/index.html',
    'public/admin.html'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
    if (fs.existsSync(path.join(__dirname, file))) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - MISSING`);
        allFilesExist = false;
    }
});

// Check for deprecated dependencies
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const deprecatedPackages = ['paypal-rest-sdk'];
let hasDeprecatedPackages = false;

deprecatedPackages.forEach(pkg => {
    if (packageJson.dependencies[pkg]) {
        console.log(`❌ Deprecated package found: ${pkg}`);
        hasDeprecatedPackages = true;
    }
});

if (!hasDeprecatedPackages) {
    console.log('✅ No deprecated packages found');
}

// Check .gitignore for documentation exclusion
const gitignore = fs.readFileSync(path.join(__dirname, '.gitignore'), 'utf8');
if (gitignore.includes('*.md')) {
    console.log('✅ Documentation files excluded in .gitignore');
} else {
    console.log('❌ Documentation files not properly excluded');
}

// Check for documentation files that shouldn't exist
const docFiles = ['README.md', 'DEPLOYMENT.md', 'QUICKSTART.md'];
let hasDocs = false;
docFiles.forEach(file => {
    if (fs.existsSync(path.join(__dirname, file))) {
        console.log(`❌ Documentation file found: ${file} (should be removed)`);
        hasDocs = true;
    }
});

if (!hasDocs) {
    console.log('✅ No documentation files found');
}

// Final status
console.log('\n📋 Validation Summary:');
if (allFilesExist && !hasDeprecatedPackages && !hasDocs) {
    console.log('🎉 All checks passed! Ready for Railway deployment.');
    console.log('\n🚀 Next steps:');
    console.log('1. Commit all changes to git');
    console.log('2. Push to your Railway-connected GitHub repository');
    console.log('3. Configure environment variables on Railway:');
    console.log('   - REDIS_URL (your Redis connection string)');
    console.log('   - PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET');
    console.log('   - SMTP credentials (SMTP_USER, SMTP_PASS)');
    console.log('   - FRONTEND_URL (your Railway app URL)');
    process.exit(0);
} else {
    console.log('❌ Some issues found. Please fix them before deployment.');
    process.exit(1);
}
