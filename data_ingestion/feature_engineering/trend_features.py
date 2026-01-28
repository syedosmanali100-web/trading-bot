"""
Trend feature engineering
"""
import pandas as pd
import numpy as np
from typing import List


class TrendFeatures:
    """Calculate trend-based features"""
    
    def __init__(self, ema_periods: List[int] = [20, 50, 200]):
        self.ema_periods = ema_periods
    
    def calculate(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate all trend features
        
        Args:
            df: DataFrame with OHLCV data
            
        Returns:
            DataFrame with trend features added
        """
        df = df.copy()
        
        # Calculate EMAs
        for period in self.ema_periods:
            df[f'ema_{period}'] = df['close'].ewm(span=period, adjust=False).mean()
        
        # EMA slopes (rate of change)
        for period in self.ema_periods:
            df[f'ema_{period}_slope'] = df[f'ema_{period}'].pct_change(5)
        
        # EMA distances (price relative to EMA)
        for period in self.ema_periods:
            df[f'ema_{period}_distance'] = (df['close'] - df[f'ema_{period}']) / df[f'ema_{period}']
        
        # EMA crossovers
        df['ema_20_50_cross'] = (df['ema_20'] > df['ema_50']).astype(int)
        df['ema_50_200_cross'] = (df['ema_50'] > df['ema_200']).astype(int)
        
        # Price position relative to EMAs
        df['price_above_ema_20'] = (df['close'] > df['ema_20']).astype(int)
        df['price_above_ema_50'] = (df['close'] > df['ema_50']).astype(int)
        df['price_above_ema_200'] = (df['close'] > df['ema_200']).astype(int)
        
        # Trend strength (all EMAs aligned)
        df['ema_alignment'] = (
            (df['ema_20'] > df['ema_50']) & 
            (df['ema_50'] > df['ema_200'])
        ).astype(int)
        
        # Trend direction score (-1 to 1)
        df['trend_score'] = (
            df['price_above_ema_20'] + 
            df['price_above_ema_50'] + 
            df['price_above_ema_200'] +
            df['ema_20_50_cross'] +
            df['ema_50_200_cross']
        ) / 5 - 0.5
        
        return df
    
    def calculate_htf_trend(self, df: pd.DataFrame, htf_df: pd.DataFrame) -> pd.DataFrame:
        """
        Add higher timeframe trend direction
        
        Args:
            df: Lower timeframe DataFrame
            htf_df: Higher timeframe DataFrame with trend features
            
        Returns:
            DataFrame with HTF trend added
        """
        df = df.copy()
        
        # Merge HTF trend score
        if 'trend_score' in htf_df.columns:
            htf_trend = htf_df[['timestamp', 'trend_score']].copy()
            htf_trend.columns = ['timestamp', 'htf_trend_score']
            
            # Forward fill HTF values to match LTF timestamps
            df = pd.merge_asof(
                df.sort_values('timestamp'),
                htf_trend.sort_values('timestamp'),
                on='timestamp',
                direction='backward'
            )
        
        return df
