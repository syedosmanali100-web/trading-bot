"""
Generate sample historical trading data for testing
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from pathlib import Path
import logging

from config import SYMBOLS, TIMEFRAMES, OUTPUT_DIR, OUTPUT_FORMAT
from storage import DataStorage

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def generate_realistic_ohlcv(base_price: float, num_candles: int, 
                             volatility: float = 0.02) -> pd.DataFrame:
    """
    Generate realistic OHLCV data using random walk
    
    Args:
        base_price: Starting price
        num_candles: Number of candles to generate
        volatility: Price volatility (default 2%)
        
    Returns:
        DataFrame with OHLCV data
    """
    np.random.seed(42)
    
    # Generate price movements using geometric Brownian motion
    returns = np.random.normal(0, volatility, num_candles)
    price_series = base_price * np.exp(np.cumsum(returns))
    
    data = []
    for i, close_price in enumerate(price_series):
        # Generate realistic OHLC from close price
        high_offset = abs(np.random.normal(0, volatility/2))
        low_offset = abs(np.random.normal(0, volatility/2))
        open_offset = np.random.normal(0, volatility/3)
        
        high = close_price * (1 + high_offset)
        low = close_price * (1 - low_offset)
        open_price = close_price * (1 + open_offset)
        
        # Ensure OHLC relationships are valid
        high = max(high, open_price, close_price)
        low = min(low, open_price, close_price)
        
        # Generate volume (higher volume on larger price moves)
        price_change = abs(close_price - open_price) / open_price
        base_volume = np.random.uniform(1000000, 5000000)
        volume = base_volume * (1 + price_change * 10)
        
        # Calculate spread
        spread = ((high - low) / close_price * 100)
        
        data.append({
            'open': round(open_price, 5),
            'high': round(high, 5),
            'low': round(low, 5),
            'close': round(close_price, 5),
            'volume': int(volume),
            'spread': round(spread, 4)
        })
    
    return pd.DataFrame(data)


def generate_sample_data_for_symbol(symbol: str, timeframe: str, 
                                   interval_minutes: int, years: int = 5):
    """Generate sample data for a symbol and timeframe"""
    
    # Base prices for different symbols
    base_prices = {
        'EURUSD': 1.1000,
        'GBPUSD': 1.3000,
        'USDJPY': 110.00,
        'BTCUSD': 40000.0,
        'ETHUSD': 2500.0
    }
    
    base_price = base_prices.get(symbol, 100.0)
    
    # Calculate number of candles
    total_minutes = years * 365 * 24 * 60
    num_candles = int(total_minutes / interval_minutes)
    
    logger.info(f"Generating {num_candles} candles for {symbol} {timeframe}")
    
    # Generate OHLCV data
    df = generate_realistic_ohlcv(base_price, num_candles)
    
    # Generate timestamps
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=years*365)
    timestamps = pd.date_range(start=start_date, end=end_date, 
                               periods=num_candles, tz='UTC')
    timestamps = timestamps.tz_localize(None)  # Remove timezone
    
    df['timestamp'] = timestamps
    df['symbol'] = symbol
    df['timeframe'] = timeframe
    
    # Reorder columns
    df = df[['timestamp', 'symbol', 'timeframe', 'open', 'high', 
            'low', 'close', 'volume', 'spread']]
    
    return df


def main():
    """Generate sample data for all symbols and timeframes"""
    logger.info("="*80)
    logger.info("GENERATING SAMPLE TRADING DATA")
    logger.info("="*80)
    
    storage = DataStorage(output_dir=OUTPUT_DIR, output_format=OUTPUT_FORMAT)
    
    total_tasks = len(SYMBOLS) * len(TIMEFRAMES)
    completed = 0
    
    for symbol in SYMBOLS:
        for timeframe, interval_minutes in TIMEFRAMES.items():
            completed += 1
            logger.info(f"\n[{completed}/{total_tasks}] Generating {symbol} {timeframe}")
            
            try:
                # Generate data
                df = generate_sample_data_for_symbol(symbol, timeframe, 
                                                    interval_minutes, years=5)
                
                # Save data
                filepath = storage.save_data(df, symbol, timeframe)
                
                # Preview
                logger.info(f"Generated {len(df)} rows")
                logger.info(f"Date range: {df['timestamp'].min()} to {df['timestamp'].max()}")
                logger.info(f"Price range: {df['close'].min():.5f} to {df['close'].max():.5f}")
                logger.info(f"Saved to: {filepath}")
                
            except Exception as e:
                logger.error(f"Failed to generate {symbol} {timeframe}: {str(e)}")
    
    # Summary
    logger.info("\n" + "="*80)
    logger.info("SAMPLE DATA GENERATION COMPLETED")
    logger.info("="*80)
    
    saved_files = storage.get_saved_files()
    logger.info(f"\nGenerated {len(saved_files)} files:")
    
    total_size = 0
    for file in saved_files:
        filepath = f"{OUTPUT_DIR}/{file}"
        info = storage.get_file_info(filepath)
        logger.info(f"  {file}: {info.get('rows', 0):,} rows, {info.get('size_mb', 0)} MB")
        total_size += info.get('size_mb', 0)
    
    logger.info(f"\nTotal size: {total_size:.2f} MB")
    logger.info("="*80)


if __name__ == '__main__':
    main()
