"""
Data processor module - handles cleaning, validation, and transformation
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging
from typing import Tuple, Dict

logger = logging.getLogger(__name__)


class DataProcessor:
    """Processes and validates trading data"""
    
    def __init__(self, max_missing_percent: float = 1.0):
        self.max_missing_percent = max_missing_percent
    
    def process_data(self, df: pd.DataFrame, symbol: str, timeframe: str, 
                    interval_minutes: int) -> Tuple[pd.DataFrame, Dict]:
        """
        Process raw data: clean, validate, fill gaps
        
        Args:
            df: Raw DataFrame
            symbol: Trading symbol
            timeframe: Timeframe string (1m, 5m, etc)
            interval_minutes: Interval in minutes
            
        Returns:
            Tuple of (processed DataFrame, statistics dict)
        """
        stats = {
            'symbol': symbol,
            'timeframe': timeframe,
            'raw_rows': len(df),
            'duplicates_removed': 0,
            'missing_candles_filled': 0,
            'invalid_rows_removed': 0,
            'final_rows': 0,
            'date_range': '',
            'data_quality': 'UNKNOWN'
        }
        
        try:
            # 1. Remove duplicates
            df_clean = self._remove_duplicates(df)
            stats['duplicates_removed'] = len(df) - len(df_clean)
            
            # 2. Validate and clean data
            df_clean = self._validate_data(df_clean)
            stats['invalid_rows_removed'] = len(df) - stats['duplicates_removed'] - len(df_clean)
            
            # 3. Sort by timestamp
            df_clean = df_clean.sort_values('timestamp').reset_index(drop=True)
            
            # 4. Convert timestamp to UTC
            df_clean = self._ensure_utc_timestamp(df_clean)
            
            # 5. Fill missing candles
            df_clean, filled_count = self._fill_missing_candles(df_clean, interval_minutes)
            stats['missing_candles_filled'] = filled_count
            
            # 6. Add metadata columns
            df_clean['symbol'] = symbol
            df_clean['timeframe'] = timeframe
            
            # 7. Reorder columns
            df_clean = df_clean[['timestamp', 'symbol', 'timeframe', 'open', 'high', 
                                'low', 'close', 'volume', 'spread']]
            
            # 8. Calculate statistics
            stats['final_rows'] = len(df_clean)
            if len(df_clean) > 0:
                stats['date_range'] = f"{df_clean['timestamp'].min()} to {df_clean['timestamp'].max()}"
                
                # Calculate data quality
                missing_percent = (stats['missing_candles_filled'] / stats['final_rows']) * 100
                if missing_percent < self.max_missing_percent:
                    stats['data_quality'] = 'EXCELLENT'
                elif missing_percent < 5:
                    stats['data_quality'] = 'GOOD'
                elif missing_percent < 10:
                    stats['data_quality'] = 'FAIR'
                else:
                    stats['data_quality'] = 'POOR'
            
            logger.info(f"Processed {symbol} {timeframe}: {stats['final_rows']} rows, "
                       f"Quality: {stats['data_quality']}")
            
            return df_clean, stats
            
        except Exception as e:
            logger.error(f"Error processing data: {str(e)}")
            return pd.DataFrame(), stats
    
    def _remove_duplicates(self, df: pd.DataFrame) -> pd.DataFrame:
        """Remove duplicate timestamps"""
        return df.drop_duplicates(subset=['timestamp'], keep='first')
    
    def _validate_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Validate OHLCV data integrity"""
        # Remove rows with null values in critical columns
        df = df.dropna(subset=['open', 'high', 'low', 'close'])
        
        # Remove rows where high < low (invalid)
        df = df[df['high'] >= df['low']]
        
        # Remove rows where close/open outside high/low range
        df = df[(df['close'] <= df['high']) & (df['close'] >= df['low'])]
        df = df[(df['open'] <= df['high']) & (df['open'] >= df['low'])]
        
        # Remove rows with zero or negative prices
        df = df[(df['open'] > 0) & (df['high'] > 0) & (df['low'] > 0) & (df['close'] > 0)]
        
        # Fill missing volume with 0
        df['volume'] = df['volume'].fillna(0)
        
        return df
    
    def _ensure_utc_timestamp(self, df: pd.DataFrame) -> pd.DataFrame:
        """Ensure timestamp is in UTC"""
        if not pd.api.types.is_datetime64_any_dtype(df['timestamp']):
            df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        # Convert to UTC if timezone-aware
        if df['timestamp'].dt.tz is not None:
            df['timestamp'] = df['timestamp'].dt.tz_convert('UTC')
        else:
            df['timestamp'] = df['timestamp'].dt.tz_localize('UTC')
        
        # Remove timezone info for consistency
        df['timestamp'] = df['timestamp'].dt.tz_localize(None)
        
        return df
    
    def _fill_missing_candles(self, df: pd.DataFrame, 
                             interval_minutes: int) -> Tuple[pd.DataFrame, int]:
        """Fill missing candles with forward-filled data"""
        if len(df) < 2:
            return df, 0
        
        # Create complete time range
        start_time = df['timestamp'].min()
        end_time = df['timestamp'].max()
        
        # Generate expected timestamps
        expected_timestamps = pd.date_range(
            start=start_time,
            end=end_time,
            freq=f'{interval_minutes}min'
        )
        
        # Create complete dataframe
        complete_df = pd.DataFrame({'timestamp': expected_timestamps})
        
        # Merge with actual data
        merged_df = complete_df.merge(df, on='timestamp', how='left')
        
        # Count missing candles before filling
        missing_count = merged_df['close'].isna().sum()
        
        # Forward fill missing values
        merged_df['open'] = merged_df['open'].fillna(method='ffill')
        merged_df['high'] = merged_df['high'].fillna(method='ffill')
        merged_df['low'] = merged_df['low'].fillna(method='ffill')
        merged_df['close'] = merged_df['close'].fillna(method='ffill')
        merged_df['volume'] = merged_df['volume'].fillna(0)
        merged_df['spread'] = merged_df['spread'].fillna(method='ffill')
        
        # Drop any remaining NaN rows (at the beginning)
        merged_df = merged_df.dropna(subset=['close'])
        
        return merged_df, missing_count
    
    def resample_to_4h(self, df: pd.DataFrame) -> pd.DataFrame:
        """Resample 1h data to 4h timeframe"""
        if len(df) == 0:
            return df
        
        df = df.set_index('timestamp')
        
        # Resample to 4h
        resampled = df.resample('4h').agg({
            'open': 'first',
            'high': 'max',
            'low': 'min',
            'close': 'last',
            'volume': 'sum',
            'spread': 'mean'
        })
        
        resampled = resampled.dropna().reset_index()
        
        return resampled
