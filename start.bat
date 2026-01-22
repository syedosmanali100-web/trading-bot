@echo off
echo ========================================
echo   NEXUS TRADING BOT - Quick Start
echo ========================================
echo.
echo Checking if dependencies are installed...
echo.

if not exist "node_modules" (
    echo Dependencies not found. Installing...
    echo.
    call pnpm install
    echo.
    echo Dependencies installed successfully!
    echo.
) else (
    echo Dependencies already installed.
    echo.
)

echo Starting development server...
echo.
echo ========================================
echo   Server URLs:
echo ========================================
echo   Main Dashboard: http://localhost:3000
echo   Login Page:     http://localhost:3000/login
echo   Admin Panel:    http://localhost:3000/admin
echo ========================================
echo.
echo Press Ctrl+C to stop the server
echo.

call pnpm dev
