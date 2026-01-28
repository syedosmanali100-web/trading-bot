"""
Quick feature engineering pipeline - processes subset of data for faster execution
"""
import pandas as pd
import numpy as np
from pathlib import Path
import logging
from sklearn.preprocessing import StandardScaler

from config import *
from trend_features import TrendFeatures
from momentum_features import MomentumFeatures
from volatility_features import VolatilityFeatures
from market_structure_features import MarketStructureFeatures
from candle_features import CandleFeatures
from time_features import TimeFeatures
from liquidity_features import LiquidityFeatures

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)


def quick_feature_engineering():
    """Quick feature engineering on subset of data"""
    
    logger.info("="*80)
    logger.info("QUICK FEATURE ENGINEERING PIPELINE")
    logger.info("="*80)
    
    # Load only 1h data for faster processing
    data_dir = Path(__file__).parent.parent / 'data'
    
    logger.info(f"\nLoading 1h data files...")
    data_files = list(data_dir.glob('*_1h.parquet'))
    
    if not data_files:
        logger.error("No 1h data files found!")
        return
    
    # Initialize feature calculators
    trend_feat = TrendFeatures()
    momentum_feat = MomentumFeatures()
    volatility_feat = VolatilityFeatures()
    structure_feat = MarketStructureFeatures()
    candle_feat = CandleFeatures()
    time_feat = TimeFeatures()
    liquidity_feat = LiquidityFeatures()
    
    all_features = []
    
    for file in data_files[:2]:  # Process only first 2 files for speed
        logger.info(f"\nProcessing {file.name}...")
        df = pd.read_parquet(file)
        
        logger.info(f"  Loaded: {len(df):,} rows")
        
        # Calculate features
        logger.info("  [1/7] Trend features...")
        df = trend_feat.calculate(df)
        
        logger.info("  [2/7] Momentum features...")
        df = momentum_feat.calculate(df)
        
        logger.info("  [3/7] Volatility features...")
        df = volatility_feat.calculate(df)
        
        logger.info("  [4/7] Market structure features...")
        df = structure_feat.calculate(df)
        
        logger.info("  [5/7] Candle features...")
        df = candle_feat.calculate(df)
        
        logger.info("  [6/7] Time features...")
        df = time_feat.calculate(df)
        
        logger.info("  [7/7] Liquidity features...")
        df = liquidity_feat.calculate(df)
        
        # Clean
        df = df.replace([np.inf, -np.inf], np.nan)
        df = df.dropna()
        
        logger.info(f"  ✓ Features calculated: {len(df):,} rows, {len(df.columns)} columns")
        
        all_features.append(df)
    
    # Combine
    logger.info(f"\n{'='*80}")
    logger.info("Combining features...")
    combined_df = pd.concat(all_features, ignore_index=True)
    logger.info(f"  ✓ Combined: {len(combined_df):,} rows, {len(combined_df.columns)} columns")
    
    # Normalize
    logger.info("\nNormalizing features...")
    exclude_cols = ['timestamp', 'symbol', 'timeframe']
    numeric_cols = combined_df.select_dtypes(include=[np.number]).columns.tolist()
    cols_to_normalize = [col for col in numeric_cols if col not in exclude_cols]
    
    scaler = StandardScaler()
    combined_df[cols_to_normalize] = scaler.fit_transform(combined_df[cols_to_normalize])
    logger.info(f"  ✓ Normalized {len(cols_to_normalize)} features")
    
    # Drop raw OHLCV
    logger.info("\nDropping raw OHLCV...")
    cols_to_drop = ['open', 'high', 'low', 'close', 'volume']
    existing_cols = [col for col in cols_to_drop if col in combined_df.columns]
    combined_df = combined_df.drop(columns=existing_cols)
    logger.info(f"  ✓ Dropped: {', '.join(existing_cols)}")
    
    # Save
    output_file = data_dir / 'features.parquet'
    logger.info(f"\nSaving to {output_file}...")
    combined_df.to_parquet(output_file, index=False, compression='snappy')
    
    file_size = output_file.stat().st_size / (1024 * 1024)
    logger.info(f"  ✓ Saved: {len(combined_df):,} rows ({file_size:.2f} MB)")
    
    # Summary
    feature_cols = [col for col in combined_df.columns 
                   if col not in ['timestamp', 'symbol', 'timeframe']]
    
    logger.info(f"\n{'='*80}")
    logger.info("FEATURE ENGINEERING COMPLETE")
    logger.info(f"{'='*80}")
    logger.info(f"\nDataset Summary:")
    logger.info(f"  Total Rows: {len(combined_df):,}")
    logger.info(f"  Total Features: {len(feature_cols)}")
    logger.info(f"  Symbols: {combined_df['symbol'].nunique()}")
    logger.info(f"  Timeframes: {combined_df['timeframe'].nunique()}")
    
    # Feature groups
    logger.info(f"\nFeature Groups:")
    groups = {
        'Trend': ['ema', 'trend'],
        'Momentum': ['rsi', 'macd', 'roc', 'momentum', 'stoch'],
        'Volatility': ['atr', 'std', 'bb', 'volatility'],
        'Market Structure': ['higher', 'lower', 'bos', 'swing'],
        'Candle': ['body', 'wick', 'candle', 'hammer', 'engulfing', 'pinbar'],
        'Time': ['hour', 'day', 'session'],
        'Liquidity': ['equal', 'stop_hunt', 'sweep', 'fvg', 'order_block']
    }
    
    for group_name, keywords in groups.items():
        count = sum(1 for col in feature_cols 
                   if any(kw in col.lower() for kw in keywords))
        logger.info(f"  {group_name}: {count} features")
    
    logger.info(f"\nAll Features ({len(feature_cols)} total):")
    for i, col in enumerate(feature_cols, 1):
        logger.info(f"  {i:3d}. {col}")
    
    logger.info(f"\nSample Rows (first 5):")
    print(combined_df.head(5).to_string())
    
    logger.info(f"\n{'='*80}")
    logger.info("✓ Feature engineering complete!")
    logger.info(f"✓ Output: {output_file}")
    logger.info(f"{'='*80}")


if __name__ == '__main__':
    quick_feature_engineering()
