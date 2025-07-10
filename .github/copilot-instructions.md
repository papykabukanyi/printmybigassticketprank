# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is an e-commerce web application for printing large-format boarding passes built with Node.js, Express, Redis, and PayPal integration.

## Tech Stack
- **Backend**: Node.js with Express.js
- **Database**: Redis (cloud-hosted)
- **Payment Processing**: PayPal
- **File Upload**: Multer with local storage
- **Email**: Nodemailer with SMTP
- **Authentication**: JWT with bcrypt
- **Frontend**: Vanilla JavaScript with Bootstrap 5

## Key Features
- Customer-facing e-commerce site for ordering boarding pass prints
- Admin panel for order management
- PayPal payment integration
- Email notifications (order confirmation, status updates)
- File upload for boarding pass images
- Order tracking and shipment management
- Responsive design

## Project Structure
- `/routes/` - API endpoints (auth, products, orders, admin, payment, upload)
- `/middleware/` - Authentication and authorization middleware
- `/config/` - Database configuration
- `/services/` - Email service
- `/public/` - Static frontend files (HTML, CSS, JavaScript)
- `/uploads/` - Uploaded boarding pass images

## Environment Variables
The application uses Redis cloud database and requires proper environment configuration for PayPal and SMTP.

## Development Notes
- All routes use proper error handling and validation
- Admin routes require authentication and admin role
- File uploads are validated for type and size
- Payment flow uses PayPal sandbox for development
- Redis is used for all data storage (users, orders, products, files)

When working on this project:
1. Follow the existing API patterns and error handling
2. Maintain security best practices for authentication
3. Use the existing Bootstrap/JavaScript frontend patterns
4. Ensure all database operations use the Redis client properly
5. Validate all user inputs on both frontend and backend
