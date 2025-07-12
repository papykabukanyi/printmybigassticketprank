const bcrypt = require('bcrypt');
const db = require('../config/database');

async function initializeSuperAdmin() {
    try {
        console.log('🔧 Initializing Super Admin...');
        
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@boardingpassprint.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'SecureAdmin2025!';
        
        // Check if admin already exists
        const existingAdmin = await db.getUserByEmail(adminEmail);
        
        if (existingAdmin) {
            console.log('✅ Super Admin already exists');
            console.log(`📧 Email: ${adminEmail}`);
            console.log(`🔑 Password: ${adminPassword}`);
            
            // Update permissions to ensure super admin status
            await db.updateUserPermissions(existingAdmin.id, ['super_admin', 'all']);
            await db.updateUser(existingAdmin.id, { isActive: 'true' });
            
            console.log('✅ Super Admin permissions updated');
            return;
        }
        
        // Create super admin
        const hashedPassword = await bcrypt.hash(adminPassword, 12);
        const adminData = {
            email: adminEmail,
            password: hashedPassword,
            firstName: 'Super',
            lastName: 'Admin',
            role: 'admin',
            permissions: JSON.stringify(['super_admin', 'all']),
            isActive: 'true',
            createdAt: new Date().toISOString()
        };
        
        await db.createUser(adminData);
        
        console.log('✅ Super Admin created successfully!');
        console.log(`📧 Email: ${adminEmail}`);
        console.log(`🔑 Password: ${adminPassword}`);
        console.log('🌐 Access admin panel at: http://localhost:3000/admin');
        
    } catch (error) {
        console.error('❌ Error initializing Super Admin:', error);
    }
}

// Run if called directly
if (require.main === module) {
    require('dotenv').config();
    initializeSuperAdmin().then(() => {
        process.exit(0);
    });
}

module.exports = initializeSuperAdmin;
