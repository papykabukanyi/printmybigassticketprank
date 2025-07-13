# Boarding Pass Print - E-commerce Platform

A modern e-commerce platform for printing large-format boarding passes with comprehensive admin functionality.

## 🚀 Quick Start (Local Development)

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

## 🌐 Deployment

### Railway Deployment
1. Connect your GitHub repo to Railway
2. Set environment variables in Railway dashboard (see `.env.example`)
3. Deploy automatically

**Important:** Railway does NOT read `.env` files. All environment variables must be set in the Railway dashboard.

### Environment Variables
See `.env.example` for all required environment variables. Copy each variable from your local `.env` to your deployment platform's dashboard.

## 🔧 Development Scripts

```bash
npm run dev              # Start development server
npm run start            # Start production server
npm run railway-setup    # Show variables for Railway deployment
npm run troubleshoot     # Diagnose deployment issues
npm run check-env        # Verify environment setup
```

## 📋 Features

### Customer Features
- Product catalog with multiple print sizes
- Secure file upload for boarding pass images
- PayPal payment integration
- Order tracking and status updates
- User authentication and registration

### Admin Features
- Comprehensive admin dashboard
- Order management and fulfillment
- Email notification system
- User management
- Revenue and analytics overview

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: Redis
- **Authentication**: JWT with bcrypt
- **Payment**: PayPal REST API
- **Email**: Nodemailer with SMTP
- **Frontend**: Vanilla JavaScript, Bootstrap 5
- **Deployment**: Railway

## 📁 Project Structure

```
├── config/          # Database and configuration
├── middleware/      # Authentication and authorization
├── routes/          # API endpoints
├── services/        # Email and external services
├── public/          # Static frontend files
├── scripts/         # Utility and deployment scripts
└── uploads/         # File upload directory
```

## 🔒 Security

- Environment variables are protected in `.gitignore`
- No hardcoded credentials in repository
- JWT-based authentication
- Secure session management
- Rate limiting and CORS protection

## 📞 Support

For deployment issues, run:
```bash
npm run troubleshoot
```

For Railway deployment help:
```bash
npm run railway-setup
```

## 📄 License

ISC License - See LICENSE file for details.
