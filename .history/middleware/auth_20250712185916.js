const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authMiddleware = async (req, res, next) => {
    try {
        // Try to get token from cookies first (for admin), then from Authorization header
        let token = req.cookies.adminToken || req.cookies.token;
        
        console.log('🔍 Auth middleware - Cookies:', Object.keys(req.cookies));
        console.log('🔍 Auth middleware - adminToken present:', !!req.cookies.adminToken);
        
        if (!token) {
            const authHeader = req.header('Authorization');
            if (authHeader) {
                token = authHeader.replace('Bearer ', '');
                console.log('🔍 Auth middleware - Token from header:', !!token);
            }
        }

        if (!token) {
            console.log('❌ Auth middleware - No token found');
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        console.log('🔍 Auth middleware - Verifying token...');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✅ Auth middleware - Token verified for user:', decoded.userId);
        
        // Get user from database
        const user = await db.getUserById(decoded.userId);
        if (!user) {
            console.log('❌ Auth middleware - User not found:', decoded.userId);
            return res.status(401).json({ error: 'Invalid token. User not found.' });
        }

        console.log('✅ Auth middleware - User found:', user.email);

        // Check if user is active
        if (user.isActive === 'false') {
            return res.status(401).json({ error: 'Account deactivated' });
        }

        // Parse permissions if they exist
        if (user.permissions && typeof user.permissions === 'string') {
            try {
                user.permissions = JSON.parse(user.permissions);
            } catch (e) {
                user.permissions = [];
            }
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            // Clear expired cookies
            res.clearCookie('adminToken');
            res.clearCookie('token');
            return res.status(401).json({ error: 'Token expired', expired: true });
        }
        
        console.error('❌ Auth middleware error:', error);
        res.status(401).json({ error: 'Invalid token.' });
    }
};

module.exports = authMiddleware;
