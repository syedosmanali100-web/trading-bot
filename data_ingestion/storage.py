"""
Storage module - handles saving data in various formats
"""
import pandas as pd
import os
import logging
from pathlib import Path
from typing import Dict, List

logger = logging.getLogger(__name__)


class DataStorage:
    """Handles data storage operations"""
    
    def __init__(self, output_dir: str = 'data', output_format: str = 'parquet'):
        self.output_dir = output_dir
        self.output_format = output_format
        self._ensure_directory()
    
    def _ensure_directory(self):
        """Create output directory if it doesn't exist"""
        Path(self.output_dir).mkdir(parents=True, exist_ok=True)
    
    def save_data(self, df: pd.DataFrame, symbol: str, timeframe: str) -> str:
        """
        Save DataFrame to file
        
        Args:
            df: DataFrame to save
            symbol: Trading symbol
            timeframe: Timeframe string
            
        Returns:
            Path to saved file
        """
        filename = f"{symbol}_{timeframe}.{self.output_format}"
        filepath = os.path.join(self.output_dir, filename)
        
        try:
            if self.output_format == 'parquet':
                df.to_parquet(filepath, index=False, compression='snappy')
            elif self.output_format == 'csv':
                df.to_csv(filepath, index=False)
            else:
                raise ValueError(f"Unsupported format: {self.output_format}")
            
            logger.info(f"Saved {len(df)} rows to {filepath}")
            return filepath
            
        except Exception as e:
            logger.error(f"Error saving data to {filepath}: {str(e)}")
            raise
    
    def load_data(self, symbol: str, timeframe: str) -> pd.DataFrame:
        """Load data from file"""
        filename = f"{symbol}_{timeframe}.{self.output_format}"
        filepath = os.path.join(self.output_dir, filename)
        
        try:
            if self.output_format == 'parquet':
                return pd.read_parquet(filepath)
            elif self.output_format == 'csv':
                return pd.read_csv(filepath, parse_dates=['timestamp'])
            else:
                raise ValueError(f"Unsupported format: {self.output_format}")
        except Exception as e:
            logger.error(f"Error loading data from {filepath}: {str(e)}")
            raise
    
    def get_saved_files(self) -> List[str]:
        """Get list of all saved data files"""
        if not os.path.exists(self.output_dir):
            return []
        
        files = [f for f in os.listdir(self.output_dir) 
                if f.endswith(f'.{self.output_format}')]
        return sorted(files)
    
    def get_file_info(self, filepath: str) -> Dict:
        """Get information about a saved file"""
        try:
            stat = os.stat(filepath)
            
            # Load and get row count
            if self.output_format == 'parquet':
                df = pd.read_parquet(filepath)
            else:
                df = pd.read_csv(filepath)
            
            return {
                'filepath': filepath,
                'size_mb': round(stat.st_size / (1024 * 1024), 2),
                'rows': len(df),
                'columns': len(df.columns),
                'date_range': f"{df['timestamp'].min()} to {df['timestamp'].max()}" if 'timestamp' in df.columns else 'N/A'
            }
        except Exception as e:
            logger.error(f"Error getting file info: {str(e)}")
            return {}
