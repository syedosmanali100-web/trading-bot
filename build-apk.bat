@echo off
echo ========================================
echo   NEXUS TRADING - APK BUILD SCRIPT
echo ========================================
echo.

echo Checking prerequisites...
where java >nul 2>nul
if errorlevel 1 (
    echo ERROR: Java JDK not found!
    echo Please install Java JDK 17 from: https://adoptium.net
    pause
    exit /b 1
)
echo ✓ Java JDK found
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

echo Step 2: Syncing with Capacitor...
call npx cap sync android
if errorlevel 1 (
    echo ERROR: Capacitor sync failed!
    pause
    exit /b 1
)
echo ✓ Capacitor synced!
echo.

echo Step 3: Opening Android Studio...
call npx cap open android
echo.

echo ========================================
echo   ANDROID STUDIO OPENED
echo ========================================
echo.
echo Next steps in Android Studio:
echo 1. Wait for Gradle sync to complete
echo 2. Click Build → Build Bundle(s) / APK(s) → Build APK(s)
echo 3. Wait for build to complete
echo 4. APK will be at: android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo To install on phone:
echo 1. Copy APK to phone
echo 2. Open file and click Install
echo 3. Allow "Install from unknown sources"
echo.
pause
