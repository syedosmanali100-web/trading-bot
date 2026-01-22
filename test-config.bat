@echo off
echo ================================
echo Testing Supabase Connection
echo ================================
echo.

echo Checking environment variables...
findstr "NEXT_PUBLIC_SUPABASE_URL" .env.local > nul
if %errorlevel% equ 0 (
    echo [OK] NEXT_PUBLIC_SUPABASE_URL found
) else (
    echo [ERROR] NEXT_PUBLIC_SUPABASE_URL missing in .env.local
    goto :error
)

findstr "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local > nul
if %errorlevel% equ 0 (
    echo [OK] NEXT_PUBLIC_SUPABASE_ANON_KEY found
) else (
    echo [ERROR] NEXT_PUBLIC_SUPABASE_ANON_KEY missing in .env.local
    goto :error
)

echo.
echo Checking for dummy configuration...
findstr "dummy" .env.local > nul
if %errorlevel% equ 0 (
    echo [WARNING] Dummy configuration detected!
    echo Please update .env.local with real Supabase credentials
    echo.
    echo Steps:
    echo 1. Go to https://supabase.com
    echo 2. Create a project
    echo 3. Copy URL and anon key from Settings ^> API
    echo 4. Update .env.local file
    goto :error
) else (
    echo [OK] No dummy configuration found
)

echo.
echo Checking required files...
if exist "app\admin\page.tsx" (
    echo [OK] Admin page exists
) else (
    echo [ERROR] Admin page missing
    goto :error
)

if exist "app\login\page.tsx" (
    echo [OK] Login page exists
) else (
    echo [ERROR] Login page missing
    goto :error
)

if exist "database\schema.sql" (
    echo [OK] Database schema exists
) else (
    echo [ERROR] Database schema missing
    goto :error
)

echo.
echo ================================
echo All checks passed!
echo ================================
echo.
echo Next steps:
echo 1. Make sure Supabase project is set up
echo 2. Run database/schema.sql in Supabase SQL Editor
echo 3. Start dev server: npm run dev
echo 4. Open http://localhost:3000/admin
echo.
pause
exit /b 0

:error
echo.
echo ================================
echo Configuration check FAILED!
echo ================================
echo.
echo Please follow the setup guide in database/README.md
echo.
pause
exit /b 1
