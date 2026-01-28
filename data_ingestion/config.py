"""
Configuration for data ingestion system
"""
from datetime import datetime, timedelta

# Trading pairs to fetch
SYMBOLS = [
    'EURUSD',
    'GBPUSD',
    'USDJPY',
    'BTCUSD',
    'ETHUSD'
]

# Timeframes to fetch (in minutes)
TIMEFRAMES = {
    '1m': 1,
    '5m': 5,
    '15m': 15,
    '1h': 60,
    '4h': 240
}

# Data range (5 years of historical data)
END_DATE = datetime.utcnow()
START_DATE = END_DATE - timedelta(days=5*365)

# Data source configuration
DATA_SOURCE = 'yfinance'  # Using Yahoo Finance as reliable free source
BACKUP_SOURCE = 'alpha_vantage'  # Backup if primary fails

# Output configuration
OUTPUT_FORMAT = 'parquet'  # More efficient than CSV
OUTPUT_DIR = 'data'
LOG_DIR = 'logs'

# Data validation thresholds
MAX_MISSING_CANDLES_PERCENT = 1.0  # Max 1% missing data allowed
MAX_SPREAD_PERCENT = 5.0  # Max 5% spread allowed

# Required columns
REQUIRED_COLUMNS = ['timestamp', 'open', 'high', 'low', 'close', 'volume', 'symbol', 'timeframe']
