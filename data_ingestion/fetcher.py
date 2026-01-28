"""
Data fetcher module - handles downloading historical data from multiple sources
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging
from typing import Optional, Dict, List
import time

logger = logging.getLogger(__name__)


class DataFetcher:
    """Fetches historical trading data from various sources"""
    
    def __init__(self, source: str = 'yfinance'):
        self.source = source
        self.rate_limit_delay = 1  # seconds between requests
        
    def fetch_data(self, symbol: str, start_date: datetime, end_date: datetime, 
                   interval: str) -> Optional[pd.DataFrame]:
        """
        Fetch historical data for a symbol
        
        Args:
            symbol: Trading pair symbol
            start_date: Start date for data
            end_date: End date for data
            interval: Timeframe interval (1m, 5m, 15m, 1h, 4h)
            
        Returns:
            DataFrame with OHLCV data or None if failed
        """
        try:
            if self.source == 'yfinance':
                return self._fetch_yfinance(symbol, start_date, end_date, interval)
            else:
                logger.error(f"Unsupported data source: {self.source}")
                return None
        except Exception as e:
            logger.error(f"Error fetching data for {symbol} {interval}: {str(e)}")
            return None
    
    def _fetch_yfinance(self, symbol: str, start_date: datetime, 
                       end_date: datetime, interval: str) -> Optional[pd.DataFrame]:
        """Fetch data from Yahoo Finance"""
        try:
            import yfinance as yf
            import ssl
            import certifi
            
            # Fix SSL issue for Python 3.13
            try:
                ssl._create_default_https_context = ssl._create_unverified_context
            except:
                pass
            
            # Map symbol format for yfinance
            yf_symbol = self._map_symbol_to_yfinance(symbol)
            
            # Map interval format
            yf_interval = self._map_interval_to_yfinance(interval)
            
            logger.info(f"Fetching {yf_symbol} data for {interval} from {start_date} to {end_date}")
            
            # Fetch data with retry logic
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    ticker = yf.Ticker(yf_symbol)
                    df = ticker.history(start=start_date, end=end_date, interval=yf_interval)
                    
                    if not df.empty:
                        break
                except Exception as e:
                    if attempt < max_retries - 1:
                        logger.warning(f"Attempt {attempt + 1} failed, retrying...")
                        time.sleep(2)
                    else:
                        raise e
            
            if df.empty:
                logger.warning(f"No data returned for {symbol} {interval}")
                return None
            
            # Standardize column names
            df = df.rename(columns={
                'Open': 'open',
                'High': 'high',
                'Low': 'low',
                'Close': 'close',
                'Volume': 'volume'
            })
            
            # Reset index to get timestamp as column
            df = df.reset_index()
            df = df.rename(columns={'Date': 'timestamp', 'Datetime': 'timestamp'})
            
            # Keep only required columns
            df = df[['timestamp', 'open', 'high', 'low', 'close', 'volume']]
            
            # Calculate spread (high-low as percentage of close)
            df['spread'] = ((df['high'] - df['low']) / df['close'] * 100).round(4)
            
            logger.info(f"Successfully fetched {len(df)} candles for {symbol} {interval}")
            
            time.sleep(self.rate_limit_delay)  # Rate limiting
            
            return df
            
        except ImportError:
            logger.error("yfinance not installed. Install with: pip install yfinance")
            return None
        except Exception as e:
            logger.error(f"Error in yfinance fetch: {str(e)}")
            return None
    
    def _map_symbol_to_yfinance(self, symbol: str) -> str:
        """Map trading symbol to yfinance format"""
        symbol_map = {
            'EURUSD': 'EURUSD=X',
            'GBPUSD': 'GBPUSD=X',
            'USDJPY': 'USDJPY=X',
            'BTCUSD': 'BTC-USD',
            'ETHUSD': 'ETH-USD',
            'XAUUSD': 'GC=F',  # Gold futures
            'CRUDE': 'CL=F'     # Crude oil futures
        }
        return symbol_map.get(symbol, symbol)
    
    def _map_interval_to_yfinance(self, interval: str) -> str:
        """Map interval to yfinance format"""
        interval_map = {
            '1m': '1m',
            '5m': '5m',
            '15m': '15m',
            '1h': '1h',
            '4h': '1h'  # yfinance doesn't have 4h, we'll resample
        }
        return interval_map.get(interval, '1h')
