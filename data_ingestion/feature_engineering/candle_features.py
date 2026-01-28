"""
Candle pattern feature engineering
"""
import pandas as pd
import numpy as np


class CandleFeatures:
    """Calculate candle pattern features"""
    
    def __init__(self, pinbar_wick_ratio: float = 2.0, engulfing_min_ratio: float = 1.0):
        self.pinbar_wick_ratio = pinbar_wick_ratio
        self.engulfing_min_ratio = engulfing_min_ratio
    
    def calculate(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate all candle features
        
        Args:
            df: DataFrame with OHLCV data
            
        Returns:
            DataFrame with candle features added
        """
        df = df.copy()
        
        # Basic candle components
        df['body_size'] = np.abs(df['close'] - df['open'])
        df['upper_wick'] = df['high'] - np.maximum(df['open'], df['close'])
        df['lower_wick'] = np.minimum(df['open'], df['close']) - df['low']
        df['total_range'] = df['high'] - df['low']
        
        # Ratios
        df['body_range_ratio'] = df['body_size'] / (df['total_range'] + 1e-10)
        df['upper_wick_ratio'] = df['upper_wick'] / (df['total_range'] + 1e-10)
        df['lower_wick_ratio'] = df['lower_wick'] / (df['total_range'] + 1e-10)
        
        # Candle direction
        df['bullish_candle'] = (df['close'] > df['open']).astype(int)
        df['bearish_candle'] = (df['close'] < df['open']).astype(int)
        df['doji'] = (df['body_size'] < df['total_range'] * 0.1).astype(int)
        
        # Candle patterns
        df['hammer'] = self._detect_hammer(df)
        df['shooting_star'] = self._detect_shooting_star(df)
        df['bullish_engulfing'] = self._detect_bullish_engulfing(df)
        df['bearish_engulfing'] = self._detect_bearish_engulfing(df)
        df['pinbar_bullish'] = self._detect_pinbar_bullish(df)
        df['pinbar_bearish'] = self._detect_pinbar_bearish(df)
        df['inside_bar'] = self._detect_inside_bar(df)
        df['outside_bar'] = self._detect_outside_bar(df)
        
        # Candle strength
        df['candle_strength'] = df['body_size'] / df['body_size'].rolling(20).mean()
        
        # Consecutive candles
        df['consecutive_bullish'] = self._count_consecutive_bullish(df)
        df['consecutive_bearish'] = self._count_consecutive_bearish(df)
        
        # Gap detection
        df['gap_up'] = (df['low'] > df['high'].shift(1)).astype(int)
        df['gap_down'] = (df['high'] < df['low'].shift(1)).astype(int)
        
        # Wick dominance
        df['upper_wick_dominant'] = (df['upper_wick'] > df['body_size'] * 2).astype(int)
        df['lower_wick_dominant'] = (df['lower_wick'] > df['body_size'] * 2).astype(int)
        
        return df
    
    def _detect_hammer(self, df: pd.DataFrame) -> pd.Series:
        """Detect hammer pattern (bullish reversal)"""
        return (
            (df['lower_wick'] > df['body_size'] * 2) &
            (df['upper_wick'] < df['body_size'] * 0.5) &
            (df['close'] > df['open'])
        ).astype(int)
    
    def _detect_shooting_star(self, df: pd.DataFrame) -> pd.Series:
        """Detect shooting star pattern (bearish reversal)"""
        return (
            (df['upper_wick'] > df['body_size'] * 2) &
            (df['lower_wick'] < df['body_size'] * 0.5) &
            (df['close'] < df['open'])
        ).astype(int)
    
    def _detect_bullish_engulfing(self, df: pd.DataFrame) -> pd.Series:
        """Detect bullish engulfing pattern"""
        prev_bearish = df['close'].shift(1) < df['open'].shift(1)
        curr_bullish = df['close'] > df['open']
        engulfs = (
            (df['open'] < df['close'].shift(1)) &
            (df['close'] > df['open'].shift(1))
        )
        body_larger = df['body_size'] >= df['body_size'].shift(1) * self.engulfing_min_ratio
        
        return (prev_bearish & curr_bullish & engulfs & body_larger).astype(int)
    
    def _detect_bearish_engulfing(self, df: pd.DataFrame) -> pd.Series:
        """Detect bearish engulfing pattern"""
        prev_bullish = df['close'].shift(1) > df['open'].shift(1)
        curr_bearish = df['close'] < df['open']
        engulfs = (
            (df['open'] > df['close'].shift(1)) &
            (df['close'] < df['open'].shift(1))
        )
        body_larger = df['body_size'] >= df['body_size'].shift(1) * self.engulfing_min_ratio
        
        return (prev_bullish & curr_bearish & engulfs & body_larger).astype(int)
    
    def _detect_pinbar_bullish(self, df: pd.DataFrame) -> pd.Series:
        """Detect bullish pinbar (long lower wick)"""
        return (
            (df['lower_wick'] > df['body_size'] * self.pinbar_wick_ratio) &
            (df['lower_wick'] > df['upper_wick'] * 2) &
            (df['body_range_ratio'] < 0.3)
        ).astype(int)
    
    def _detect_pinbar_bearish(self, df: pd.DataFrame) -> pd.Series:
        """Detect bearish pinbar (long upper wick)"""
        return (
            (df['upper_wick'] > df['body_size'] * self.pinbar_wick_ratio) &
            (df['upper_wick'] > df['lower_wick'] * 2) &
            (df['body_range_ratio'] < 0.3)
        ).astype(int)
    
    def _detect_inside_bar(self, df: pd.DataFrame) -> pd.Series:
        """Detect inside bar (consolidation)"""
        return (
            (df['high'] < df['high'].shift(1)) &
            (df['low'] > df['low'].shift(1))
        ).astype(int)
    
    def _detect_outside_bar(self, df: pd.DataFrame) -> pd.Series:
        """Detect outside bar (volatility expansion)"""
        return (
            (df['high'] > df['high'].shift(1)) &
            (df['low'] < df['low'].shift(1))
        ).astype(int)
    
    def _count_consecutive_bullish(self, df: pd.DataFrame) -> pd.Series:
        """Count consecutive bullish candles"""
        bullish = (df['close'] > df['open']).astype(int)
        consecutive = bullish * (bullish.groupby((bullish != bullish.shift()).cumsum()).cumcount() + 1)
        return consecutive
    
    def _count_consecutive_bearish(self, df: pd.DataFrame) -> pd.Series:
        """Count consecutive bearish candles"""
        bearish = (df['close'] < df['open']).astype(int)
        consecutive = bearish * (bearish.groupby((bearish != bearish.shift()).cumsum()).cumcount() + 1)
        return consecutive
