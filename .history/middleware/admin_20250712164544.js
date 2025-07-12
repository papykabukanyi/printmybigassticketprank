const adminMiddleware = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    // Check if account is active
    if (req.user.isActive === 'false') {
        return res.status(403).json({ error: 'Admin account deactivated' });
    }

    next();
};

// Permission-specific middleware
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        // Super admin has all permissions
        if (req.user.permissions && req.user.permissions.includes('super_admin')) {
            return next();
        }

        // Check specific permission
        if (!req.user.permissions || !req.user.permissions.includes(permission)) {
            return res.status(403).json({ error: `Permission '${permission}' required` });
        }

        next();
    };
};

module.exports = { adminMiddleware, requirePermission };
