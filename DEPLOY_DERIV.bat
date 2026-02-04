@echo off
echo.
echo ========================================
echo   DERIV INTEGRATION - AUTO DEPLOY
echo ========================================
echo.

cd /d "%~dp0"

REM Check if we're in the right directory
if not exist "app" (
    echo [ERROR] app folder not found!
    echo Please run this script from project root directory
    pause
    exit /b 1
)

echo [1/4] Creating backup of current page.tsx...
if exist "app\page.tsx" (
    copy "app\page.tsx" "app\page_backup_old.tsx" >nul 2>&1
    echo     ✅ Backup created: app\page_backup_old.tsx
) else (
    echo     ⚠ No existing page.tsx found (this is OK for new setup)
)

echo.
echo [2/4] Looking for updated page.tsx...
if exist "page.tsx" (
    echo     ✅ Found page.tsx in current directory
) else (
    echo     [ERROR] page.tsx not found!
    echo     Please download it first from Claude
    pause
    exit /b 1
)

echo.
echo [3/4] Copying updated page.tsx to app folder...
copy "page.tsx" "app\page.tsx" /Y >nul
if errorlevel 1 (
    echo     [ERROR] Failed to copy file
    pause
    exit /b 1
)
echo     ✅ File copied successfully!

echo.
echo [4/4] Verifying installation...
if exist "app\page.tsx" (
    echo     ✅ app\page.tsx exists
) else (
    echo     [ERROR] Verification failed!
    pause
    exit /b 1
)

if exist "components\deriv\DerivAccountCard.tsx" (
    echo     ✅ Deriv components found
) else (
    echo     ⚠ Deriv components not found
    echo     Components should be at: components\deriv\
)

echo.
echo ========================================
echo   ✅ INSTALLATION COMPLETE!
echo ========================================
echo.
echo Next steps:
echo   1. Run: npm run dev
echo   2. Open: http://localhost:3000
echo   3. Test with regular user (should work as before)
echo   4. Test with Deriv user (new features appear)
echo.
echo ========================================
pause
