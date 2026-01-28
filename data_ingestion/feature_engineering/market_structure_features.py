"""
Market structure feature engineering
"""
import pandas as pd
import numpy as np


class MarketStructureFeatures:
    """Calculate market structure features"""
    
    def __init__(self, lookback: int = 20):
        self.lookback = lookback
    
    def calculate(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate all market structure features
        
        Args:
            df: DataFrame with OHLCV data
            
        Returns:
            DataFrame with market structure features added
        """
        df = df.copy()
        
        # Higher highs and higher lows
        df['higher_high'] = self._detect_higher_high(df)
        df['higher_low'] = self._detect_higher_low(df)
        
        # Lower highs and lower lows
        df['lower_high'] = self._detect_lower_high(df)
        df['lower_low'] = self._detect_lower_low(df)
        
        # Uptrend (HH and HL)
        df['uptrend_structure'] = (df['higher_high'] & df['higher_low']).astype(int)
        
        # Downtrend (LH and LL)
        df['downtrend_structure'] = (df['lower_high'] & df['lower_low']).astype(int)
        
        # Break of structure
        df['bos_bullish'] = self._detect_bos_bullish(df)
        df['bos_bearish'] = self._detect_bos_bearish(df)
        
        # Swing highs and lows
        df['swing_high'] = self._detect_swing_high(df, window=5)
        df['swing_low'] = self._detect_swing_low(df, window=5)
        
        # Distance to recent swing points
        df['distance_to_swing_high'] = self._distance_to_last_swing_high(df)
        df['distance_to_swing_low'] = self._distance_to_last_swing_low(df)
        
        # Trend strength score
        df['trend_strength'] = self._calculate_trend_strength(df)
        
        # Support and resistance levels
        df['near_resistance'] = self._near_resistance(df)
        df['near_support'] = self._near_support(df)
        
        # Price action patterns
        df['consolidation'] = self._detect_consolidation(df)
        df['breakout'] = self._detect_breakout(df)
        
        return df
    
    def _detect_higher_high(self, df: pd.DataFrame) -> pd.Series:
        """Detect higher highs"""
        rolling_max = df['high'].rolling(window=self.lookback).max()
        return (df['high'] > rolling_max.shift(1)).astype(int)
    
    def _detect_higher_low(self, df: pd.DataFrame) -> pd.Series:
        """Detect higher lows"""
        rolling_min = df['low'].rolling(window=self.lookback).min()
        return (df['low'] > rolling_min.shift(1)).astype(int)
    
    def _detect_lower_high(self, df: pd.DataFrame) -> pd.Series:
        """Detect lower highs"""
        rolling_max = df['high'].rolling(window=self.lookback).max()
        return (df['high'] < rolling_max.shift(1)).astype(int)
    
    def _detect_lower_low(self, df: pd.DataFrame) -> pd.Series:
        """Detect lower lows"""
        rolling_min = df['low'].rolling(window=self.lookback).min()
        return (df['low'] < rolling_min.shift(1)).astype(int)
    
    def _detect_bos_bullish(self, df: pd.DataFrame) -> pd.Series:
        """Detect bullish break of structure"""
        recent_high = df['high'].rolling(window=self.lookback).max()
        return (df['close'] > recent_high.shift(1)).astype(int)
    
    def _detect_bos_bearish(self, df: pd.DataFrame) -> pd.Series:
        """Detect bearish break of structure"""
        recent_low = df['low'].rolling(window=self.lookback).min()
        return (df['close'] < recent_low.shift(1)).astype(int)
    
    def _detect_swing_high(self, df: pd.DataFrame, window: int = 5) -> pd.Series:
        """Detect swing highs"""
        swing_high = pd.Series(0, index=df.index)
        
        for i in range(window, len(df) - window):
            if df['high'].iloc[i] == df['high'].iloc[i-window:i+window+1].max():
                swing_high.iloc[i] = 1
        
        return swing_high
    
    def _detect_swing_low(self, df: pd.DataFrame, window: int = 5) -> pd.Series:
        """Detect swing lows"""
        swing_low = pd.Series(0, index=df.index)
        
        for i in range(window, len(df) - window):
            if df['low'].iloc[i] == df['low'].iloc[i-window:i+window+1].min():
                swing_low.iloc[i] = 1
        
        return swing_low
    
    def _distance_to_last_swing_high(self, df: pd.DataFrame) -> pd.Series:
        """Calculate distance to last swing high"""
        if 'swing_high' not in df.columns:
            return pd.Series(0, index=df.index)
        
        last_swing_high = df[df['swing_high'] == 1]['high'].reindex(df.index).fillna(method='ffill')
        return (df['close'] - last_swing_high) / df['close']
    
    def _distance_to_last_swing_low(self, df: pd.DataFrame) -> pd.Series:
        """Calculate distance to last swing low"""
        if 'swing_low' not in df.columns:
            return pd.Series(0, index=df.index)
        
        last_swing_low = df[df['swing_low'] == 1]['low'].reindex(df.index).fillna(method='ffill')
        return (df['close'] - last_swing_low) / df['close']
    
    def _calculate_trend_strength(self, df: pd.DataFrame) -> pd.Series:
        """Calculate trend strength score"""
        # Based on consecutive higher highs/lows or lower highs/lows
        uptrend_score = (
            df['higher_high'].rolling(5).sum() + 
            df['higher_low'].rolling(5).sum()
        ) / 10
        
        downtrend_score = (
            df['lower_high'].rolling(5).sum() + 
            df['lower_low'].rolling(5).sum()
        ) / 10
        
        return uptrend_score - downtrend_score
    
    def _near_resistance(self, df: pd.DataFrame, threshold: float = 0.01) -> pd.Series:
        """Detect if price is near resistance"""
        recent_high = df['high'].rolling(window=self.lookback).max()
        distance = (recent_high - df['close']) / df['close']
        return (distance < threshold).astype(int)
    
    def _near_support(self, df: pd.DataFrame, threshold: float = 0.01) -> pd.Series:
        """Detect if price is near support"""
        recent_low = df['low'].rolling(window=self.lookback).min()
        distance = (df['close'] - recent_low) / df['close']
        return (distance < threshold).astype(int)
    
    def _detect_consolidation(self, df: pd.DataFrame) -> pd.Series:
        """Detect consolidation (low volatility)"""
        range_pct = (df['high'] - df['low']) / df['close']
        avg_range = range_pct.rolling(20).mean()
        return (range_pct < avg_range * 0.5).astype(int)
    
    def _detect_breakout(self, df: pd.DataFrame) -> pd.Series:
        """Detect breakout (high volatility after consolidation)"""
        range_pct = (df['high'] - df['low']) / df['close']
        avg_range = range_pct.rolling(20).mean()
        return (range_pct > avg_range * 1.5).astype(int)
