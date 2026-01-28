"""
Quick sample data generator - generates 1 year of data for faster testing
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from pathlib import Path
import logging

from config import OUTPUT_DIR, OUTPUT_FORMAT
from storage import DataStorage

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Reduced set for quick generation
QUICK_SYMBOLS = ['BTCUSD', 'ETHUSD', 'EURUSD']
QUICK_TIMEFRAMES = {'15m': 15, '1h': 60, '4h': 240}
YEARS = 1  # Only 1 year for quick generation


def generate_realistic_ohlcv(base_price: float, num_candles: int, 
                             volatility: float = 0.02) -> pd.DataFrame:
    """Generate realistic OHLCV data"""
    np.random.seed(42)
    
    returns = np.random.normal(0, volatility, num_candles)
    price_series = base_price * np.exp(np.cumsum(returns))
    
    data = []
    for close_price in price_series:
        high_offset = abs(np.random.normal(0, volatility/2))
        low_offset = abs(np.random.normal(0, volatility/2))
        open_offset = np.random.normal(0, volatility/3)
        
        high = close_price * (1 + high_offset)
        low = close_price * (1 - low_offset)
        open_price = close_price * (1 + open_offset)
        
        high = max(high, open_price, close_price)
        low = min(low, open_price, close_price)
        
        price_change = abs(close_price - open_price) / open_price
        base_volume = np.random.uniform(1000000, 5000000)
        volume = base_volume * (1 + price_change * 10)
        
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


def main():
    """Generate quick sample data"""
    logger.info("="*80)
    logger.info("GENERATING QUICK SAMPLE DATA (1 YEAR)")
    logger.info("="*80)
    
    storage = DataStorage(output_dir=OUTPUT_DIR, output_format=OUTPUT_FORMAT)
    
    base_prices = {
        'EURUSD': 1.1000,
        'BTCUSD': 40000.0,
        'ETHUSD': 2500.0
    }
    
    total_tasks = len(QUICK_SYMBOLS) * len(QUICK_TIMEFRAMES)
    completed = 0
    
    for symbol in QUICK_SYMBOLS:
        for timeframe, interval_minutes in QUICK_TIMEFRAMES.items():
            completed += 1
            logger.info(f"\n[{completed}/{total_tasks}] Generating {symbol} {timeframe}")
            
            try:
                # Calculate candles
                total_minutes = YEARS * 365 * 24 * 60
                num_candles = int(total_minutes / interval_minutes)
                
                logger.info(f"Generating {num_candles:,} candles...")
                
                # Generate OHLCV
                df = generate_realistic_ohlcv(base_prices[symbol], num_candles)
                
                # Generate timestamps
                end_date = datetime.now()
                start_date = end_date - timedelta(days=YEARS*365)
                timestamps = pd.date_range(start=start_date, end=end_date, 
                                         periods=num_candles)
                
                df['timestamp'] = timestamps
                df['symbol'] = symbol
                df['timeframe'] = timeframe
                
                # Reorder columns
                df = df[['timestamp', 'symbol', 'timeframe', 'open', 'high', 
                        'low', 'close', 'volume', 'spread']]
                
                # Save
                filepath = storage.save_data(df, symbol, timeframe)
                
                logger.info(f"✓ Saved {len(df):,} rows to {filepath}")
                logger.info(f"  Date: {df['timestamp'].min()} to {df['timestamp'].max()}")
                logger.info(f"  Price: ${df['close'].min():.2f} to ${df['close'].max():.2f}")
                
            except Exception as e:
                logger.error(f"✗ Failed: {str(e)}")
    
    # Summary
    logger.info("\n" + "="*80)
    logger.info("QUICK SAMPLE DATA GENERATION COMPLETED")
    logger.info("="*80)
    
    saved_files = storage.get_saved_files()
    logger.info(f"\nGenerated {len(saved_files)} files in data/ folder:\n")
    
    total_rows = 0
    total_size = 0
    
    for file in saved_files:
        filepath = f"{OUTPUT_DIR}/{file}"
        info = storage.get_file_info(filepath)
        rows = info.get('rows', 0)
        size = info.get('size_mb', 0)
        logger.info(f"  ✓ {file:<25} {rows:>10,} rows  {size:>6.2f} MB")
        total_rows += rows
        total_size += size
    
    logger.info(f"\n  TOTAL: {total_rows:,} rows, {total_size:.2f} MB")
    logger.info("\n" + "="*80)
    logger.info("Ready for bot training!")
    logger.info("="*80)


if __name__ == '__main__':
    main()
