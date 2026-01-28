"""
Feature engineering configuration
"""

# Feature parameters
EMA_PERIODS = [20, 50, 200]
RSI_PERIOD = 14
MACD_FAST = 12
MACD_SLOW = 26
MACD_SIGNAL = 9
ATR_PERIOD = 14
ROLLING_STD_PERIOD = 20
ROC_PERIOD = 10

# Market structure lookback
STRUCTURE_LOOKBACK = 20

# Trading sessions (UTC hours)
SESSIONS = {
    'ASIA': (0, 9),      # Tokyo: 00:00-09:00 UTC
    'LONDON': (8, 16),   # London: 08:00-16:00 UTC
    'NY': (13, 22)       # New York: 13:00-22:00 UTC
}

# Candle pattern thresholds
PINBAR_WICK_RATIO = 2.0  # Wick must be 2x body
ENGULFING_MIN_RATIO = 1.0  # Engulfing body must be >= previous body

# Normalization method
NORMALIZATION = 'standard'  # 'standard', 'minmax', or 'robust'

# Output
OUTPUT_FILE = 'data/features.parquet'
