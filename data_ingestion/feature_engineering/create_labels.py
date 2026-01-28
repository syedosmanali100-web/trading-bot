"""
Smart label creation for supervised learning trading model
"""
import pandas as pd
import numpy as np
from pathlib import Path
import logging
from typing import Tuple

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)


class SmartLabeler:
    """Create smart labels for trading model"""
    
    def __init__(self, 
                 lookforward_candles: int = 10,
                 profit_pips: float = 0.015,  # 1.5% move
                 loss_pips: float = 0.010,     # 1.0% move
                 volatility_threshold: float = 1.3,
                 atr_low_percentile: float = 20,
                 body_ratio_threshold: float = 0.3,
                 spread_high_percentile: float = 80):
        """
        Initialize labeler
        
        Args:
            lookforward_candles: Number of candles to look forward
            profit_pips: Profit threshold (as decimal, e.g., 0.015 = 1.5%)
            loss_pips: Loss threshold (as decimal)
            volatility_threshold: ATR expansion multiplier
            atr_low_percentile: Percentile for low ATR
            body_ratio_threshold: Min body/range ratio
            spread_high_percentile: Percentile for high spread
        """
        self.lookforward = lookforward_candles
        self.profit_pips = profit_pips
        self.loss_pips = loss_pips
        self.volatility_threshold = volatility_threshold
        self.atr_low_percentile = atr_low_percentile
        self.body_ratio_threshold = body_ratio_threshold
        self.spread_high_percentile = spread_high_percentile
    
    def create_direction_label(self, df: pd.DataFrame) -> pd.Series:
        """
        LABEL 1: Direction Probability
        
        Look forward N candles and determine if price hits profit target
        before stop loss.
        
        Returns:
            Series with values: 1 (profit first), 0 (loss first), -1 (no clear move)
        """
        logger.info(f"Creating direction labels (lookforward={self.lookforward})...")
        
        labels = pd.Series(-1, index=df.index)  # Default: no clear move
        
        # We need actual price data - reconstruct from normalized features
        # Use close price approximation from features
        # Since we normalized, we need to work with the original data
        # For this, we'll use a proxy: look at returns/momentum
        
        for i in range(len(df) - self.lookforward):
            # Get future price movements
            # Use momentum features as proxy for price movement
            future_window = df.iloc[i:i+self.lookforward+1]
            
            # Calculate cumulative returns over the window
            # We'll use the momentum_5 feature as a proxy for price changes
            if 'momentum_5_pct' in df.columns:
                future_returns = future_window['momentum_5_pct'].values
            else:
                # Fallback: use any available return proxy
                continue
            
            # Track cumulative movement
            cumulative_return = 0
            hit_profit = False
            hit_loss = False
            
            for ret in future_returns[1:]:  # Skip current candle
                cumulative_return += ret
                
                # Check if profit target hit
                if cumulative_return >= self.profit_pips:
                    hit_profit = True
                    break
                
                # Check if loss target hit
                if cumulative_return <= -self.loss_pips:
                    hit_loss = True
                    break
            
            # Assign label
            if hit_profit and not hit_loss:
                labels.iloc[i] = 1  # Profit first
            elif hit_loss and not hit_profit:
                labels.iloc[i] = 0  # Loss first
            # else: remains -1 (no clear move)
        
        # Count distribution
        counts = labels.value_counts().sort_index()
        logger.info(f"  Direction labels:")
        logger.info(f"    Profit first (1): {counts.get(1, 0):,} ({counts.get(1, 0)/len(labels)*100:.1f}%)")
        logger.info(f"    Loss first (0): {counts.get(0, 0):,} ({counts.get(0, 0)/len(labels)*100:.1f}%)")
        logger.info(f"    No clear move (-1): {counts.get(-1, 0):,} ({counts.get(-1, 0)/len(labels)*100:.1f}%)")
        
        return labels
    
    def create_volatility_label(self, df: pd.DataFrame) -> pd.Series:
        """
        LABEL 2: Volatility Expansion
        
        Predict if volatility will expand in the near future.
        
        Returns:
            Series with values: 1 (expansion), 0 (no expansion)
        """
        logger.info(f"Creating volatility labels...")
        
        labels = pd.Series(0, index=df.index)
        
        if 'atr' not in df.columns:
            logger.warning("  ATR column not found, using volatility proxy")
            if 'std_dev' in df.columns:
                atr_col = 'std_dev'
            else:
                logger.error("  No volatility features found!")
                return labels
        else:
            atr_col = 'atr'
        
        # Calculate future ATR (average over next N candles)
        future_atr = df[atr_col].rolling(window=self.lookforward).mean().shift(-self.lookforward)
        current_atr = df[atr_col]
        
        # Label as 1 if future ATR > threshold * current ATR
        labels = (future_atr > self.volatility_threshold * current_atr).astype(int)
        
        # Count distribution
        counts = labels.value_counts().sort_index()
        logger.info(f"  Volatility labels:")
        logger.info(f"    Expansion (1): {counts.get(1, 0):,} ({counts.get(1, 0)/len(labels)*100:.1f}%)")
        logger.info(f"    No expansion (0): {counts.get(0, 0):,} ({counts.get(0, 0)/len(labels)*100:.1f}%)")
        
        return labels
    
    def create_no_trade_label(self, df: pd.DataFrame) -> pd.Series:
        """
        LABEL 3: No-Trade Filter
        
        Identify conditions where trading should be avoided.
        
        Returns:
            Series with values: 1 (no trade), 0 (trade ok)
        """
        logger.info(f"Creating no-trade labels...")
        
        labels = pd.Series(0, index=df.index)
        
        # Condition 1: Asia session
        if 'session_asia' in df.columns:
            asia_session = df['session_asia'] == 1
            labels = labels | asia_session
            logger.info(f"    Asia session: {asia_session.sum():,} candles")
        
        # Condition 2: Very low ATR
        if 'atr' in df.columns:
            atr_threshold = df['atr'].quantile(self.atr_low_percentile / 100)
            low_atr = df['atr'] < atr_threshold
            labels = labels | low_atr
            logger.info(f"    Low ATR: {low_atr.sum():,} candles")
        
        # Condition 3: Small candle body
        if 'body_range_ratio' in df.columns:
            small_body = df['body_range_ratio'] < self.body_ratio_threshold
            labels = labels | small_body
            logger.info(f"    Small body: {small_body.sum():,} candles")
        
        # Condition 4: High spread
        if 'spread' in df.columns:
            spread_threshold = df['spread'].quantile(self.spread_high_percentile / 100)
            high_spread = df['spread'] > spread_threshold
            labels = labels | high_spread
            logger.info(f"    High spread: {high_spread.sum():,} candles")
        
        # Condition 5: Range compression (consolidation)
        if 'consolidation' in df.columns:
            consolidation = df['consolidation'] == 1
            labels = labels | consolidation
            logger.info(f"    Consolidation: {consolidation.sum():,} candles")
        
        # Convert to int
        labels = labels.astype(int)
        
        # Count distribution
        counts = labels.value_counts().sort_index()
        logger.info(f"  No-trade labels:")
        logger.info(f"    No trade (1): {counts.get(1, 0):,} ({counts.get(1, 0)/len(labels)*100:.1f}%)")
        logger.info(f"    Trade OK (0): {counts.get(0, 0):,} ({counts.get(0, 0)/len(labels)*100:.1f}%)")
        
        return labels
    
    def balance_classes(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Balance classes for better model training
        
        Strategy:
        - For direction label: Keep all clear moves (0, 1), downsample unclear (-1)
        - For volatility: Undersample majority class
        - For no-trade: Keep as is (imbalance is informative)
        """
        logger.info(f"\nBalancing classes...")
        logger.info(f"  Original dataset: {len(df):,} rows")
        
        # Remove rows with no clear direction move (-1)
        df_clear = df[df['label_direction'] != -1].copy()
        logger.info(f"  After removing unclear moves: {len(df_clear):,} rows")
        
        # Balance direction labels (0 vs 1)
        if 'label_direction' in df_clear.columns:
            direction_counts = df_clear['label_direction'].value_counts()
            min_count = direction_counts.min()
            
            # Undersample majority class
            df_balanced = pd.concat([
                df_clear[df_clear['label_direction'] == 0].sample(n=min_count, random_state=42),
                df_clear[df_clear['label_direction'] == 1].sample(n=min_count, random_state=42)
            ])
            
            logger.info(f"  After balancing direction: {len(df_balanced):,} rows")
            logger.info(f"    Class 0: {min_count:,}")
            logger.info(f"    Class 1: {min_count:,}")
        else:
            df_balanced = df_clear
        
        # Shuffle
        df_balanced = df_balanced.sample(frac=1, random_state=42).reset_index(drop=True)
        
        return df_balanced
    
    def create_all_labels(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Create all labels and prepare final dataset
        
        Args:
            df: DataFrame with features
            
        Returns:
            DataFrame with features and labels
        """
        logger.info("="*80)
        logger.info("SMART LABEL CREATION")
        logger.info("="*80)
        
        df = df.copy()
        
        # Create labels
        logger.info(f"\nInput dataset: {len(df):,} rows, {len(df.columns)} columns")
        
        # Label 1: Direction
        df['label_direction'] = self.create_direction_label(df)
        
        # Label 2: Volatility
        df['label_volatility'] = self.create_volatility_label(df)
        
        # Label 3: No-trade
        df['label_no_trade'] = self.create_no_trade_label(df)
        
        # Drop last N rows to prevent look-ahead bias
        logger.info(f"\nDropping last {self.lookforward} rows (look-ahead prevention)...")
        df = df.iloc[:-self.lookforward].copy()
        logger.info(f"  Dataset after drop: {len(df):,} rows")
        
        # Remove any remaining NaN values
        df = df.dropna()
        logger.info(f"  Dataset after dropna: {len(df):,} rows")
        
        # Balance classes
        df_balanced = self.balance_classes(df)
        
        return df_balanced
    
    def print_label_summary(self, df: pd.DataFrame):
        """Print comprehensive label summary"""
        logger.info(f"\n{'='*80}")
        logger.info("LABEL SUMMARY")
        logger.info(f"{'='*80}")
        
        logger.info(f"\nFinal Dataset:")
        logger.info(f"  Total Rows: {len(df):,}")
        logger.info(f"  Total Columns: {len(df.columns)}")
        logger.info(f"  Features: {len([c for c in df.columns if not c.startswith('label_') and c not in ['timestamp', 'symbol', 'timeframe']])}")
        logger.info(f"  Labels: 3")
        
        # Label distributions
        logger.info(f"\nLabel Distributions:")
        
        # Direction
        logger.info(f"\n  1. Direction (label_direction):")
        direction_counts = df['label_direction'].value_counts().sort_index()
        for label, count in direction_counts.items():
            label_name = {0: 'Loss first', 1: 'Profit first', -1: 'No clear move'}
            logger.info(f"     {label_name.get(label, label)}: {count:,} ({count/len(df)*100:.1f}%)")
        
        # Volatility
        logger.info(f"\n  2. Volatility (label_volatility):")
        vol_counts = df['label_volatility'].value_counts().sort_index()
        for label, count in vol_counts.items():
            label_name = {0: 'No expansion', 1: 'Expansion'}
            logger.info(f"     {label_name.get(label, label)}: {count:,} ({count/len(df)*100:.1f}%)")
        
        # No-trade
        logger.info(f"\n  3. No-Trade (label_no_trade):")
        notrade_counts = df['label_no_trade'].value_counts().sort_index()
        for label, count in notrade_counts.items():
            label_name = {0: 'Trade OK', 1: 'No trade'}
            logger.info(f"     {label_name.get(label, label)}: {count:,} ({count/len(df)*100:.1f}%)")
        
        # Cross-tabulation
        logger.info(f"\n  Label Combinations:")
        logger.info(f"     Direction=1 & Volatility=1: {len(df[(df['label_direction']==1) & (df['label_volatility']==1)]):,}")
        logger.info(f"     Direction=1 & NoTrade=0: {len(df[(df['label_direction']==1) & (df['label_no_trade']==0)]):,}")
        logger.info(f"     Direction=0 & Volatility=1: {len(df[(df['label_direction']==0) & (df['label_volatility']==1)]):,}")
        
        # Sample rows
        logger.info(f"\n  Sample Rows (first 5):")
        label_cols = ['label_direction', 'label_volatility', 'label_no_trade']
        display_cols = ['timestamp', 'symbol', 'timeframe'] + label_cols
        available_cols = [c for c in display_cols if c in df.columns]
        print(df[available_cols].head().to_string(index=False))


def main():
    """Main entry point"""
    
    # Load features
    data_dir = Path(__file__).parent.parent / 'data'
    features_file = data_dir / 'features.parquet'
    
    logger.info("="*80)
    logger.info("LOADING FEATURES")
    logger.info("="*80)
    logger.info(f"\nLoading from: {features_file}")
    
    if not features_file.exists():
        logger.error(f"Features file not found: {features_file}")
        logger.error("Please run feature engineering first!")
        return
    
    df = pd.read_parquet(features_file)
    logger.info(f"✓ Loaded: {len(df):,} rows, {len(df.columns)} columns")
    
    # Create labeler
    labeler = SmartLabeler(
        lookforward_candles=10,
        profit_pips=0.015,  # 1.5%
        loss_pips=0.010,    # 1.0%
        volatility_threshold=1.3,
        atr_low_percentile=20,
        body_ratio_threshold=0.3,
        spread_high_percentile=80
    )
    
    # Create labels
    df_labeled = labeler.create_all_labels(df)
    
    # Print summary
    labeler.print_label_summary(df_labeled)
    
    # Save
    output_file = data_dir / 'training_dataset.parquet'
    logger.info(f"\n{'='*80}")
    logger.info("SAVING TRAINING DATASET")
    logger.info(f"{'='*80}")
    logger.info(f"\nSaving to: {output_file}")
    
    df_labeled.to_parquet(output_file, index=False, compression='snappy')
    
    file_size = output_file.stat().st_size / (1024 * 1024)
    logger.info(f"✓ Saved: {len(df_labeled):,} rows ({file_size:.2f} MB)")
    
    # Final summary
    logger.info(f"\n{'='*80}")
    logger.info("✓ LABEL CREATION COMPLETE")
    logger.info(f"{'='*80}")
    logger.info(f"\nOutput: {output_file}")
    logger.info(f"Ready for model training!")
    logger.info(f"{'='*80}")


if __name__ == '__main__':
    main()
