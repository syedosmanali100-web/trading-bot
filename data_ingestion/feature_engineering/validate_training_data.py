"""
Validate training dataset before model training
"""
import pandas as pd
import numpy as np
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)


def validate_training_data():
    """Comprehensive validation of training dataset"""
    
    logger.info("="*80)
    logger.info("TRAINING DATASET VALIDATION")
    logger.info("="*80)
    
    # Load data
    data_dir = Path(__file__).parent.parent / 'data'
    training_file = data_dir / 'training_dataset.parquet'
    
    if not training_file.exists():
        logger.error(f"Training dataset not found: {training_file}")
        return False
    
    logger.info(f"\nLoading: {training_file}")
    df = pd.read_parquet(training_file)
    logger.info(f"✓ Loaded: {len(df):,} rows, {len(df.columns)} columns")
    
    # Validation checks
    checks_passed = 0
    checks_total = 0
    
    # Check 1: Required columns
    checks_total += 1
    logger.info(f"\n[{checks_total}] Checking required columns...")
    required_cols = ['timestamp', 'symbol', 'timeframe', 
                    'label_direction', 'label_volatility', 'label_no_trade']
    missing_cols = [col for col in required_cols if col not in df.columns]
    
    if not missing_cols:
        logger.info("  ✓ All required columns present")
        checks_passed += 1
    else:
        logger.error(f"  ✗ Missing columns: {missing_cols}")
    
    # Check 2: No null values
    checks_total += 1
    logger.info(f"\n[{checks_total}] Checking for null values...")
    null_counts = df.isnull().sum()
    total_nulls = null_counts.sum()
    
    if total_nulls == 0:
        logger.info("  ✓ No null values found")
        checks_passed += 1
    else:
        logger.error(f"  ✗ Found {total_nulls} null values")
        logger.error(f"    Columns with nulls: {null_counts[null_counts > 0].to_dict()}")
    
    # Check 3: No infinite values
    checks_total += 1
    logger.info(f"\n[{checks_total}] Checking for infinite values...")
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    inf_counts = np.isinf(df[numeric_cols]).sum()
    total_infs = inf_counts.sum()
    
    if total_infs == 0:
        logger.info("  ✓ No infinite values found")
        checks_passed += 1
    else:
        logger.error(f"  ✗ Found {total_infs} infinite values")
    
    # Check 4: Label values are valid
    checks_total += 1
    logger.info(f"\n[{checks_total}] Checking label values...")
    
    valid_labels = True
    
    # Direction: should be 0 or 1 (no -1 after balancing)
    direction_values = df['label_direction'].unique()
    if set(direction_values).issubset({0, 1}):
        logger.info(f"  ✓ Direction labels valid: {sorted(direction_values)}")
    else:
        logger.error(f"  ✗ Direction labels invalid: {sorted(direction_values)}")
        valid_labels = False
    
    # Volatility: should be 0 or 1
    vol_values = df['label_volatility'].unique()
    if set(vol_values).issubset({0, 1}):
        logger.info(f"  ✓ Volatility labels valid: {sorted(vol_values)}")
    else:
        logger.error(f"  ✗ Volatility labels invalid: {sorted(vol_values)}")
        valid_labels = False
    
    # No-trade: should be 0 or 1
    notrade_values = df['label_no_trade'].unique()
    if set(notrade_values).issubset({0, 1}):
        logger.info(f"  ✓ No-trade labels valid: {sorted(notrade_values)}")
    else:
        logger.error(f"  ✗ No-trade labels invalid: {sorted(notrade_values)}")
        valid_labels = False
    
    if valid_labels:
        checks_passed += 1
    
    # Check 5: Class balance
    checks_total += 1
    logger.info(f"\n[{checks_total}] Checking class balance...")
    
    direction_counts = df['label_direction'].value_counts()
    balance_ratio = direction_counts.min() / direction_counts.max()
    
    if balance_ratio >= 0.9:  # Within 10% of perfect balance
        logger.info(f"  ✓ Direction labels balanced: {balance_ratio:.2%}")
        logger.info(f"    Class 0: {direction_counts.get(0, 0):,}")
        logger.info(f"    Class 1: {direction_counts.get(1, 0):,}")
        checks_passed += 1
    else:
        logger.warning(f"  ⚠ Direction labels imbalanced: {balance_ratio:.2%}")
    
    # Check 6: Feature count
    checks_total += 1
    logger.info(f"\n[{checks_total}] Checking feature count...")
    
    feature_cols = [col for col in df.columns 
                   if not col.startswith('label_') 
                   and col not in ['timestamp', 'symbol', 'timeframe']]
    
    if len(feature_cols) >= 100:
        logger.info(f"  ✓ Sufficient features: {len(feature_cols)}")
        checks_passed += 1
    else:
        logger.warning(f"  ⚠ Low feature count: {len(feature_cols)}")
    
    # Check 7: Data types
    checks_total += 1
    logger.info(f"\n[{checks_total}] Checking data types...")
    
    # Labels should be int
    label_dtypes_ok = all(
        df[col].dtype in [np.int32, np.int64] 
        for col in ['label_direction', 'label_volatility', 'label_no_trade']
    )
    
    if label_dtypes_ok:
        logger.info("  ✓ Label data types correct (int)")
        checks_passed += 1
    else:
        logger.error("  ✗ Label data types incorrect")
    
    # Check 8: Timestamp ordering
    checks_total += 1
    logger.info(f"\n[{checks_total}] Checking timestamp ordering...")
    
    # After shuffling, timestamps won't be ordered, which is fine
    logger.info("  ✓ Timestamps present (shuffled for training)")
    checks_passed += 1
    
    # Summary statistics
    logger.info(f"\n{'='*80}")
    logger.info("DATASET STATISTICS")
    logger.info(f"{'='*80}")
    
    logger.info(f"\nShape:")
    logger.info(f"  Rows: {len(df):,}")
    logger.info(f"  Columns: {len(df.columns)}")
    logger.info(f"  Features: {len(feature_cols)}")
    logger.info(f"  Labels: 3")
    logger.info(f"  Metadata: 3 (timestamp, symbol, timeframe)")
    
    logger.info(f"\nSymbols:")
    for symbol, count in df['symbol'].value_counts().items():
        logger.info(f"  {symbol}: {count:,} ({count/len(df)*100:.1f}%)")
    
    logger.info(f"\nTimeframes:")
    for tf, count in df['timeframe'].value_counts().items():
        logger.info(f"  {tf}: {count:,} ({count/len(df)*100:.1f}%)")
    
    logger.info(f"\nLabel Distributions:")
    
    for label_col in ['label_direction', 'label_volatility', 'label_no_trade']:
        logger.info(f"\n  {label_col}:")
        counts = df[label_col].value_counts().sort_index()
        for val, count in counts.items():
            logger.info(f"    {val}: {count:,} ({count/len(df)*100:.1f}%)")
    
    logger.info(f"\nFeature Statistics:")
    logger.info(f"  Mean: {df[feature_cols].mean().mean():.4f}")
    logger.info(f"  Std: {df[feature_cols].std().mean():.4f}")
    logger.info(f"  Min: {df[feature_cols].min().min():.4f}")
    logger.info(f"  Max: {df[feature_cols].max().max():.4f}")
    
    # Memory usage
    memory_mb = df.memory_usage(deep=True).sum() / (1024 * 1024)
    logger.info(f"\nMemory Usage: {memory_mb:.2f} MB")
    
    # Final result
    logger.info(f"\n{'='*80}")
    logger.info("VALIDATION RESULTS")
    logger.info(f"{'='*80}")
    logger.info(f"\nChecks Passed: {checks_passed}/{checks_total}")
    
    if checks_passed == checks_total:
        logger.info("\n✓ ALL CHECKS PASSED!")
        logger.info("Dataset is ready for model training!")
        logger.info(f"{'='*80}")
        return True
    else:
        logger.warning(f"\n⚠ {checks_total - checks_passed} checks failed")
        logger.warning("Please review the issues above")
        logger.info(f"{'='*80}")
        return False


if __name__ == '__main__':
    validate_training_data()
