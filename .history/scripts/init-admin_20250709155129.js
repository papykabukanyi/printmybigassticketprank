const bcrypt = require('bcryptjs');
const db = require('../config/database');
require('dotenv').config();

async function initializeAdmin() {
    try {
        console.log('Initializing admin user...');
        
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@boardingpassprint.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        
        // Check if admin already exists
        const existingAdmin = await db.getUserByEmail(adminEmail);
        if (existingAdmin) {
            console.log('Admin user already exists!');
            console.log(`Email: ${adminEmail}`);
            return;
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(adminPassword, 12);
        
        // Create admin user
        const adminData = {
            email: adminEmail,
            password: hashedPassword,
            firstName: 'Admin',
            lastName: 'User',
            role: 'admin',
            createdAt: new Date().toISOString()
        };
        
        const adminId = await db.createUser(adminData);
        
        console.log('✅ Admin user created successfully!');
        console.log(`Admin ID: ${adminId}`);
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);
        console.log('\n🔗 Access admin panel at: http://localhost:3000/admin');
        console.log('\n⚠️  Please change the default password after first login!');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin user:', error);
        process.exit(1);
    }
}

// Run the script
initializeAdmin();
