@echo off
echo ========================================
echo NEXUS TRADING BOT - SERVER START
echo ========================================
echo.
echo [1/2] Installing dependencies...
call npm install ws
echo.
echo [2/2] Starting server...
echo.
echo ========================================
echo SERVER STARTING AT: http://localhost:3000
echo ========================================
echo.
echo Login: admin@nexus.com / admin123
echo.
echo Press Ctrl+C to stop
echo ========================================
echo.
call npm run dev
