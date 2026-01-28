"""
Data viewer - preview and analyze ingested data
"""
import pandas as pd
import sys
from pathlib import Path

from storage import DataStorage
from config import OUTPUT_DIR, OUTPUT_FORMAT


def view_file(symbol: str, timeframe: str):
    """View a specific data file"""
    storage = DataStorage(output_dir=OUTPUT_DIR, output_format=OUTPUT_FORMAT)
    
    try:
        df = storage.load_data(symbol, timeframe)
        
        print("="*80)
        print(f"DATA PREVIEW: {symbol} {timeframe}")
        print("="*80)
        print(f"\nTotal Rows: {len(df):,}")
        print(f"Date Range: {df['timestamp'].min()} to {df['timestamp'].max()}")
        print(f"Columns: {', '.join(df.columns)}")
        
        print(f"\n{'='*80}")
        print("FIRST 10 ROWS:")
        print("="*80)
        print(df.head(10).to_string(index=False))
        
        print(f"\n{'='*80}")
        print("LAST 10 ROWS:")
        print("="*80)
        print(df.tail(10).to_string(index=False))
        
        print(f"\n{'='*80}")
        print("STATISTICAL SUMMARY:")
        print("="*80)
        print(df[['open', 'high', 'low', 'close', 'volume', 'spread']].describe())
        
        print(f"\n{'='*80}")
        print("DATA QUALITY CHECKS:")
        print("="*80)
        
        # Check for nulls
        null_counts = df.isnull().sum()
        print(f"Null values: {null_counts.sum()} total")
        if null_counts.sum() > 0:
            print(null_counts[null_counts > 0])
        
        # Check OHLC validity
        invalid_high_low = (df['high'] < df['low']).sum()
        invalid_close = ((df['close'] > df['high']) | (df['close'] < df['low'])).sum()
        invalid_open = ((df['open'] > df['high']) | (df['open'] < df['low'])).sum()
        
        print(f"Invalid high/low: {invalid_high_low}")
        print(f"Invalid close: {invalid_close}")
        print(f"Invalid open: {invalid_open}")
        
        # Check for duplicates
        duplicates = df.duplicated(subset=['timestamp']).sum()
        print(f"Duplicate timestamps: {duplicates}")
        
        # Check for gaps
        df_sorted = df.sort_values('timestamp')
        time_diffs = df_sorted['timestamp'].diff()
        expected_diff = pd.Timedelta(minutes=int(timeframe.replace('m', '').replace('h', '')*60 if 'h' in timeframe else int(timeframe.replace('m', ''))))
        gaps = (time_diffs > expected_diff * 1.5).sum()
        print(f"Time gaps detected: {gaps}")
        
        print(f"\n{'='*80}")
        print("✓ Data loaded successfully!")
        print("="*80)
        
    except Exception as e:
        print(f"Error loading data: {str(e)}")


def list_all_files():
    """List all available data files"""
    storage = DataStorage(output_dir=OUTPUT_DIR, output_format=OUTPUT_FORMAT)
    files = storage.get_saved_files()
    
    if not files:
        print("No data files found in data/ folder")
        return
    
    print("="*80)
    print(f"AVAILABLE DATA FILES ({len(files)} total)")
    print("="*80)
    print(f"\n{'File':<30} {'Rows':>15} {'Size':>10} {'Date Range':<40}")
    print("-"*80)
    
    for file in files:
        filepath = f"{OUTPUT_DIR}/{file}"
        info = storage.get_file_info(filepath)
        print(f"{file:<30} {info.get('rows', 0):>15,} {info.get('size_mb', 0):>9.2f}MB {info.get('date_range', 'N/A'):<40}")
    
    print("="*80)
    print("\nUsage: python view_data.py <symbol> <timeframe>")
    print("Example: python view_data.py BTCUSD 1h")
    print("="*80)


def main():
    """Main entry point"""
    if len(sys.argv) == 3:
        symbol = sys.argv[1].upper()
        timeframe = sys.argv[2].lower()
        view_file(symbol, timeframe)
    else:
        list_all_files()


if __name__ == '__main__':
    main()
