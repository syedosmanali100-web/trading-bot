"""
Volatility feature engineering
"""
import pandas as pd
import numpy as np


class VolatilityFeatures:
    """Calculate volatility-based features"""
    
    def __init__(self, atr_period: int = 14, std_period: int = 20):
        self.atr_period = atr_period
        self.std_period = std_period
    
    def calculate(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate all volatility features
        
        Args:
            df: DataFrame with OHLCV data
            
        Returns:
            DataFrame with volatility features added
        """
        df = df.copy()
        
        # ATR (Average True Range)
        df['atr'] = self._calculate_atr(df, self.atr_period)
        
        # ATR as percentage of price
        df['atr_pct'] = df['atr'] / df['close']
        
        # ATR slope (volatility trend)
        df['atr_slope'] = df['atr'].pct_change(5)
        
        # Candle range
        df['candle_range'] = df['high'] - df['low']
        df['candle_range_pct'] = df['candle_range'] / df['close']
        
        # Rolling standard deviation
        df['std_dev'] = df['close'].rolling(window=self.std_period).std()
        df['std_dev_pct'] = df['std_dev'] / df['close']
        
        # Bollinger Bands
        bb = self._calculate_bollinger_bands(df['close'], self.std_period)
        df['bb_upper'] = bb['upper']
        df['bb_middle'] = bb['middle']
        df['bb_lower'] = bb['lower']
        df['bb_width'] = (bb['upper'] - bb['lower']) / bb['middle']
        df['bb_position'] = (df['close'] - bb['lower']) / (bb['upper'] - bb['lower'])
        
        # Price distance from Bollinger Bands
        df['bb_upper_distance'] = (bb['upper'] - df['close']) / df['close']
        df['bb_lower_distance'] = (df['close'] - bb['lower']) / df['close']
        
        # Volatility regime (high/low)
        df['volatility_regime'] = (df['atr_pct'] > df['atr_pct'].rolling(50).mean()).astype(int)
        
        # True Range
        df['true_range'] = self._calculate_true_range(df)
        
        # Historical volatility (annualized)
        df['hist_volatility'] = df['close'].pct_change().rolling(20).std() * np.sqrt(252)
        
        # Parkinson volatility (high-low range based)
        df['parkinson_volatility'] = np.sqrt(
            (1 / (4 * np.log(2))) * 
            np.log(df['high'] / df['low']) ** 2
        ).rolling(20).mean()
        
        return df
    
    def _calculate_atr(self, df: pd.DataFrame, period: int) -> pd.Series:
        """Calculate Average True Range"""
        tr = self._calculate_true_range(df)
        atr = tr.rolling(window=period).mean()
        return atr
    
    def _calculate_true_range(self, df: pd.DataFrame) -> pd.Series:
        """Calculate True Range"""
        high_low = df['high'] - df['low']
        high_close = np.abs(df['high'] - df['close'].shift())
        low_close = np.abs(df['low'] - df['close'].shift())
        
        tr = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
        return tr
    
    def _calculate_bollinger_bands(self, prices: pd.Series, period: int, 
                                   num_std: float = 2.0) -> dict:
        """Calculate Bollinger Bands"""
        middle = prices.rolling(window=period).mean()
        std = prices.rolling(window=period).std()
        
        upper = middle + (std * num_std)
        lower = middle - (std * num_std)
        
        return {
            'upper': upper,
            'middle': middle,
            'lower': lower
        }
