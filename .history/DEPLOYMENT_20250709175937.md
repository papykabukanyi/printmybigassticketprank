# Railway Deployment Guide

This guide will help you deploy your Boarding Pass Print e-commerce application to Railway.

## Prerequisites

1. Railway account (https://railway.app)
2. Railway CLI installed
3. GitHub repository (optional but recommended)

## Quick Deployment Steps

### 1. Install Railway CLI
```bash
npm install -g @railway/cli
```

### 2. Login to Railway
```bash
railway login
```

### 3. Initialize Railway Project
```bash
railway init
```

### 4. Set Environment Variables
```bash
# Database (your Redis URL is already configured)
railway variables set REDIS_URL=redis://default:wipIKRLferhupCxLZxNOirxKzzXFFNTU@centerbeam.proxy.rlwy.net:36797

# Server Configuration
railway variables set NODE_ENV=production
railway variables set SESSION_SECRET=your-super-secure-session-secret-for-production
railway variables set JWT_SECRET=your-super-secure-jwt-secret-for-production
railway variables set JWT_EXPIRES_IN=7d

# PayPal Configuration (Replace with your actual PayPal credentials)
railway variables set PAYPAL_CLIENT_ID=your-paypal-client-id
railway variables set PAYPAL_CLIENT_SECRET=your-paypal-client-secret
railway variables set PAYPAL_MODE=sandbox  # Change to 'live' for production

# SMTP Configuration (Replace with your actual email credentials)
railway variables set SMTP_HOST=smtp.gmail.com
railway variables set SMTP_PORT=587
railway variables set SMTP_USER=your-email@gmail.com
railway variables set SMTP_PASS=your-app-password
railway variables set EMAIL_FROM=your-email@gmail.com

# Admin Configuration
railway variables set ADMIN_EMAIL=admin@yoursite.com
railway variables set ADMIN_PASSWORD=your-secure-admin-password
```

### 5. Deploy the Application
```bash
railway up
```

### 6. Get Your Deployment URL
```bash
railway domain
```

### 7. Initialize Admin User (Post-Deployment)
After deployment, you'll need to create the admin user. You can do this by:

1. SSH into your Railway deployment:
   ```bash
   railway shell
   ```

2. Run the admin initialization:
   ```bash
   node scripts/init-admin.js
   ```

Or create a one-time deployment script that runs this automatically.

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `REDIS_URL` | Redis database connection string | `redis://user:pass@host:port` |
| `NODE_ENV` | Environment mode | `production` |
| `SESSION_SECRET` | Session encryption secret | `your-random-secret` |
| `JWT_SECRET` | JWT token secret | `your-jwt-secret` |
| `PAYPAL_CLIENT_ID` | PayPal application client ID | `your-paypal-id` |
| `PAYPAL_CLIENT_SECRET` | PayPal application secret | `your-paypal-secret` |
| `PAYPAL_MODE` | PayPal mode | `sandbox` or `live` |
| `SMTP_HOST` | Email server host | `smtp.gmail.com` |
| `SMTP_PORT` | Email server port | `587` |
| `SMTP_USER` | Email username | `your-email@gmail.com` |
| `SMTP_PASS` | Email password/app password | `your-app-password` |
| `EMAIL_FROM` | From email address | `your-email@gmail.com` |
| `ADMIN_EMAIL` | Admin user email | `admin@yoursite.com` |
| `ADMIN_PASSWORD` | Admin user password | `secure-password` |

## Post-Deployment Configuration

### 1. PayPal Setup
1. Go to https://developer.paypal.com
2. Create a new application
3. Get your Client ID and Secret
4. Update the environment variables in Railway
5. Configure webhook URLs for payment notifications

### 2. Email Setup
1. If using Gmail, enable 2FA and create an App Password
2. For other providers, get SMTP credentials
3. Test email functionality after deployment

### 3. Domain Configuration
1. Add custom domain in Railway dashboard
2. Update CORS settings if needed
3. Configure SSL certificate (Railway handles this automatically)

### 4. Database Backup
1. Your Redis database is already cloud-hosted
2. Consider setting up regular backups
3. Monitor database performance and usage

## Railway-Specific Files

Railway will automatically:
- Detect the Node.js application
- Install dependencies using `npm install`
- Run the application using `npm start`
- Handle port configuration automatically

## Monitoring and Logs

```bash
# View application logs
railway logs

# Monitor application
railway status

# Connect to application shell
railway shell
```

## Troubleshooting

### Common Issues

1. **Environment Variables Not Set**
   ```bash
   railway variables
   ```

2. **Database Connection Issues**
   - Verify REDIS_URL is correct
   - Check Redis service status

3. **PayPal Integration Issues**
   - Verify PayPal credentials
   - Check webhook configurations
   - Ensure HTTPS is enabled

4. **Email Not Working**
   - Verify SMTP credentials
   - Check firewall settings
   - Test with a simple SMTP client

### Support

- Railway Documentation: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- PayPal Developer Docs: https://developer.paypal.com/docs

## Security Checklist for Production

- [ ] Changed all default passwords
- [ ] Updated JWT secrets
- [ ] Configured CORS properly
- [ ] Enabled rate limiting
- [ ] Set up HTTPS
- [ ] Configured proper logging
- [ ] Set up monitoring alerts
- [ ] Regular security updates

## Scaling Considerations

1. **Database**: Monitor Redis memory usage
2. **File Storage**: Consider cloud storage for uploads
3. **Email**: Consider email service providers for high volume
4. **CDN**: Add CDN for static assets
5. **Monitoring**: Set up application monitoring

Your application should now be live and accessible via the Railway-provided URL!
