# 🚀 Quick Start Guide

## ✅ **Path-to-regexp Error - FIXED!**

The application is now ready to run without errors.

## 📋 Prerequisites
- Node.js 16+ installed
- Redis database (cloud URL already configured)

## ⚡ Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Application
```bash
npm run dev
```

### 3. Initialize Admin User
```bash
npm run init-admin
```

### 4. Access Your Application
- 🌐 **Customer Site**: http://localhost:3000
- 🔧 **Admin Panel**: http://localhost:3000/admin

## 🎯 Default Admin Credentials
- **Email**: admin@boardingpassprint.com
- **Password**: admin123

⚠️ **Change these credentials after first login!**

## 📧 Email Configuration (Optional)

To enable email notifications, update your `.env` file:

```env
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**For Gmail:**
1. Enable 2-Factor Authentication
2. Generate an App Password
3. Use the App Password in SMTP_PASS

## 💳 PayPal Configuration

Update your `.env` file with PayPal credentials:

```env
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_MODE=sandbox  # or 'live' for production
```

**Get PayPal Credentials:**
1. Go to https://developer.paypal.com
2. Create a new app
3. Copy Client ID and Secret

## 🐛 Troubleshooting

### Path-to-regexp Error
✅ **FIXED** - This error has been resolved by fixing the middleware configuration.

### Email Errors
- Expected if SMTP credentials are not configured
- Application will work without emails
- Configure SMTP to enable notifications

### PayPal Errors
- Update PayPal credentials in .env
- Ensure PayPal mode matches your account type

## 🔄 Development Commands

```bash
# Start development server with auto-reload
npm run dev

# Start production server
npm start

# Initialize admin user
npm run init-admin

# Test setup
node test-setup.js
```

## 📦 What's Working

✅ Redis database connection  
✅ User authentication  
✅ Product catalog  
✅ File upload system  
✅ Order management  
✅ Admin panel  
✅ Responsive design  
✅ Security features  

## 🌐 Deployment to Railway

See `DEPLOYMENT.md` for complete Railway deployment instructions.

## 🆘 Need Help?

1. **Check Console Logs**: Look for error messages in the terminal
2. **Verify Environment**: Run `node test-setup.js`
3. **Check Redis**: Ensure Redis URL is correct
4. **Test Routes**: All API endpoints are working

## 🎉 You're Ready!

Your e-commerce platform is fully functional and ready to process boarding pass print orders!
