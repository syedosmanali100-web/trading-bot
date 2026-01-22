@echo off
title Clean Restart - Nexus Trading Bot
color 0C

echo.
echo ================================================
echo    NEXUS TRADING BOT - CLEAN RESTART
echo ================================================
echo.
echo [INFO] This will stop any running servers and restart fresh
echo.
pause

echo.
echo [STEP 1] Killing all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo [STEP 2] Clearing Next.js cache...
if exist ".next" (
    rmdir /s /q ".next"
    echo [SUCCESS] Cache cleared!
) else (
    echo [INFO] No cache to clear
)

echo.
echo [STEP 3] Starting fresh server...
timeout /t 2 /nobreak >nul

call START_SERVER.bat
