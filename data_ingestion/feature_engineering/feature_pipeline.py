"""
Main feature engineering pipeline
"""
import pandas as pd
import numpy as np
from pathlib import Path
import logging
from typing import List, Dict
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler

from config import *
from trend_features import TrendFeatures
from momentum_features import MomentumFeatures
from volatility_features import VolatilityFeatures
from market_structure_features import MarketStructureFeatures
from candle_features import CandleFeatures
from time_features import TimeFeatures
from liquidity_features import LiquidityFeatures

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class FeatureEngineeringPipeline:
    """Main pipeline for feature engineering"""
    
    def __init__(self):
        self.trend_features = TrendFeatures(ema_periods=EMA_PERIODS)
        self.momentum_features = MomentumFeatures(
            rsi_period=RSI_PERIOD,
            macd_fast=MACD_FAST,
            macd_slow=MACD_SLOW,
            macd_signal=MACD_SIGNAL,
            roc_period=ROC_PERIOD
        )
        self.volatility_features = VolatilityFeatures(
            atr_period=ATR_PERIOD,
            std_period=ROLLING_STD_PERIOD
        )
        self.market_structure_features = MarketStructureFeatures(
            lookback=STRUCTURE_LOOKBACK
        )
        self.candle_features = CandleFeatures(
            pinbar_wick_ratio=PINBAR_WICK_RATIO,
            engulfing_min_ratio=ENGULFING_MIN_RATIO
        )
        self.time_features = TimeFeatures(sessions=SESSIONS)
        self.liquidity_features = LiquidityFeatures(
            lookback=STRUCTURE_LOOKBACK
        )
        
        self.scaler = None
        self.feature_columns = []
    
    def load_data(self, data_dir: str = 'data') -> Dict[str, pd.DataFrame]:
        """
        Load all data files from directory
        
        Args:
            data_dir: Directory containing parquet files
            
        Returns:
            Dictionary of {filename: DataFrame}
        """
        logger.info("Loading data files...")
        data_path = Path(data_dir)
        
        if not data_path.exists():
            raise FileNotFoundError(f"Data directory not found: {data_dir}")
        
        data_files = {}
        parquet_files = list(data_path.glob('*.parquet'))
        
        # Filter out preprocessed files
        parquet_files = [f for f in parquet_files if not any(
            x in f.name for x in ['train', 'val', 'test', 'features']
        )]
        
        logger.info(f"Found {len(parquet_files)} data files")
        
        for file in parquet_files:
            try:
                df = pd.read_parquet(file)
                data_files[file.stem] = df
                logger.info(f"  ✓ Loaded {file.name}: {len(df):,} rows")
            except Exception as e:
                logger.error(f"  ✗ Failed to load {file.name}: {str(e)}")
        
        return data_files
    
    def engineer_features(self, df: pd.DataFrame, symbol: str, 
                         timeframe: str, htf_df: pd.DataFrame = None) -> pd.DataFrame:
        """
        Apply all feature engineering to a DataFrame
        
        Args:
            df: Input DataFrame with OHLCV data
            symbol: Trading symbol
            timeframe: Timeframe string
            htf_df: Higher timeframe DataFrame for HTF features
            
        Returns:
            DataFrame with all features
        """
        logger.info(f"Engineering features for {symbol} {timeframe}...")
        
        df = df.copy()
        initial_rows = len(df)
        
        # A. Trend Features
        logger.info("  [1/7] Calculating trend features...")
        df = self.trend_features.calculate(df)
        
        # Add HTF trend if available
        if htf_df is not None:
            df = self.trend_features.calculate_htf_trend(df, htf_df)
        
        # B. Momentum Features
        logger.info("  [2/7] Calculating momentum features...")
        df = self.momentum_features.calculate(df)
        
        # C. Volatility Features
        logger.info("  [3/7] Calculating volatility features...")
        df = self.volatility_features.calculate(df)
        
        # D. Market Structure Features
        logger.info("  [4/7] Calculating market structure features...")
        df = self.market_structure_features.calculate(df)
        
        # E. Candle Features
        logger.info("  [5/7] Calculating candle features...")
        df = self.candle_features.calculate(df)
        
        # F. Time Features
        logger.info("  [6/7] Calculating time features...")
        df = self.time_features.calculate(df)
        
        # G. Liquidity Features
        logger.info("  [7/7] Calculating liquidity features...")
        df = self.liquidity_features.calculate(df)
        
        # Clean data
        df = df.replace([np.inf, -np.inf], np.nan)
        df = df.dropna()
        
        final_rows = len(df)
        logger.info(f"  ✓ Features calculated: {initial_rows:,} → {final_rows:,} rows "
                   f"({len(df.columns)} columns)")
        
        return df
    
    def normalize_features(self, df: pd.DataFrame, fit: bool = True) -> pd.DataFrame:
        """
        Normalize numeric features
        
        Args:
            df: DataFrame with features
            fit: Whether to fit scaler (True for training data)
            
        Returns:
            DataFrame with normalized features
        """
        logger.info("Normalizing features...")
        
        df = df.copy()
        
        # Identify numeric columns to normalize (exclude metadata and binary flags)
        exclude_cols = ['timestamp', 'symbol', 'timeframe']
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        cols_to_normalize = [col for col in numeric_cols if col not in exclude_cols]
        
        # Initialize scaler
        if fit or self.scaler is None:
            if NORMALIZATION == 'standard':
                self.scaler = StandardScaler()
            elif NORMALIZATION == 'minmax':
                self.scaler = MinMaxScaler()
            elif NORMALIZATION == 'robust':
                self.scaler = RobustScaler()
            else:
                raise ValueError(f"Unknown normalization method: {NORMALIZATION}")
            
            df[cols_to_normalize] = self.scaler.fit_transform(df[cols_to_normalize])
            logger.info(f"  ✓ Fitted {NORMALIZATION} scaler on {len(cols_to_normalize)} features")
        else:
            df[cols_to_normalize] = self.scaler.transform(df[cols_to_normalize])
            logger.info(f"  ✓ Transformed {len(cols_to_normalize)} features")
        
        return df
    
    def drop_raw_ohlcv(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Drop raw OHLCV columns, keep only features
        
        Args:
            df: DataFrame with features
            
        Returns:
            DataFrame without raw OHLCV
        """
        cols_to_drop = ['open', 'high', 'low', 'close', 'volume']
        existing_cols = [col for col in cols_to_drop if col in df.columns]
        
        if existing_cols:
            df = df.drop(columns=existing_cols)
            logger.info(f"  ✓ Dropped raw OHLCV columns: {', '.join(existing_cols)}")
        
        return df
    
    def process_all_data(self, data_dir: str = 'data') -> pd.DataFrame:
        """
        Process all data files and combine into single feature dataset
        
        Args:
            data_dir: Directory containing data files
            
        Returns:
            Combined DataFrame with all features
        """
        logger.info("="*80)
        logger.info("FEATURE ENGINEERING PIPELINE")
        logger.info("="*80)
        
        # Load all data
        data_files = self.load_data(data_dir)
        
        if not data_files:
            raise ValueError("No data files found!")
        
        # Group by symbol
        symbols = {}
        for filename, df in data_files.items():
            parts = filename.split('_')
            if len(parts) >= 2:
                symbol = parts[0]
                timeframe = parts[1]
                
                if symbol not in symbols:
                    symbols[symbol] = {}
                
                symbols[symbol][timeframe] = df
        
        logger.info(f"\nProcessing {len(symbols)} symbols...")
        
        all_features = []
        
        for symbol, timeframes in symbols.items():
            logger.info(f"\n{'='*80}")
            logger.info(f"Processing {symbol}")
            logger.info(f"{'='*80}")
            
            # Get HTF data if available (use 4h or 1h as HTF)
            htf_df = None
            if '4h' in timeframes:
                htf_df = timeframes['4h']
            elif '1h' in timeframes:
                htf_df = timeframes['1h']
            
            for timeframe, df in timeframes.items():
                # Engineer features
                df_features = self.engineer_features(df, symbol, timeframe, htf_df)
                
                # Add to collection
                all_features.append(df_features)
        
        # Combine all data
        logger.info(f"\n{'='*80}")
        logger.info("Combining all features...")
        combined_df = pd.concat(all_features, ignore_index=True)
        logger.info(f"  ✓ Combined dataset: {len(combined_df):,} rows, {len(combined_df.columns)} columns")
        
        # Normalize features
        combined_df = self.normalize_features(combined_df, fit=True)
        
        # Drop raw OHLCV
        combined_df = self.drop_raw_ohlcv(combined_df)
        
        # Store feature columns
        self.feature_columns = [col for col in combined_df.columns 
                               if col not in ['timestamp', 'symbol', 'timeframe']]
        
        return combined_df
    
    def save_features(self, df: pd.DataFrame, output_file: str = OUTPUT_FILE):
        """
        Save feature dataset
        
        Args:
            df: DataFrame with features
            output_file: Output file path
        """
        logger.info(f"\nSaving features to {output_file}...")
        
        # Ensure output directory exists
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Save to parquet
        df.to_parquet(output_file, index=False, compression='snappy')
        
        file_size = output_path.stat().st_size / (1024 * 1024)
        logger.info(f"  ✓ Saved {len(df):,} rows to {output_file} ({file_size:.2f} MB)")
    
    def print_summary(self, df: pd.DataFrame):
        """
        Print feature summary
        
        Args:
            df: DataFrame with features
        """
        logger.info(f"\n{'='*80}")
        logger.info("FEATURE ENGINEERING COMPLETE")
        logger.info(f"{'='*80}")
        
        logger.info(f"\nDataset Summary:")
        logger.info(f"  Total Rows: {len(df):,}")
        logger.info(f"  Total Features: {len(self.feature_columns)}")
        logger.info(f"  Symbols: {df['symbol'].nunique()}")
        logger.info(f"  Timeframes: {df['timeframe'].nunique()}")
        
        logger.info(f"\nFeature Groups:")
        
        # Count features by group
        groups = {
            'Trend': ['ema', 'trend'],
            'Momentum': ['rsi', 'macd', 'roc', 'momentum', 'stoch'],
            'Volatility': ['atr', 'std', 'bb', 'volatility', 'parkinson'],
            'Market Structure': ['higher', 'lower', 'bos', 'swing', 'structure'],
            'Candle': ['body', 'wick', 'candle', 'hammer', 'engulfing', 'pinbar', 'doji'],
            'Time': ['hour', 'day', 'month', 'session', 'overlap'],
            'Liquidity': ['equal', 'stop_hunt', 'sweep', 'fvg', 'order_block', 'liquidity']
        }
        
        for group_name, keywords in groups.items():
            count = sum(1 for col in self.feature_columns 
                       if any(kw in col.lower() for kw in keywords))
            logger.info(f"  {group_name}: {count} features")
        
        logger.info(f"\nSample Features (first 10):")
        for i, col in enumerate(self.feature_columns[:10], 1):
            logger.info(f"  {i:2d}. {col}")
        
        if len(self.feature_columns) > 10:
            logger.info(f"  ... and {len(self.feature_columns) - 10} more")
        
        logger.info(f"\nSample Rows:")
        print(df.head(5).to_string())
        
        logger.info(f"\n{'='*80}")


def main():
    """Main entry point"""
    pipeline = FeatureEngineeringPipeline()
    
    # Process all data (use parent directory's data folder)
    data_dir = Path(__file__).parent.parent / 'data'
    features_df = pipeline.process_all_data(data_dir=str(data_dir))
    
    # Save features
    output_file = data_dir / 'features.parquet'
    pipeline.save_features(features_df, output_file=str(output_file))
    
    # Print summary
    pipeline.print_summary(features_df)


if __name__ == '__main__':
    main()
