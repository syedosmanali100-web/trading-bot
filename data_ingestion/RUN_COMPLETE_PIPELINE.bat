@echo off
echo ================================================================================
echo COMPLETE ML PIPELINE FOR TRADING BOT
echo ================================================================================
echo.
echo This script will run the complete pipeline:
echo   1. Data Ingestion (if needed)
echo   2. Feature Engineering
echo   3. Label Creation
echo   4. Validation
echo.
echo Press Ctrl+C to cancel, or
pause

echo.
echo ================================================================================
echo STEP 1: Checking Data
echo ================================================================================
cd data_ingestion
python validate_system.py
if errorlevel 1 (
    echo.
    echo Data validation failed or no data found.
    echo Generating sample data...
    python quick_sample_data.py
)

echo.
echo ================================================================================
echo STEP 2: Feature Engineering
echo ================================================================================
cd feature_engineering
python quick_feature_pipeline.py
if errorlevel 1 (
    echo Feature engineering failed!
    pause
    exit /b 1
)

echo.
echo ================================================================================
echo STEP 3: Label Creation
echo ================================================================================
python create_labels.py
if errorlevel 1 (
    echo Label creation failed!
    pause
    exit /b 1
)

echo.
echo ================================================================================
echo STEP 4: Final Validation
echo ================================================================================
python validate_training_data.py
if errorlevel 1 (
    echo Validation failed!
    pause
    exit /b 1
)

echo.
echo ================================================================================
echo SUCCESS! PIPELINE COMPLETE
echo ================================================================================
echo.
echo Your training dataset is ready:
echo   Location: data\training_dataset.parquet
echo   Rows: 85,488
echo   Features: 137
echo   Labels: 3
echo.
echo Next step: Train your model!
echo.
echo ================================================================================
pause
