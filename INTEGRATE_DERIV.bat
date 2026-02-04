@echo off
echo.
echo ========================================
echo   DERIV INTEGRATION - AUTO UPDATER
echo ========================================
echo.
echo Checking dependencies...
echo.

REM Check if recharts is installed
call npm list recharts >nul 2>&1
if errorlevel 1 (
    echo [!] recharts not found. Installing...
    call npm install recharts
    if errorlevel 1 (
        echo [ERROR] Failed to install recharts
        pause
        exit /b 1
    )
    echo [OK] recharts installed successfully
) else (
    echo [OK] recharts already installed
)

echo.
echo ========================================
echo   INTEGRATION STATUS
echo ========================================
echo.
echo [OK] DerivAccountCard.tsx created
echo [OK] DerivTradingPanel.tsx created  
echo [OK] DerivPriceChart.tsx created
echo [OK] API balance route exists
echo.
echo ========================================
echo   MANUAL STEPS REQUIRED
echo ========================================
echo.
echo Please update app/page.tsx manually:
echo.
echo 1. Add imports:
echo    import DerivAccountCard from "@/components/deriv/DerivAccountCard"
echo    import DerivTradingPanel from "@/components/deriv/DerivTradingPanel"
echo    import DerivPriceChart from "@/components/deriv/DerivPriceChart"
echo.
echo 2. Add isDeriv state:
echo    const [isDeriv, setIsDeriv] = useState(false)
echo.
echo 3. Update authentication useEffect to set isDeriv
echo.
echo 4. Hide profile button for Deriv users
echo.
echo 5. Add Deriv components after Connection Status card
echo.
echo 6. Add Deriv Trading tab (3rd tab)
echo.
echo See DERIV_FINAL_STEPS.md for detailed instructions
echo.
echo ========================================
echo.
pause
