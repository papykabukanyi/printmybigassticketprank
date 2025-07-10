// Test script to verify the application setup
require('dotenv').config();

console.log('🔍 Testing application setup...\n');

// Test environment variables
console.log('📋 Environment Variables:');
console.log(`- PORT: ${process.env.PORT || '3000'}`);
console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`- REDIS_URL: ${process.env.REDIS_URL ? '✅ Set' : '❌ Missing'}`);
console.log(`- PAYPAL_CLIENT_ID: ${process.env.PAYPAL_CLIENT_ID ? '✅ Set' : '❌ Missing'}`);
console.log(`- SMTP_HOST: ${process.env.SMTP_HOST ? '✅ Set' : '❌ Missing'}`);

// Test Redis connection
console.log('\n🔗 Testing Redis connection...');
try {
    const Redis = require('ioredis');
    const redis = new Redis(process.env.REDIS_URL, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 1,
        lazyConnect: true
    });
    
    redis.ping().then(() => {
        console.log('✅ Redis connection successful');
        redis.disconnect();
    }).catch(err => {
        console.log('❌ Redis connection failed:', err.message);
    });
} catch (error) {
    console.log('❌ Redis setup error:', error.message);
}

// Test basic modules
console.log('\n📦 Testing core modules...');
try {
    require('express');
    console.log('✅ Express loaded');
    
    require('bcryptjs');
    console.log('✅ bcryptjs loaded');
    
    require('jsonwebtoken');
    console.log('✅ jsonwebtoken loaded');
    
    require('nodemailer');
    console.log('✅ nodemailer loaded');
    
    require('multer');
    console.log('✅ multer loaded');
    
    console.log('\n🎉 All core modules loaded successfully!');
} catch (error) {
    console.log('❌ Module loading error:', error.message);
}

console.log('\n📝 Next steps:');
console.log('1. Update .env file with your actual credentials');
console.log('2. Run: npm run init-admin');
console.log('3. Run: npm run dev');
console.log('4. Open: http://localhost:3000');
console.log('5. Admin panel: http://localhost:3000/admin');
console.log('\n✨ Setup verification complete!');
