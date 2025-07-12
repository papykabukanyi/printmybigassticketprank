const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authMiddleware = async (req, res, next) => {
    try {
        // Try to get token from cookies first (for admin), then from Authorization header
        let token = req.cookies.adminToken || req.cookies.token;
        
        if (!token) {
            const authHeader = req.header('Authorization');
            if (authHeader) {
                token = authHeader.replace('Bearer ', '');
            }
        }

        if (!token) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const user = await db.getUserById(decoded.userId);
        if (!user) {
            return res.status(401).json({ error: 'Invalid token. User not found.' });
        }

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
        
        console.error('Auth middleware error:', error);
        res.status(401).json({ error: 'Invalid token.' });
    }
};

module.exports = authMiddleware;
