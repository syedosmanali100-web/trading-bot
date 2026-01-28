@echo off
echo ========================================
echo   NEXUS TRADING - DEPLOYMENT SCRIPT
echo ========================================
echo.

echo Step 1: Building Next.js app...
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)
echo ✓ Build successful!
echo.

echo Step 2: Committing changes to Git...
git add .
git commit -m "Deploy: Ready for production"
echo ✓ Changes committed!
echo.

echo Step 3: Pushing to GitHub...
git push
if errorlevel 1 (
    echo ERROR: Push failed! Make sure you have set up GitHub remote.
    echo Run: git remote add origin YOUR_GITHUB_REPO_URL
    pause
    exit /b 1
)
echo ✓ Pushed to GitHub!
echo.

echo ========================================
echo   DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo Next steps:
echo 1. Go to https://vercel.com
echo 2. Click "Add New Project"
echo 3. Import your GitHub repository
echo 4. Click "Deploy"
echo.
echo Your app will be live in 2-3 minutes!
echo.
pause
