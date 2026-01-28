"""
System validation script - verify data ingestion system is working correctly
"""
import pandas as pd
from pathlib import Path
import sys
import os

# Fix Unicode encoding for Windows console
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

def validate_system():
    """Run comprehensive validation checks"""
    print("="*80)
    print("TRADING BOT DATA INGESTION SYSTEM - VALIDATION")
    print("="*80)
    
    checks_passed = 0
    checks_total = 0
    
    # Check 1: Data folder exists
    checks_total += 1
    print(f"\n[{checks_total}] Checking data folder...")
    data_path = Path('data')
    if data_path.exists():
        print("  ✓ Data folder exists")
        checks_passed += 1
    else:
        print("  ✗ Data folder not found")
        return False
    
    # Check 2: Data files present
    checks_total += 1
    print(f"\n[{checks_total}] Checking data files...")
    data_files = list(data_path.glob('*.parquet'))
    if len(data_files) > 0:
        print(f"  ✓ Found {len(data_files)} data files")
        checks_passed += 1
    else:
        print("  ✗ No data files found")
        return False
    
    # Check 3: Load sample file
    checks_total += 1
    print(f"\n[{checks_total}] Loading sample file...")
    try:
        sample_file = data_files[0]
        df = pd.read_parquet(sample_file)
        print(f"  ✓ Successfully loaded {sample_file.name}")
        print(f"    Rows: {len(df):,}")
        checks_passed += 1
    except Exception as e:
        print(f"  ✗ Failed to load file: {str(e)}")
        return False
    
    # Check 4: Validate schema
    checks_total += 1
    print(f"\n[{checks_total}] Validating data schema...")
    required_columns = ['timestamp', 'symbol', 'timeframe', 'open', 'high', 'low', 'close', 'volume', 'spread']
    missing_columns = [col for col in required_columns if col not in df.columns]
    if not missing_columns:
        print(f"  ✓ All required columns present: {', '.join(required_columns)}")
        checks_passed += 1
    else:
        print(f"  ✗ Missing columns: {', '.join(missing_columns)}")
        return False
    
    # Check 5: Data quality - no nulls
    checks_total += 1
    print(f"\n[{checks_total}] Checking for null values...")
    null_count = df.isnull().sum().sum()
    if null_count == 0:
        print("  ✓ No null values found")
        checks_passed += 1
    else:
        print(f"  ✗ Found {null_count} null values")
    
    # Check 6: Data quality - valid OHLC
    checks_total += 1
    print(f"\n[{checks_total}] Validating OHLC relationships...")
    invalid_high_low = (df['high'] < df['low']).sum()
    invalid_close = ((df['close'] > df['high']) | (df['close'] < df['low'])).sum()
    invalid_open = ((df['open'] > df['high']) | (df['open'] < df['low'])).sum()
    
    if invalid_high_low == 0 and invalid_close == 0 and invalid_open == 0:
        print("  ✓ All OHLC relationships valid")
        checks_passed += 1
    else:
        print(f"  ✗ Invalid OHLC: high/low={invalid_high_low}, close={invalid_close}, open={invalid_open}")
    
    # Check 7: Data quality - no duplicates
    checks_total += 1
    print(f"\n[{checks_total}] Checking for duplicate timestamps...")
    duplicates = df.duplicated(subset=['timestamp']).sum()
    if duplicates == 0:
        print("  ✓ No duplicate timestamps")
        checks_passed += 1
    else:
        print(f"  ✗ Found {duplicates} duplicate timestamps")
    
    # Check 8: Data quality - positive prices
    checks_total += 1
    print(f"\n[{checks_total}] Checking for positive prices...")
    negative_prices = ((df['open'] <= 0) | (df['high'] <= 0) | (df['low'] <= 0) | (df['close'] <= 0)).sum()
    if negative_prices == 0:
        print("  ✓ All prices are positive")
        checks_passed += 1
    else:
        print(f"  ✗ Found {negative_prices} rows with non-positive prices")
    
    # Summary statistics
    print("\n" + "="*80)
    print("DATA SUMMARY")
    print("="*80)
    
    total_rows = 0
    total_size = 0
    
    print(f"\n{'File':<30} {'Rows':>15} {'Size (MB)':>12}")
    print("-"*80)
    
    for file in sorted(data_files):
        try:
            df_temp = pd.read_parquet(file)
            size_mb = file.stat().st_size / (1024 * 1024)
            print(f"{file.name:<30} {len(df_temp):>15,} {size_mb:>11.2f}")
            total_rows += len(df_temp)
            total_size += size_mb
        except:
            pass
    
    print("-"*80)
    print(f"{'TOTAL':<30} {total_rows:>15,} {total_size:>11.2f}")
    
    # Final result
    print("\n" + "="*80)
    print("VALIDATION RESULTS")
    print("="*80)
    print(f"\nChecks Passed: {checks_passed}/{checks_total}")
    
    if checks_passed == checks_total:
        print("\n🎉 SUCCESS! Data ingestion system is fully operational!")
        print("\nYou can now:")
        print("  1. View data: python view_data.py BTCUSD 1h")
        print("  2. Load data in your bot: df = pd.read_parquet('data/BTCUSD_1h.parquet')")
        print("  3. Start training your trading bot!")
        print("\n" + "="*80)
        return True
    else:
        print(f"\n⚠️  WARNING: {checks_total - checks_passed} checks failed")
        print("Please review the errors above and fix them.")
        print("\n" + "="*80)
        return False


if __name__ == '__main__':
    success = validate_system()
    sys.exit(0 if success else 1)
