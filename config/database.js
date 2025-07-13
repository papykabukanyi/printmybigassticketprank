const Redis = require('ioredis');

class Database {
    constructor() {
        this.redisAvailable = false;
        const redisUrl = process.env.REDIS_URL;
        
        if (!redisUrl) {
            console.error('\n❌ REDIS_URL environment variable not found');
            console.error('📋 For Railway deployment:');
            console.error('   1. Go to your Railway project dashboard');
            console.error('   2. Click on "Variables" tab');
            console.error('   3. Add REDIS_URL with your Redis connection string');
            console.error('   4. Redeploy your application');
            console.error('\n💡 Railway does NOT read .env files - use the dashboard!');
            console.error('⚠️ Application will start but Redis features will be disabled');
            
            this.redis = null;
            this.redisAvailable = false;
            return;
        }

        console.log('🔗 Connecting to Redis database...');
        
        try {
            this.redis = new Redis(redisUrl, {
                retryDelayOnFailover: 100,
                maxRetriesPerRequest: 3,
                lazyConnect: true,
                connectTimeout: 10000,
                retryAttempts: 5,
                retryDelayOnClusterDown: 300,
                retryDelayOnFailover: 100,
                maxRetriesPerRequest: null,
                keepAlive: 30000
            });

            this.redis.on('connect', () => {
                console.log('✅ Connected to Redis database successfully');
                this.redisAvailable = true;
            });

            this.redis.on('error', (err) => {
                console.error('❌ Redis connection error:', err.message);
                this.redisAvailable = false;
                if (err.message.includes('ENOTFOUND') || err.message.includes('timeout')) {
                    console.error('💡 Redis connection tips:');
                    console.error('   • Check REDIS_URL format in Railway dashboard');
                    console.error('   • Ensure Redis server is running and accessible');
                    console.error('   • Verify network connectivity');
                }
            });

            this.redis.on('ready', () => {
                console.log('✅ Redis is ready for database operations');
                this.redisAvailable = true;
            });

            this.redis.on('close', () => {
                console.log('⚠️ Redis connection closed');
                this.redisAvailable = false;
            });

            this.redis.on('reconnecting', () => {
                console.log('🔄 Reconnecting to Redis...');
            });
        } catch (error) {
            console.error('❌ Failed to initialize Redis:', error.message);
            this.redis = null;
            this.redisAvailable = false;
        }
    }

    // Getter for Redis client access
    get redisClient() {
        return this.redis;
    }

    // Check if Redis is available
    isRedisAvailable() {
        return this.redisAvailable && this.redis !== null && this.redis !== undefined;
    }

    // User operations
    async createUser(userData) {
        if (!this.isRedisAvailable()) {
            throw new Error('Redis connection not available');
        }
        const userId = `user:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
        await this.redis.hset(userId, userData);
        await this.redis.sadd('users', userId);
        return userId;
    }

    async getUserByEmail(email) {
        if (!this.isRedisAvailable()) {
            throw new Error('Redis connection not available');
        }
        const users = await this.redis.smembers('users');
        for (const userId of users) {
            const user = await this.redis.hgetall(userId);
            if (user.email === email) {
                return { id: userId, ...user };
            }
        }
        return null;
    }

    async getUserById(userId) {
        if (!this.isRedisAvailable()) {
            throw new Error('Redis connection not available');
        }
        const user = await this.redis.hgetall(userId);
        if (Object.keys(user).length > 0) {
            return { id: userId, ...user };
        }
        return null;
    }

    async updateUser(userId, updates) {
        if (!this.isRedisAvailable()) {
            throw new Error('Redis connection not available');
        }
        await this.redis.hset(userId, updates);
        return true;
    }

    // Product operations
    async getProducts() {
        return [
            {
                id: 'boarding-pass-small',
                name: 'Small Boarding Pass Print',
                description: 'High-quality boarding pass print in small size (8.5" x 3.5")',
                price: 15.99,
                shipping: 5.99,
                size: 'Small (8.5" x 3.5")',
                image: '/images/boarding-pass-small.jpg'
            },
            {
                id: 'boarding-pass-medium',
                name: 'Medium Boarding Pass Print',
                description: 'High-quality boarding pass print in medium size (11" x 4.25")',
                price: 24.99,
                shipping: 7.99,
                size: 'Medium (11" x 4.25")',
                image: '/images/boarding-pass-medium.jpg'
            },
            {
                id: 'boarding-pass-large',
                name: 'Large Boarding Pass Print',
                description: 'High-quality boarding pass print in large size (16" x 6")',
                price: 34.99,
                shipping: 9.99,
                size: 'Large (16" x 6")',
                image: '/images/boarding-pass-large.jpg'
            }
        ];
    }

    async getProductById(productId) {
        const products = await this.getProducts();
        return products.find(p => p.id === productId);
    }

    // Order operations
    async createOrder(orderData) {
        const orderId = `order:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
        const order = {
            ...orderData,
            id: orderId,
            createdAt: new Date().toISOString(),
            status: 'pending'
        };
        await this.redis.hset(orderId, order);
        await this.redis.sadd('orders', orderId);
        await this.redis.sadd(`user:${orderData.userId}:orders`, orderId);
        return orderId;
    }

    async createGuestOrder(orderData) {
        const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const key = `order:${orderId}`;
        
        const order = {
            id: orderId,
            ...orderData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        await this.redis.hset(key, order);
        
        // Add to guest orders list if no user ID
        if (!orderData.userId) {
            await this.redis.sadd('guest_orders', orderId);
        }
        
        return orderId;
    }

    async getOrderById(orderId) {
        const key = `order:${orderId}`;
        const order = await this.redis.hgetall(key);
        
        if (Object.keys(order).length === 0) {
            return null;
        }
        
        // Parse JSON fields
        if (order.shippingAddress) {
            order.shippingAddress = JSON.parse(order.shippingAddress);
        }
        if (order.boardingPassDetails) {
            order.boardingPassDetails = JSON.parse(order.boardingPassDetails);
        }
        if (order.customizations) {
            order.customizations = JSON.parse(order.customizations);
        }
        
        return order;
    }

    async updateOrder(orderId, updates) {
        await this.redis.hset(orderId, updates);
        return true;
    }

    async getUserOrders(userId) {
        const orderIds = await this.redis.smembers(`user:${userId}:orders`);
        const orders = [];
        for (const orderId of orderIds) {
            const order = await this.getOrderById(orderId);
            if (order) orders.push(order);
        }
        return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    async getAllOrders() {
        const orderIds = await this.redis.smembers('orders');
        const orders = [];
        for (const orderId of orderIds) {
            const order = await this.getOrderById(orderId);
            if (order) orders.push(order);
        }
        return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    async getGuestOrders() {
        const orderIds = await this.redis.smembers('guest_orders');
        const orders = [];
        
        for (const orderId of orderIds) {
            const order = await this.getOrderById(orderId);
            if (order) {
                orders.push(order);
            }
        }
        
        return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Admin operations
    async getAdminStats() {
        const totalOrders = await this.redis.scard('orders');
        const totalUsers = await this.redis.scard('users');
        
        const orders = await this.getAllOrders();
        const totalRevenue = orders
            .filter(order => order.status === 'completed')
            .reduce((sum, order) => sum + parseFloat(order.totalAmount || 0), 0);

        const pendingOrders = orders.filter(order => order.status === 'pending').length;
        const completedOrders = orders.filter(order => order.status === 'completed').length;

        return {
            totalOrders,
            totalUsers,
            totalRevenue: totalRevenue.toFixed(2),
            pendingOrders,
            completedOrders
        };
    }

    // Admin-specific operations
    async getAllAdmins() {
        const users = await this.redis.smembers('users');
        const admins = [];
        
        for (const userId of users) {
            const user = await this.redis.hgetall(userId);
            if (user.role === 'admin') {
                // Parse permissions if stored as JSON string
                if (user.permissions && typeof user.permissions === 'string') {
                    try {
                        user.permissions = JSON.parse(user.permissions);
                    } catch (e) {
                        user.permissions = [];
                    }
                }
                
                // Don't return password
                delete user.password;
                admins.push({ id: userId, ...user });
            }
        }
        
        return admins;
    }

    async updateUserPermissions(userId, permissions) {
        await this.redis.hset(userId, 'permissions', JSON.stringify(permissions));
        return true;
    }

    async deactivateUser(userId) {
        await this.redis.hset(userId, 'isActive', 'false');
        return true;
    }

    async activateUser(userId) {
        await this.redis.hset(userId, 'isActive', 'true');
        return true;
    }

    async updateUserLastLogin(userId) {
        await this.redis.hset(userId, 'lastLogin', new Date().toISOString());
        return true;
    }

    // File upload tracking
    async saveUploadedFile(fileData) {
        const fileId = `file:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
        await this.redis.hset(fileId, fileData);
        await this.redis.sadd('uploaded_files', fileId);
        return fileId;
    }

    async getUploadedFile(fileId) {
        const file = await this.redis.hgetall(fileId);
        if (Object.keys(file).length > 0) {
            return { id: fileId, ...file };
        }
        return null;
    }
}

module.exports = new Database();
module.exports.Database = Database;
