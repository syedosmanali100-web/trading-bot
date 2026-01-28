"""
Momentum feature engineering
"""
import pandas as pd
import numpy as np


class MomentumFeatures:
    """Calculate momentum-based features"""
    
    def __init__(self, rsi_period: int = 14, macd_fast: int = 12, 
                 macd_slow: int = 26, macd_signal: int = 9, roc_period: int = 10):
        self.rsi_period = rsi_period
        self.macd_fast = macd_fast
        self.macd_slow = macd_slow
        self.macd_signal = macd_signal
        self.roc_period = roc_period
    
    def calculate(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate all momentum features
        
        Args:
            df: DataFrame with OHLCV data
            
        Returns:
            DataFrame with momentum features added
        """
        df = df.copy()
        
        # RSI
        df['rsi'] = self._calculate_rsi(df['close'], self.rsi_period)
        
        # RSI slope
        df['rsi_slope'] = df['rsi'].diff(5)
        
        # RSI zones
        df['rsi_oversold'] = (df['rsi'] < 30).astype(int)
        df['rsi_overbought'] = (df['rsi'] > 70).astype(int)
        df['rsi_neutral'] = ((df['rsi'] >= 40) & (df['rsi'] <= 60)).astype(int)
        
        # MACD
        macd_data = self._calculate_macd(df['close'])
        df['macd'] = macd_data['macd']
        df['macd_signal'] = macd_data['signal']
        df['macd_histogram'] = macd_data['histogram']
        
        # MACD crossover
        df['macd_cross_above'] = (
            (df['macd'] > df['macd_signal']) & 
            (df['macd'].shift(1) <= df['macd_signal'].shift(1))
        ).astype(int)
        
        df['macd_cross_below'] = (
            (df['macd'] < df['macd_signal']) & 
            (df['macd'].shift(1) >= df['macd_signal'].shift(1))
        ).astype(int)
        
        # Rate of Change
        df['roc'] = df['close'].pct_change(self.roc_period)
        
        # Momentum (price change)
        df['momentum_5'] = df['close'] - df['close'].shift(5)
        df['momentum_10'] = df['close'] - df['close'].shift(10)
        df['momentum_20'] = df['close'] - df['close'].shift(20)
        
        # Momentum percentage
        df['momentum_5_pct'] = df['close'].pct_change(5)
        df['momentum_10_pct'] = df['close'].pct_change(10)
        df['momentum_20_pct'] = df['close'].pct_change(20)
        
        # Stochastic oscillator
        stoch = self._calculate_stochastic(df, period=14)
        df['stoch_k'] = stoch['k']
        df['stoch_d'] = stoch['d']
        
        return df
    
    def _calculate_rsi(self, prices: pd.Series, period: int = 14) -> pd.Series:
        """Calculate RSI indicator"""
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        
        return rsi
    
    def _calculate_macd(self, prices: pd.Series) -> dict:
        """Calculate MACD indicator"""
        ema_fast = prices.ewm(span=self.macd_fast, adjust=False).mean()
        ema_slow = prices.ewm(span=self.macd_slow, adjust=False).mean()
        
        macd = ema_fast - ema_slow
        signal = macd.ewm(span=self.macd_signal, adjust=False).mean()
        histogram = macd - signal
        
        return {
            'macd': macd,
            'signal': signal,
            'histogram': histogram
        }
    
    def _calculate_stochastic(self, df: pd.DataFrame, period: int = 14) -> dict:
        """Calculate Stochastic oscillator"""
        low_min = df['low'].rolling(window=period).min()
        high_max = df['high'].rolling(window=period).max()
        
        k = 100 * (df['close'] - low_min) / (high_max - low_min)
        d = k.rolling(window=3).mean()
        
        return {'k': k, 'd': d}
