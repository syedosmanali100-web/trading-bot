"""
Time-based feature engineering
"""
import pandas as pd
import numpy as np
from typing import Dict, Tuple


class TimeFeatures:
    """Calculate time-based features"""
    
    def __init__(self, sessions: Dict[str, Tuple[int, int]] = None):
        self.sessions = sessions or {
            'ASIA': (0, 9),
            'LONDON': (8, 16),
            'NY': (13, 22)
        }
    
    def calculate(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate all time features
        
        Args:
            df: DataFrame with OHLCV data and timestamp
            
        Returns:
            DataFrame with time features added
        """
        df = df.copy()
        
        # Ensure timestamp is datetime
        if not pd.api.types.is_datetime64_any_dtype(df['timestamp']):
            df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        # Extract time components
        df['hour'] = df['timestamp'].dt.hour
        df['day_of_week'] = df['timestamp'].dt.dayofweek  # 0=Monday, 6=Sunday
        df['day_of_month'] = df['timestamp'].dt.day
        df['month'] = df['timestamp'].dt.month
        df['quarter'] = df['timestamp'].dt.quarter
        
        # Cyclical encoding for hour (24-hour cycle)
        df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24)
        df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24)
        
        # Cyclical encoding for day of week (7-day cycle)
        df['day_sin'] = np.sin(2 * np.pi * df['day_of_week'] / 7)
        df['day_cos'] = np.cos(2 * np.pi * df['day_of_week'] / 7)
        
        # Cyclical encoding for month (12-month cycle)
        df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
        df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
        
        # Trading sessions
        df['session_asia'] = self._in_session(df['hour'], *self.sessions['ASIA'])
        df['session_london'] = self._in_session(df['hour'], *self.sessions['LONDON'])
        df['session_ny'] = self._in_session(df['hour'], *self.sessions['NY'])
        
        # Session overlaps
        df['overlap_london_ny'] = (df['session_london'] & df['session_ny']).astype(int)
        df['overlap_asia_london'] = (df['session_asia'] & df['session_london']).astype(int)
        
        # Weekend flag
        df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
        
        # Start/end of week
        df['start_of_week'] = (df['day_of_week'] == 0).astype(int)
        df['end_of_week'] = (df['day_of_week'] == 4).astype(int)
        
        # Start/end of month
        df['start_of_month'] = (df['day_of_month'] <= 5).astype(int)
        df['end_of_month'] = (df['day_of_month'] >= 25).astype(int)
        
        # Market open/close hours
        df['market_open'] = (df['hour'] == 0).astype(int)  # Daily open
        df['market_close'] = (df['hour'] == 23).astype(int)  # Daily close
        
        # High activity periods
        df['high_activity'] = (
            df['overlap_london_ny'] | 
            ((df['hour'] >= 8) & (df['hour'] <= 10)) |  # London open
            ((df['hour'] >= 13) & (df['hour'] <= 15))   # NY open
        ).astype(int)
        
        # Low activity periods
        df['low_activity'] = (
            ((df['hour'] >= 22) | (df['hour'] <= 1)) |  # Asian night
            df['is_weekend']
        ).astype(int)
        
        return df
    
    def _in_session(self, hour: pd.Series, start: int, end: int) -> pd.Series:
        """Check if hour is within session"""
        if start < end:
            return ((hour >= start) & (hour < end)).astype(int)
        else:  # Session crosses midnight
            return ((hour >= start) | (hour < end)).astype(int)
