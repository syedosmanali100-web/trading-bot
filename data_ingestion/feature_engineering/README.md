# Advanced Feature Engineering Pipeline

## 🎯 Overview

A comprehensive, modular feature engineering system that transforms raw OHLCV data into 137+ advanced trading features across 7 categories.

## ✅ Status: COMPLETE

**Output**: `data/features.parquet` (87,540 rows, 137 features, 43.18 MB)

## 📊 Feature Groups

### A. Trend Features (19 features)
- **EMAs**: 20, 50, 200 period exponential moving averages
- **EMA Slopes**: Rate of change for each EMA
- **EMA Distances**: Price distance from each EMA (normalized)
- **EMA Crossovers**: 20/50 and 50/200 crosses
- **Price Position**: Above/below each EMA
- **EMA Alignment**: All EMAs aligned (strong trend)
- **Trend Score**: Composite trend strength (-0.5 to 0.5)
- **HTF Trend**: Higher timeframe trend direction

### B. Momentum Features (19 features)
- **RSI**: 14-period Relative Strength Index
- **RSI Slope**: RSI rate of change
- **RSI Zones**: Oversold (<30), Overbought (>70), Neutral (40-60)
- **MACD**: Fast/slow EMA difference
- **MACD Signal**: 9-period EMA of MACD
- **MACD Histogram**: MACD - Signal
- **MACD Crossovers**: Above/below signal line
- **Rate of Change**: 10-period price change
- **Momentum**: 5, 10, 20 period price differences
- **Momentum %**: Percentage changes
- **Stochastic**: K and D oscillators

### C. Volatility Features (15 features)
- **ATR**: 14-period Average True Range
- **ATR %**: ATR as percentage of price
- **ATR Slope**: Volatility trend
- **Candle Range**: High - Low
- **Candle Range %**: Range as % of close
- **Standard Deviation**: 20-period rolling std
- **Bollinger Bands**: Upper, middle, lower bands
- **BB Width**: Band width (volatility measure)
- **BB Position**: Price position within bands
- **BB Distances**: Distance to upper/lower bands
- **Volatility Regime**: High/low volatility flag
- **True Range**: Max(H-L, H-C_prev, C_prev-L)
- **Historical Volatility**: Annualized volatility
- **Parkinson Volatility**: High-low range based

### D. Market Structure Features (15 features)
- **Higher Highs/Lows**: Uptrend structure detection
- **Lower Highs/Lows**: Downtrend structure detection
- **Uptrend/Downtrend Structure**: Combined flags
- **Break of Structure**: Bullish/bearish BOS
- **Swing Highs/Lows**: Local extrema detection
- **Distance to Swings**: Distance to last swing points
- **Trend Strength**: Structure-based trend score
- **Near Resistance/Support**: Proximity to key levels
- **Consolidation**: Low volatility periods
- **Breakout**: High volatility after consolidation

### E. Candle Features (18 features)
- **Body Size**: |Close - Open|
- **Upper/Lower Wicks**: Wick sizes
- **Total Range**: High - Low
- **Body/Range Ratio**: Body as % of total range
- **Wick Ratios**: Upper/lower wick proportions
- **Candle Direction**: Bullish/bearish/doji
- **Patterns**: Hammer, shooting star, engulfing, pinbar
- **Inside/Outside Bars**: Consolidation/expansion
- **Candle Strength**: Body size vs average
- **Consecutive Candles**: Streak counting
- **Gaps**: Gap up/down detection
- **Wick Dominance**: Long wick flags

### F. Time Features (10 features)
- **Hour/Day/Month**: Time components
- **Cyclical Encoding**: Sin/cos for hour, day, month
- **Trading Sessions**: Asia, London, NY
- **Session Overlaps**: London/NY, Asia/London
- **Weekend Flag**: Saturday/Sunday
- **Week Start/End**: Monday/Friday
- **Month Start/End**: First/last 5 days
- **Market Open/Close**: Daily boundaries
- **Activity Periods**: High/low activity flags

### G. Liquidity Features (10 features)
- **Equal Highs/Lows**: Liquidity pool detection
- **Stop Hunts**: Above/below recent levels
- **Sweeps**: High/low sweeps
- **Fair Value Gaps**: Bullish/bearish FVGs
- **Order Blocks**: Bullish/bearish OBs
- **Liquidity Grab**: Combined stop hunt flag
- **Volume Spikes/Dry-ups**: Volume anomalies
- **Rejections**: Price rejection from levels
- **Imbalance**: Large gaps between candles

## 🚀 Quick Start

### Run Feature Engineering

```bash
cd data_ingestion/feature_engineering
python quick_feature_pipeline.py
```

### Load Features

```python
import pandas as pd

# Load engineered features
df = pd.read_parquet('data/features.parquet')

print(f"Rows: {len(df):,}")
print(f"Features: {len(df.columns)}")
print(df.head())
```

## 📁 File Structure

```
feature_engineering/
├── __init__.py                      # Package init
├── config.py                        # Configuration
├── trend_features.py                # Trend calculations
├── momentum_features.py             # Momentum indicators
├── volatility_features.py           # Volatility measures
├── market_structure_features.py     # Structure analysis
├── candle_features.py               # Candle patterns
├── time_features.py                 # Time-based features
├── liquidity_features.py            # Liquidity/smart money
├── feature_pipeline.py              # Main pipeline (full)
├── quick_feature_pipeline.py        # Quick pipeline (subset)
└── README.md                        # This file
```

## 🔧 Configuration

Edit `config.py` to customize:

```python
# Feature parameters
EMA_PERIODS = [20, 50, 200]
RSI_PERIOD = 14
MACD_FAST = 12
MACD_SLOW = 26
MACD_SIGNAL = 9
ATR_PERIOD = 14
ROLLING_STD_PERIOD = 20

# Market structure
STRUCTURE_LOOKBACK = 20

# Trading sessions (UTC)
SESSIONS = {
    'ASIA': (0, 9),
    'LONDON': (8, 16),
    'NY': (13, 22)
}

# Normalization
NORMALIZATION = 'standard'  # 'standard', 'minmax', or 'robust'
```

## 💻 Usage Examples

### Load and Explore

```python
import pandas as pd

df = pd.read_parquet('data/features.parquet')

# Basic info
print(f"Shape: {df.shape}")
print(f"Symbols: {df['symbol'].unique()}")
print(f"Timeframes: {df['timeframe'].unique()}")

# Feature statistics
feature_cols = [col for col in df.columns 
                if col not in ['timestamp', 'symbol', 'timeframe']]
print(df[feature_cols].describe())
```

### Filter by Symbol/Timeframe

```python
# Get BTCUSD 1h data
btc_1h = df[(df['symbol'] == 'BTCUSD') & (df['timeframe'] == '1h')]

print(f"BTCUSD 1h: {len(btc_1h):,} rows")
```

### Feature Correlation

```python
import seaborn as sns
import matplotlib.pyplot as plt

# Calculate correlation matrix
feature_cols = [col for col in df.columns 
                if col not in ['timestamp', 'symbol', 'timeframe']]
corr = df[feature_cols].corr()

# Plot heatmap
plt.figure(figsize=(20, 20))
sns.heatmap(corr, cmap='coolwarm', center=0)
plt.title('Feature Correlation Matrix')
plt.show()
```

### Feature Importance (with labels)

```python
from sklearn.ensemble import RandomForestClassifier

# Assuming you have labels
X = df[feature_cols]
y = df['target']  # Your target variable

# Train model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X, y)

# Get feature importance
importance = pd.DataFrame({
    'feature': feature_cols,
    'importance': model.feature_importances_
}).sort_values('importance', ascending=False)

print(importance.head(20))
```

## 📈 Feature Statistics

### Current Dataset

| Metric | Value |
|--------|-------|
| Total Rows | 87,540 |
| Total Features | 137 |
| Symbols | 2 (BTCUSD, ETHUSD) |
| Timeframes | 1 (1h) |
| File Size | 43.18 MB |
| Format | Parquet (compressed) |

### Feature Distribution

| Group | Count |
|-------|-------|
| Trend | 19 |
| Momentum | 19 |
| Volatility | 15 |
| Market Structure | 15 |
| Candle | 18 |
| Time | 10 |
| Liquidity | 10 |
| Metadata | 3 (timestamp, symbol, timeframe) |

## 🎓 Feature Engineering Best Practices

### 1. Normalization
All numeric features are normalized using StandardScaler:
- Mean = 0
- Std = 1
- Handles outliers better than MinMax

### 2. No Data Leakage
- All features use only past data
- No future information
- Proper forward-fill for missing values

### 3. Modular Design
- Each feature group in separate module
- Easy to add/remove features
- Reusable components

### 4. Efficient Processing
- Vectorized operations (pandas/numpy)
- Minimal loops
- Parquet compression

## 🔍 Feature Selection Tips

### High-Value Features
Based on typical importance:
1. **Trend**: EMA distances, trend score
2. **Momentum**: RSI, MACD histogram
3. **Volatility**: ATR %, BB position
4. **Structure**: BOS, swing distances
5. **Candle**: Body/range ratio, patterns
6. **Time**: Session overlaps, hour
7. **Liquidity**: Stop hunts, order blocks

### Feature Reduction
If you need fewer features:

```python
from sklearn.feature_selection import SelectKBest, f_classif

# Select top 50 features
selector = SelectKBest(f_classif, k=50)
X_selected = selector.fit_transform(X, y)

# Get selected feature names
selected_features = [feature_cols[i] for i in selector.get_support(indices=True)]
print(selected_features)
```

## 🚨 Troubleshooting

### Issue: Memory Error
**Solution**: Process fewer symbols/timeframes at once

### Issue: Slow Processing
**Solution**: Use `quick_feature_pipeline.py` instead of full pipeline

### Issue: NaN Values
**Solution**: Features are automatically cleaned (dropna), but check input data quality

### Issue: Feature Scaling
**Solution**: Features are pre-normalized, but you can re-scale if needed

## 📚 Next Steps

1. **Add Labels**: Create target variables for supervised learning
2. **Feature Selection**: Identify most important features
3. **Model Training**: Train ML models on features
4. **Backtesting**: Test strategies using features
5. **Live Trading**: Deploy with real-time feature calculation

## 🎯 Complete Feature List

All 137 features are listed in the pipeline output. Key highlights:

**Trend**: ema_20, ema_50, ema_200, ema_*_slope, ema_*_distance, trend_score
**Momentum**: rsi, rsi_slope, macd, macd_histogram, roc, momentum_*, stoch_k
**Volatility**: atr, atr_pct, bb_width, bb_position, std_dev, hist_volatility
**Structure**: higher_high, lower_low, bos_*, swing_*, trend_strength
**Candle**: body_size, *_wick, hammer, engulfing, pinbar_*, consecutive_*
**Time**: hour_sin/cos, day_sin/cos, session_*, overlap_*
**Liquidity**: equal_*, stop_hunt_*, sweep_*, fvg_*, order_block_*

---

**Ready for model training!** 🚀
