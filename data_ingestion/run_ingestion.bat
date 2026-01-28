@echo off
echo ========================================
echo Trading Bot Data Ingestion Pipeline
echo ========================================
echo.

echo Installing dependencies...
pip install -r requirements.txt
echo.

echo Starting data ingestion...
python ingestion_pipeline.py
echo.

echo ========================================
echo Ingestion Complete!
echo Check data/ folder for output files
echo Check logs/ folder for detailed logs
echo ========================================
pause
