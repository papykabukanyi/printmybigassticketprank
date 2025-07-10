# Boarding Pass Print - E-commerce Platform

A modern e-commerce platform for printing large-format boarding passes with comprehensive admin functionality, PayPal integration, and order management.

## Features

### Customer Features
- **Product Catalog**: Choose from 3 different print sizes (Small, Medium, Large)
- **File Upload**: Upload boarding pass images with validation
- **Secure Payments**: PayPal integration with custom UI
- **Order Tracking**: Real-time order status and shipment tracking
- **User Authentication**: Secure registration and login system
- **Responsive Design**: Mobile-friendly interface

### Admin Features
- **Dashboard**: Overview of orders, revenue, and statistics
- **Order Management**: View, update, and track all orders
- **Status Updates**: Change order status with automatic email notifications
- **Email System**: Send custom emails to customers
- **Tracking Management**: Add tracking numbers and delivery estimates
- **User Management**: View customer information and order history

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: Redis (cloud-hosted)
- **Authentication**: JWT with bcrypt
- **Payment Processing**: PayPal REST API
- **Email Service**: Nodemailer with SMTP
- **File Upload**: Multer with local storage
- **Frontend**: Vanilla JavaScript, Bootstrap 5
- **Security**: Helmet, CORS, Rate limiting

## Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd printmybigassticketprank
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Initialize Admin User**
   ```bash
   npm run init-admin
   ```

5. **Access the Application**
   - Customer Site: http://localhost:3000
   - Admin Panel: http://localhost:3000/admin

## Environment Variables

```env
# Database
REDIS_URL=redis://default:password@host:port

# Server
PORT=3000
NODE_ENV=development
SESSION_SECRET=your-session-secret
JWT_SECRET=your-jwt-secret

# PayPal
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_MODE=sandbox

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com

# Admin
ADMIN_EMAIL=admin@yoursite.com
ADMIN_PASSWORD=admin123
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID

### Orders
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get specific order
- `GET /api/orders/:id/tracking` - Get order tracking

### Payment
- `POST /api/payment/create-payment` - Create PayPal payment
- `POST /api/payment/execute-payment` - Execute PayPal payment

### Admin (Requires Admin Role)
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/orders` - All orders with pagination
- `PUT /api/admin/orders/:id/status` - Update order status
- `PUT /api/admin/orders/:id/tracking` - Add tracking info

### File Upload
- `POST /api/upload/boarding-pass` - Upload boarding pass image

## Deployment

### Railway Deployment

1. **Create Railway Project**
   ```bash
   railway login
   railway init
   ```

2. **Set Environment Variables**
   ```bash
   railway variables set REDIS_URL=your-redis-url
   railway variables set PAYPAL_CLIENT_ID=your-paypal-id
   # ... set all required variables
   ```

3. **Deploy**
   ```bash
   railway up
   ```

### Manual Deployment

1. **Build and Start**
   ```bash
   npm install --production
   npm start
   ```

2. **Ensure Environment Variables are Set**
3. **Configure Reverse Proxy (Nginx)**
4. **Set up SSL Certificate**

## Project Structure

```
├── config/
│   └── database.js          # Redis configuration
├── middleware/
│   ├── auth.js              # Authentication middleware
│   └── admin.js             # Admin authorization
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── products.js          # Product routes
│   ├── orders.js            # Order routes
│   ├── admin.js             # Admin routes
│   ├── payment.js           # Payment routes
│   └── upload.js            # File upload routes
├── services/
│   └── emailService.js      # Email service
├── public/
│   ├── index.html           # Customer site
│   ├── admin.html           # Admin panel
│   └── js/
│       ├── app.js           # Customer JavaScript
│       └── admin.js         # Admin JavaScript
├── uploads/                 # Uploaded files
├── .env                     # Environment variables
├── server.js                # Main server file
└── package.json
```

## Security Features

- **Rate Limiting**: Prevents API abuse
- **CORS Protection**: Configured for specific origins
- **Helmet**: Security headers
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Express-validator for all inputs
- **File Upload Security**: Type and size validation
- **Admin Role Protection**: Admin routes require proper authorization

## Email Notifications

The system automatically sends emails for:
- Order confirmation
- Order status updates
- Tracking information
- Custom admin messages

## Order Workflow

1. **Customer Places Order**
   - Upload boarding pass image
   - Fill shipping information
   - Complete PayPal payment

2. **Admin Processes Order**
   - Update status to "processing"
   - Change to "printing" when production starts
   - Add tracking number and set to "shipped"
   - Mark as "delivered" when complete

3. **Automatic Notifications**
   - Customer receives email at each status change
   - Tracking information is provided when shipped

## Development

### Adding New Features

1. **Backend API**: Add routes in `/routes/` directory
2. **Database**: Use Redis client in `/config/database.js`
3. **Frontend**: Update HTML and JavaScript in `/public/`
4. **Email Templates**: Modify `/services/emailService.js`

### Testing

```bash
# Start development server with auto-reload
npm run dev

# Test PayPal integration in sandbox mode
# Test email functionality with real SMTP credentials
# Test file uploads with various image formats
```

## Support

For support and questions:
- Check the documentation in this README
- Review the API endpoints and examples
- Ensure all environment variables are properly configured
- Verify Redis connection and PayPal credentials

## License

ISC License - see LICENSE file for details.
