"""
Liquidity and smart money feature engineering
"""
import pandas as pd
import numpy as np


class LiquidityFeatures:
    """Calculate liquidity and smart money features"""
    
    def __init__(self, lookback: int = 20, threshold: float = 0.001):
        self.lookback = lookback
        self.threshold = threshold
    
    def calculate(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate all liquidity features
        
        Args:
            df: DataFrame with OHLCV data
            
        Returns:
            DataFrame with liquidity features added
        """
        df = df.copy()
        
        # Equal highs (liquidity pools)
        df['equal_highs'] = self._detect_equal_highs(df)
        
        # Equal lows (liquidity pools)
        df['equal_lows'] = self._detect_equal_lows(df)
        
        # Stop hunt detection
        df['stop_hunt_above'] = self._detect_stop_hunt_above(df)
        df['stop_hunt_below'] = self._detect_stop_hunt_below(df)
        
        # Liquidity sweep
        df['sweep_high'] = self._detect_sweep_high(df)
        df['sweep_low'] = self._detect_sweep_low(df)
        
        # Fair value gap (FVG)
        df['fvg_bullish'] = self._detect_fvg_bullish(df)
        df['fvg_bearish'] = self._detect_fvg_bearish(df)
        
        # Order block detection
        df['order_block_bullish'] = self._detect_order_block_bullish(df)
        df['order_block_bearish'] = self._detect_order_block_bearish(df)
        
        # Liquidity grab
        df['liquidity_grab'] = (df['stop_hunt_above'] | df['stop_hunt_below']).astype(int)
        
        # Volume analysis
        df['volume_spike'] = self._detect_volume_spike(df)
        df['volume_dry_up'] = self._detect_volume_dry_up(df)
        
        # Price rejection
        df['rejection_high'] = self._detect_rejection_high(df)
        df['rejection_low'] = self._detect_rejection_low(df)
        
        # Imbalance detection
        df['imbalance'] = self._detect_imbalance(df)
        
        return df
    
    def _detect_equal_highs(self, df: pd.DataFrame) -> pd.Series:
        """Detect equal highs (liquidity pools)"""
        equal_highs = pd.Series(0, index=df.index)
        
        for i in range(self.lookback, len(df)):
            recent_highs = df['high'].iloc[i-self.lookback:i]
            max_high = recent_highs.max()
            
            # Count how many highs are within threshold of max
            equal_count = ((recent_highs >= max_high * (1 - self.threshold)) & 
                          (recent_highs <= max_high * (1 + self.threshold))).sum()
            
            if equal_count >= 2:
                equal_highs.iloc[i] = 1
        
        return equal_highs
    
    def _detect_equal_lows(self, df: pd.DataFrame) -> pd.Series:
        """Detect equal lows (liquidity pools)"""
        equal_lows = pd.Series(0, index=df.index)
        
        for i in range(self.lookback, len(df)):
            recent_lows = df['low'].iloc[i-self.lookback:i]
            min_low = recent_lows.min()
            
            # Count how many lows are within threshold of min
            equal_count = ((recent_lows >= min_low * (1 - self.threshold)) & 
                          (recent_lows <= min_low * (1 + self.threshold))).sum()
            
            if equal_count >= 2:
                equal_lows.iloc[i] = 1
        
        return equal_lows
    
    def _detect_stop_hunt_above(self, df: pd.DataFrame) -> pd.Series:
        """Detect stop hunt above recent highs"""
        recent_high = df['high'].rolling(window=self.lookback).max()
        
        # Price spikes above recent high then closes below
        stop_hunt = (
            (df['high'] > recent_high.shift(1)) &
            (df['close'] < recent_high.shift(1))
        )
        
        return stop_hunt.astype(int)
    
    def _detect_stop_hunt_below(self, df: pd.DataFrame) -> pd.Series:
        """Detect stop hunt below recent lows"""
        recent_low = df['low'].rolling(window=self.lookback).min()
        
        # Price spikes below recent low then closes above
        stop_hunt = (
            (df['low'] < recent_low.shift(1)) &
            (df['close'] > recent_low.shift(1))
        )
        
        return stop_hunt.astype(int)
    
    def _detect_sweep_high(self, df: pd.DataFrame) -> pd.Series:
        """Detect sweep of previous high"""
        prev_high = df['high'].shift(1)
        
        return (
            (df['high'] > prev_high) &
            (df['close'] < df['open'])
        ).astype(int)
    
    def _detect_sweep_low(self, df: pd.DataFrame) -> pd.Series:
        """Detect sweep of previous low"""
        prev_low = df['low'].shift(1)
        
        return (
            (df['low'] < prev_low) &
            (df['close'] > df['open'])
        ).astype(int)
    
    def _detect_fvg_bullish(self, df: pd.DataFrame) -> pd.Series:
        """Detect bullish fair value gap"""
        # Gap between current low and 2 candles ago high
        gap = df['low'] - df['high'].shift(2)
        
        return (gap > 0).astype(int)
    
    def _detect_fvg_bearish(self, df: pd.DataFrame) -> pd.Series:
        """Detect bearish fair value gap"""
        # Gap between current high and 2 candles ago low
        gap = df['low'].shift(2) - df['high']
        
        return (gap > 0).astype(int)
    
    def _detect_order_block_bullish(self, df: pd.DataFrame) -> pd.Series:
        """Detect bullish order block (last down candle before rally)"""
        down_candle = df['close'] < df['open']
        next_up = df['close'].shift(-1) > df['close'].shift(-1).shift(1)
        strong_move = (df['close'].shift(-1) - df['close']) / df['close'] > 0.01
        
        return (down_candle & next_up & strong_move).astype(int)
    
    def _detect_order_block_bearish(self, df: pd.DataFrame) -> pd.Series:
        """Detect bearish order block (last up candle before drop)"""
        up_candle = df['close'] > df['open']
        next_down = df['close'].shift(-1) < df['close'].shift(-1).shift(1)
        strong_move = (df['close'] - df['close'].shift(-1)) / df['close'] > 0.01
        
        return (up_candle & next_down & strong_move).astype(int)
    
    def _detect_volume_spike(self, df: pd.DataFrame) -> pd.Series:
        """Detect volume spike"""
        avg_volume = df['volume'].rolling(window=20).mean()
        
        return (df['volume'] > avg_volume * 2).astype(int)
    
    def _detect_volume_dry_up(self, df: pd.DataFrame) -> pd.Series:
        """Detect volume dry up"""
        avg_volume = df['volume'].rolling(window=20).mean()
        
        return (df['volume'] < avg_volume * 0.5).astype(int)
    
    def _detect_rejection_high(self, df: pd.DataFrame) -> pd.Series:
        """Detect rejection from high (long upper wick)"""
        upper_wick = df['high'] - np.maximum(df['open'], df['close'])
        body_size = np.abs(df['close'] - df['open'])
        
        return (upper_wick > body_size * 2).astype(int)
    
    def _detect_rejection_low(self, df: pd.DataFrame) -> pd.Series:
        """Detect rejection from low (long lower wick)"""
        lower_wick = np.minimum(df['open'], df['close']) - df['low']
        body_size = np.abs(df['close'] - df['open'])
        
        return (lower_wick > body_size * 2).astype(int)
    
    def _detect_imbalance(self, df: pd.DataFrame) -> pd.Series:
        """Detect price imbalance (large gap between candles)"""
        gap = np.abs(df['open'] - df['close'].shift(1))
        avg_body = np.abs(df['close'] - df['open']).rolling(20).mean()
        
        return (gap > avg_body * 2).astype(int)
