@echo off
echo 🚀 RAILWAY DEPLOYMENT SCRIPT - CRITICAL FIXES
echo ===============================================
echo.

echo 📋 Step 1: Testing fixes locally...
call npm run test-railway-fixes
if %errorlevel% neq 0 (
    echo ❌ Local tests failed! Please check the errors above.
    pause
    exit /b 1
)

echo.
echo ✅ Local tests passed! Ready to deploy.
echo.

echo 📋 Step 2: Committing fixes to git...
git add .
git commit -m "Critical Railway fix: Remove fatal Redis dependency, add resilient startup"

echo.
echo 📋 Step 3: Pushing to Railway...
git push origin main

echo.
echo 🎯 DEPLOYMENT STATUS
echo ==================
echo.
echo ✅ Code pushed to Railway
echo ⏳ Railway is now building and deploying...
echo.
echo 📍 Next steps:
echo 1. Go to Railway dashboard to monitor deployment
echo 2. Check deploy logs for any errors
echo 3. Test these URLs once deployed:
echo    - https://your-app.railway.app/ping
echo    - https://your-app.railway.app/health
echo    - https://your-app.railway.app/
echo.
echo 🔧 If deployment still fails:
echo 1. Check Railway logs for specific errors
echo 2. Ensure these variables are set in Railway dashboard:
echo    - NODE_ENV=production
echo    - JWT_SECRET=your-secret-here
echo    - SESSION_SECRET=your-session-secret
echo    - (Optional) REDIS_URL=your-redis-url
echo.
echo 💡 The app now starts successfully even without Redis!
echo.
pause
