"""
Main data ingestion pipeline
"""
import pandas as pd
import logging
from datetime import datetime
from typing import List, Dict
import json
from pathlib import Path

from config import (
    SYMBOLS, TIMEFRAMES, START_DATE, END_DATE,
    OUTPUT_DIR, LOG_DIR, OUTPUT_FORMAT, DATA_SOURCE,
    MAX_MISSING_CANDLES_PERCENT
)
from fetcher import DataFetcher
from processor import DataProcessor
from storage import DataStorage


class IngestionPipeline:
    """Main pipeline for data ingestion"""
    
    def __init__(self):
        self.fetcher = DataFetcher(source=DATA_SOURCE)
        self.processor = DataProcessor(max_missing_percent=MAX_MISSING_CANDLES_PERCENT)
        self.storage = DataStorage(output_dir=OUTPUT_DIR, output_format=OUTPUT_FORMAT)
        self.stats = []
        self._setup_logging()
    
    def _setup_logging(self):
        """Setup logging configuration"""
        Path(LOG_DIR).mkdir(parents=True, exist_ok=True)
        
        log_file = f"{LOG_DIR}/ingestion_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler()
            ]
        )
        
        self.logger = logging.getLogger(__name__)
        self.logger.info("=" * 80)
        self.logger.info("DATA INGESTION PIPELINE STARTED")
        self.logger.info("=" * 80)
        self.logger.info(f"Symbols: {SYMBOLS}")
        self.logger.info(f"Timeframes: {list(TIMEFRAMES.keys())}")
        self.logger.info(f"Date Range: {START_DATE} to {END_DATE}")
        self.logger.info(f"Output Format: {OUTPUT_FORMAT}")
        self.logger.info("=" * 80)
    
    def run(self, symbols: List[str] = None, timeframes: List[str] = None):
        """
        Run the complete ingestion pipeline
        
        Args:
            symbols: List of symbols to process (default: all from config)
            timeframes: List of timeframes to process (default: all from config)
        """
        symbols = symbols or SYMBOLS
        timeframes = timeframes or list(TIMEFRAMES.keys())
        
        total_tasks = len(symbols) * len(timeframes)
        completed = 0
        
        self.logger.info(f"Starting ingestion for {total_tasks} tasks...")
        
        for symbol in symbols:
            for timeframe in timeframes:
                completed += 1
                self.logger.info(f"\n[{completed}/{total_tasks}] Processing {symbol} {timeframe}")
                
                try:
                    self._process_symbol_timeframe(symbol, timeframe)
                except Exception as e:
                    self.logger.error(f"Failed to process {symbol} {timeframe}: {str(e)}")
                    self.stats.append({
                        'symbol': symbol,
                        'timeframe': timeframe,
                        'status': 'FAILED',
                        'error': str(e)
                    })
        
        self._generate_summary()
    
    def _process_symbol_timeframe(self, symbol: str, timeframe: str):
        """Process a single symbol-timeframe combination"""
        interval_minutes = TIMEFRAMES[timeframe]
        
        # 1. Fetch data
        self.logger.info(f"Fetching data for {symbol} {timeframe}...")
        df = self.fetcher.fetch_data(symbol, START_DATE, END_DATE, timeframe)
        
        if df is None or len(df) == 0:
            self.logger.warning(f"No data fetched for {symbol} {timeframe}")
            self.stats.append({
                'symbol': symbol,
                'timeframe': timeframe,
                'status': 'NO_DATA',
                'raw_rows': 0,
                'final_rows': 0
            })
            return
        
        # 2. Handle 4h resampling if needed
        if timeframe == '4h':
            self.logger.info("Resampling 1h data to 4h...")
            df = self.processor.resample_to_4h(df)
        
        # 3. Process data
        self.logger.info(f"Processing data...")
        df_processed, stats = self.processor.process_data(
            df, symbol, timeframe, interval_minutes
        )
        
        if len(df_processed) == 0:
            self.logger.warning(f"No data after processing for {symbol} {timeframe}")
            stats['status'] = 'FAILED_PROCESSING'
            self.stats.append(stats)
            return
        
        # 4. Save data
        self.logger.info(f"Saving data...")
        filepath = self.storage.save_data(df_processed, symbol, timeframe)
        
        # 5. Preview data
        self._preview_data(df_processed, symbol, timeframe)
        
        # 6. Record stats
        stats['status'] = 'SUCCESS'
        stats['filepath'] = filepath
        self.stats.append(stats)
    
    def _preview_data(self, df: pd.DataFrame, symbol: str, timeframe: str):
        """Print preview of processed data"""
        self.logger.info(f"\n{'='*80}")
        self.logger.info(f"PREVIEW: {symbol} {timeframe}")
        self.logger.info(f"{'='*80}")
        self.logger.info(f"Total Rows: {len(df)}")
        self.logger.info(f"Date Range: {df['timestamp'].min()} to {df['timestamp'].max()}")
        self.logger.info(f"\nFirst 5 rows:")
        self.logger.info(f"\n{df.head().to_string()}")
        self.logger.info(f"\nLast 5 rows:")
        self.logger.info(f"\n{df.tail().to_string()}")
        self.logger.info(f"\nData Statistics:")
        self.logger.info(f"\n{df[['open', 'high', 'low', 'close', 'volume', 'spread']].describe().to_string()}")
        self.logger.info(f"{'='*80}\n")
    
    def _generate_summary(self):
        """Generate and save summary report"""
        self.logger.info("\n" + "="*80)
        self.logger.info("INGESTION PIPELINE COMPLETED")
        self.logger.info("="*80)
        
        # Count by status
        success_count = sum(1 for s in self.stats if s.get('status') == 'SUCCESS')
        failed_count = sum(1 for s in self.stats if s.get('status') in ['FAILED', 'FAILED_PROCESSING'])
        no_data_count = sum(1 for s in self.stats if s.get('status') == 'NO_DATA')
        
        self.logger.info(f"\nSummary:")
        self.logger.info(f"  Total Tasks: {len(self.stats)}")
        self.logger.info(f"  Successful: {success_count}")
        self.logger.info(f"  Failed: {failed_count}")
        self.logger.info(f"  No Data: {no_data_count}")
        
        # Detailed stats table
        self.logger.info(f"\nDetailed Results:")
        self.logger.info(f"{'Symbol':<10} {'Timeframe':<10} {'Status':<15} {'Rows':<10} {'Quality':<12}")
        self.logger.info("-" * 80)
        
        for stat in self.stats:
            symbol = stat.get('symbol', 'N/A')
            timeframe = stat.get('timeframe', 'N/A')
            status = stat.get('status', 'UNKNOWN')
            rows = stat.get('final_rows', 0)
            quality = stat.get('data_quality', 'N/A')
            
            self.logger.info(f"{symbol:<10} {timeframe:<10} {status:<15} {rows:<10} {quality:<12}")
        
        # Save summary to JSON
        summary_file = f"{LOG_DIR}/summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(summary_file, 'w') as f:
            json.dump(self.stats, f, indent=2, default=str)
        
        self.logger.info(f"\nSummary saved to: {summary_file}")
        
        # List saved files
        saved_files = self.storage.get_saved_files()
        self.logger.info(f"\nSaved Files ({len(saved_files)}):")
        for file in saved_files:
            filepath = f"{OUTPUT_DIR}/{file}"
            info = self.storage.get_file_info(filepath)
            self.logger.info(f"  {file}: {info.get('rows', 0)} rows, {info.get('size_mb', 0)} MB")
        
        self.logger.info("\n" + "="*80)


def main():
    """Main entry point"""
    pipeline = IngestionPipeline()
    pipeline.run()


if __name__ == '__main__':
    main()
