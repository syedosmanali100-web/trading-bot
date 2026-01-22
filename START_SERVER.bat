@echo off
title Nexus Trading Bot Server
color 0A

echo.
echo ================================================
echo    NEXUS TRADING BOT - FAST START
echo ================================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo [ERROR] Dependencies not installed!
    echo Installing dependencies now...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERROR] Failed to install dependencies!
        echo Please check your internet connection.
        pause
        exit /b 1
    )
    echo.
    echo [SUCCESS] Dependencies installed!
    echo.
)

echo [INFO] Starting server in TURBO mode...
echo.
echo ================================================
echo    Server will open at: http://localhost:3001
echo ================================================
echo.
echo [WAIT] Server is starting... Please wait...
echo.

REM Kill any process using port 3001
echo [INFO] Checking for existing processes on port 3001...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do (
    echo [INFO] Killing process %%a...
    taskkill /F /PID %%a >nul 2>&1
)

REM Wait a moment for port to be released
timeout /t 2 /nobreak >nul

REM Start the server
echo [INFO] Starting Next.js server...
start /B npm run dev

REM Wait for server to start
echo [INFO] Waiting for server to initialize...
timeout /t 5 /nobreak >nul

REM Try to open browser
echo [INFO] Opening browser...
start http://localhost:3001

echo.
echo ================================================
echo    SERVER IS RUNNING!
echo ================================================
echo.
echo Main Dashboard: http://localhost:3001
echo Login Page:     http://localhost:3001/login
echo Admin Panel:    http://localhost:3001/admin
echo.
echo [TIP] Keep this window open while using the app
echo [TIP] Press Ctrl+C to stop the server
echo [TIP] If port 3001 is busy, server will use 3000
echo.
echo ================================================
echo.

REM Keep showing server logs
npm run dev

pause
