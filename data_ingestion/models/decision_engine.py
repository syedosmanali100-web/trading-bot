"""
Trading Decision Engine
Combines all trained models to generate BUY/SELL/NO_TRADE signals
"""
import joblib
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)


@dataclass
class TradingSignal:
    """Trading signal with metadata"""
    signal: str  # 'BUY', 'SELL', 'NO_TRADE'
    confidence: float  # 0-1
    quality: str  # 'A', 'B', or 'NONE'
    direction_prob: float
    volatility_prob: float
    notrade_prob: float
    reason: str
    timestamp: datetime
    
    def __str__(self):
        return (
            f"\n{'='*80}\n"
            f"TRADING SIGNAL\n"
            f"{'='*80}\n"
            f"Signal:           {self.signal}\n"
            f"Quality:          {self.quality}\n"
            f"Confidence:       {self.confidence:.2%}\n"
            f"Direction Prob:   {self.direction_prob:.2%}\n"
            f"Volatility Prob:  {self.volatility_prob:.2%}\n"
            f"No-Trade Prob:    {self.notrade_prob:.2%}\n"
            f"Reason:           {self.reason}\n"
            f"Timestamp:        {self.timestamp}\n"
            f"{'='*80}"
        )


class TradingDecisionEngine:
    """
    Decision engine that combines all models to generate trading signals
    """
    
    def __init__(self, 
                 direction_model_path: str,
                 volatility_model_path: str,
                 notrade_model_path: str,
                 notrade_threshold: float = 0.6,
                 direction_min_threshold: float = 0.55,
                 direction_high_threshold: float = 0.65,
                 volatility_min_threshold: float = 0.5):
        """
        Initialize decision engine
        
        Args:
            direction_model_path: Path to direction model
            volatility_model_path: Path to volatility model
            notrade_model_path: Path to no-trade filter model
            notrade_threshold: Max acceptable no-trade probability
            direction_min_threshold: Min direction probability to trade
            direction_high_threshold: Threshold for quality A trades
            volatility_min_threshold: Min volatility probability
        """
        self.notrade_threshold = notrade_threshold
        self.direction_min_threshold = direction_min_threshold
        self.direction_high_threshold = direction_high_threshold
        self.volatility_min_threshold = volatility_min_threshold
        
        # Load models
        logger.info("="*80)
        logger.info("LOADING TRADING MODELS")
        logger.info("="*80)
        
        self.direction_model = joblib.load(direction_model_path)
        logger.info(f"✓ Direction model loaded: {Path(direction_model_path).name}")
        
        self.volatility_model = joblib.load(volatility_model_path)
        logger.info(f"✓ Volatility model loaded: {Path(volatility_model_path).name}")
        
        self.notrade_model = joblib.load(notrade_model_path)
        logger.info(f"✓ No-trade filter loaded: {Path(notrade_model_path).name}")
        
        logger.info("\n" + "="*80)
        logger.info("DECISION ENGINE READY")
        logger.info("="*80)
        logger.info(f"No-Trade Threshold:      {self.notrade_threshold:.2%}")
        logger.info(f"Direction Min:           {self.direction_min_threshold:.2%}")
        logger.info(f"Direction High (A):      {self.direction_high_threshold:.2%}")
        logger.info(f"Volatility Min:          {self.volatility_min_threshold:.2%}")
        logger.info("="*80)
    
    def predict_probabilities(self, features: pd.DataFrame) -> Dict[str, np.ndarray]:
        """
        Get predictions from all models
        
        Args:
            features: DataFrame with feature columns
            
        Returns:
            Dictionary with probabilities from each model
        """
        predictions = {
            'direction': self.direction_model.predict_proba(features)[:, 1],
            'volatility': self.volatility_model.predict_proba(features)[:, 1],
            'notrade': self.notrade_model.predict_proba(features)[:, 1]
        }
        
        return predictions
    
    def generate_signal(self, 
                       direction_prob: float,
                       volatility_prob: float,
                       notrade_prob: float,
                       timestamp: Optional[datetime] = None) -> TradingSignal:
        """
        Generate trading signal based on model probabilities
        
        Args:
            direction_prob: Direction model probability (0=loss, 1=profit)
            volatility_prob: Volatility expansion probability
            notrade_prob: No-trade filter probability
            timestamp: Signal timestamp
            
        Returns:
            TradingSignal object
        """
        if timestamp is None:
            timestamp = datetime.now()
        
        # STEP 1: No-Trade Filter (FIRST)
        if notrade_prob > self.notrade_threshold:
            return TradingSignal(
                signal='NO_TRADE',
                confidence=0.0,
                quality='NONE',
                direction_prob=direction_prob,
                volatility_prob=volatility_prob,
                notrade_prob=notrade_prob,
                reason=f"No-trade filter triggered ({notrade_prob:.2%} > {self.notrade_threshold:.2%}). "
                       f"Poor trading conditions detected (low volatility, high spread, or unfavorable session).",
                timestamp=timestamp
            )
        
        # STEP 2: Direction Confidence
        if direction_prob < self.direction_min_threshold:
            return TradingSignal(
                signal='NO_TRADE',
                confidence=0.0,
                quality='NONE',
                direction_prob=direction_prob,
                volatility_prob=volatility_prob,
                notrade_prob=notrade_prob,
                reason=f"Direction confidence too low ({direction_prob:.2%} < {self.direction_min_threshold:.2%}). "
                       f"No clear directional bias detected.",
                timestamp=timestamp
            )
        
        # Determine trade quality
        if direction_prob >= self.direction_high_threshold:
            trade_quality = 'A'
        else:
            trade_quality = 'B'
        
        # STEP 3: Volatility Check
        if volatility_prob < self.volatility_min_threshold:
            return TradingSignal(
                signal='NO_TRADE',
                confidence=0.0,
                quality='NONE',
                direction_prob=direction_prob,
                volatility_prob=volatility_prob,
                notrade_prob=notrade_prob,
                reason=f"Volatility too low ({volatility_prob:.2%} < {self.volatility_min_threshold:.2%}). "
                       f"Insufficient price movement expected.",
                timestamp=timestamp
            )
        
        # STEP 4: Final Signal
        # Direction > 0.5 means profit more likely (LONG)
        # Direction < 0.5 means loss more likely (SHORT)
        if direction_prob > 0.5:
            signal = 'BUY'
            confidence = direction_prob
            reason = (
                f"LONG signal: Direction model predicts profit with {direction_prob:.2%} confidence. "
                f"Volatility expansion expected ({volatility_prob:.2%}). "
                f"Quality {trade_quality} trade."
            )
        else:
            signal = 'SELL'
            confidence = 1 - direction_prob  # Invert for short confidence
            reason = (
                f"SHORT signal: Direction model predicts loss with {confidence:.2%} confidence. "
                f"Volatility expansion expected ({volatility_prob:.2%}). "
                f"Quality {trade_quality} trade."
            )
        
        return TradingSignal(
            signal=signal,
            confidence=confidence,
            quality=trade_quality,
            direction_prob=direction_prob,
            volatility_prob=volatility_prob,
            notrade_prob=notrade_prob,
            reason=reason,
            timestamp=timestamp
        )
    
    def process_features(self, features: pd.DataFrame, timestamps: Optional[pd.Series] = None) -> pd.DataFrame:
        """
        Process features and generate signals for all rows
        
        Args:
            features: DataFrame with feature columns (no timestamp)
            timestamps: Optional Series with timestamps
            
        Returns:
            DataFrame with added signal columns
        """
        logger.info("\n" + "="*80)
        logger.info("PROCESSING FEATURES")
        logger.info("="*80)
        logger.info(f"Input rows: {len(features):,}")
        
        # Get predictions
        predictions = self.predict_probabilities(features)
        
        # Add predictions to dataframe
        df = features.copy()
        df['pred_direction'] = predictions['direction']
        df['pred_volatility'] = predictions['volatility']
        df['pred_notrade'] = predictions['notrade']
        
        # Generate signals for each row
        signals = []
        for idx, row in df.iterrows():
            timestamp = timestamps.iloc[idx] if timestamps is not None else datetime.now()
            signal = self.generate_signal(
                direction_prob=row['pred_direction'],
                volatility_prob=row['pred_volatility'],
                notrade_prob=row['pred_notrade'],
                timestamp=timestamp
            )
            signals.append(signal)
        
        # Add signal columns
        df['signal'] = [s.signal for s in signals]
        df['signal_quality'] = [s.quality for s in signals]
        df['signal_confidence'] = [s.confidence for s in signals]
        df['signal_reason'] = [s.reason for s in signals]
        
        # Summary
        logger.info("\n" + "="*80)
        logger.info("SIGNAL SUMMARY")
        logger.info("="*80)
        
        signal_counts = df['signal'].value_counts()
        for signal, count in signal_counts.items():
            pct = count / len(df) * 100
            logger.info(f"{signal:12s}: {count:6,} ({pct:5.1f}%)")
        
        # Quality breakdown
        logger.info("\nQuality Breakdown:")
        quality_counts = df[df['signal'] != 'NO_TRADE']['signal_quality'].value_counts()
        for quality, count in quality_counts.items():
            logger.info(f"  Quality {quality}: {count:,}")
        
        return df
    
    def get_live_signal(self, features: pd.Series) -> TradingSignal:
        """
        Get signal for a single live data point
        
        Args:
            features: Series with feature values
            
        Returns:
            TradingSignal object
        """
        # Convert to DataFrame for prediction
        df = pd.DataFrame([features])
        
        # Get predictions
        predictions = self.predict_probabilities(df)
        
        # Generate signal
        signal = self.generate_signal(
            direction_prob=predictions['direction'][0],
            volatility_prob=predictions['volatility'][0],
            notrade_prob=predictions['notrade'][0]
        )
        
        return signal


def demo_decision_engine():
    """Demonstrate decision engine with test data"""
    
    logger.info("\n" + "="*80)
    logger.info("DECISION ENGINE DEMO")
    logger.info("="*80)
    
    # Setup paths
    models_dir = Path(__file__).parent
    data_dir = models_dir.parent / 'data'
    
    # Load models (use Split_2 - most recent training)
    engine = TradingDecisionEngine(
        direction_model_path=str(models_dir / 'direction_model_Split_2.pkl'),
        volatility_model_path=str(models_dir / 'volatility_model_Split_2.pkl'),
        notrade_model_path=str(models_dir / 'notrade_model_Split_2.pkl')
    )
    
    # Load test data
    logger.info("\n" + "="*80)
    logger.info("LOADING TEST DATA")
    logger.info("="*80)
    
    training_file = data_dir / 'training_dataset.parquet'
    df = pd.read_parquet(training_file)
    
    # Get feature columns
    feature_cols = [col for col in df.columns 
                   if not col.startswith('label_') 
                   and col not in ['timestamp', 'symbol', 'timeframe']]
    
    # Take a sample for demo
    sample_size = 1000
    df_sample = df.sample(n=min(sample_size, len(df)), random_state=42)
    
    logger.info(f"✓ Loaded {len(df_sample):,} samples for testing")
    
    # Process features
    df_signals = engine.process_features(df_sample[feature_cols])
    
    # Show example signals
    logger.info("\n" + "="*80)
    logger.info("EXAMPLE SIGNALS")
    logger.info("="*80)
    
    # Show BUY signals
    buy_signals = df_signals[df_signals['signal'] == 'BUY'].head(3)
    if len(buy_signals) > 0:
        logger.info("\nBUY Signals:")
        for idx, row in buy_signals.iterrows():
            logger.info(f"\n  Signal #{idx}")
            logger.info(f"    Direction:  {row['pred_direction']:.2%}")
            logger.info(f"    Volatility: {row['pred_volatility']:.2%}")
            logger.info(f"    No-Trade:   {row['pred_notrade']:.2%}")
            logger.info(f"    Quality:    {row['signal_quality']}")
            logger.info(f"    Confidence: {row['signal_confidence']:.2%}")
    
    # Show SELL signals
    sell_signals = df_signals[df_signals['signal'] == 'SELL'].head(3)
    if len(sell_signals) > 0:
        logger.info("\nSELL Signals:")
        for idx, row in sell_signals.iterrows():
            logger.info(f"\n  Signal #{idx}")
            logger.info(f"    Direction:  {row['pred_direction']:.2%}")
            logger.info(f"    Volatility: {row['pred_volatility']:.2%}")
            logger.info(f"    No-Trade:   {row['pred_notrade']:.2%}")
            logger.info(f"    Quality:    {row['signal_quality']}")
            logger.info(f"    Confidence: {row['signal_confidence']:.2%}")
    
    # Show NO_TRADE reasons
    logger.info("\nNO_TRADE Reasons (sample):")
    notrade_signals = df_signals[df_signals['signal'] == 'NO_TRADE'].head(5)
    for idx, row in notrade_signals.iterrows():
        reason = row['signal_reason'].split('.')[0]  # First sentence
        logger.info(f"  • {reason}")
    
    # Save results
    output_file = data_dir / 'signals_demo.parquet'
    df_signals.to_parquet(output_file, index=False)
    logger.info(f"\n✓ Signals saved to: {output_file}")
    
    # Final statistics
    logger.info("\n" + "="*80)
    logger.info("FINAL STATISTICS")
    logger.info("="*80)
    
    total_signals = len(df_signals)
    tradeable = len(df_signals[df_signals['signal'] != 'NO_TRADE'])
    
    logger.info(f"\nTotal Samples:     {total_signals:,}")
    logger.info(f"Tradeable:         {tradeable:,} ({tradeable/total_signals*100:.1f}%)")
    logger.info(f"No Trade:          {total_signals-tradeable:,} ({(total_signals-tradeable)/total_signals*100:.1f}%)")
    
    if tradeable > 0:
        buy_count = len(df_signals[df_signals['signal'] == 'BUY'])
        sell_count = len(df_signals[df_signals['signal'] == 'SELL'])
        
        logger.info(f"\nBuy Signals:       {buy_count:,} ({buy_count/tradeable*100:.1f}% of tradeable)")
        logger.info(f"Sell Signals:      {sell_count:,} ({sell_count/tradeable*100:.1f}% of tradeable)")
        
        # Quality breakdown
        quality_a = len(df_signals[df_signals['signal_quality'] == 'A'])
        quality_b = len(df_signals[df_signals['signal_quality'] == 'B'])
        
        logger.info(f"\nQuality A:         {quality_a:,} ({quality_a/tradeable*100:.1f}% of tradeable)")
        logger.info(f"Quality B:         {quality_b:,} ({quality_b/tradeable*100:.1f}% of tradeable)")
        
        # Average confidence
        avg_confidence = df_signals[df_signals['signal'] != 'NO_TRADE']['signal_confidence'].mean()
        logger.info(f"\nAvg Confidence:    {avg_confidence:.2%}")
    
    logger.info("\n" + "="*80)
    logger.info("✓ DEMO COMPLETE")
    logger.info("="*80)


if __name__ == '__main__':
    demo_decision_engine()
