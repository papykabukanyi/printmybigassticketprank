@echo off
echo.
echo ====================================
echo 🚀 BOARDING PASS PRINT - QUICK START
echo ====================================
echo.

REM Check if .env exists
if not exist .env (
    echo ❌ .env file not found!
    echo.
    echo 📋 SETUP STEPS:
    echo 1. Copy .env.example to .env
    echo 2. Get PayPal sandbox credentials from https://developer.paypal.com/
    echo 3. Fill in PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in .env
    echo 4. Optionally set up email SMTP for notifications
    echo.
    echo 💡 TIP: App will work without email, but you need PayPal for payments
    echo.
    pause
    exit /b 1
)

echo ✅ .env file found
echo.

REM Check if node_modules exists
if not exist node_modules (
    echo 📦 Installing dependencies...
    npm install
    echo.
)

echo 🔧 Configuration Status:
echo.

REM Check PayPal config
findstr /i "PAYPAL_CLIENT_ID=" .env | findstr /v "your_paypal_sandbox_client_id_here" >nul
if %errorlevel% equ 0 (
    echo ✅ PayPal: Configured
) else (
    echo ❌ PayPal: NOT CONFIGURED - Payments won't work
    echo    Get credentials from https://developer.paypal.com/
)

REM Check email config
findstr /i "SMTP_USER=" .env | findstr /v "your-email@gmail.com" >nul
if %errorlevel% equ 0 (
    echo ✅ Email: Configured
) else (
    echo ⚠️  Email: Not configured - App will work without email notifications
)

echo.
echo 🎯 WHAT YOU CAN TEST:
echo.
echo 👤 Admin Panel:
echo    URL: http://localhost:3000/admin
echo    Email: admin@boardingpassprint.com  
echo    Password: SecureAdmin2025!
echo.
echo 🛒 Customer Features:
echo    • User registration/login
echo    • Guest checkout (no account needed)
echo    • Print customization with live preview
echo    • PayPal payment flow
echo    • Order tracking
echo.
echo 🚀 Starting development server...
echo    Press Ctrl+C to stop
echo.

npm start
