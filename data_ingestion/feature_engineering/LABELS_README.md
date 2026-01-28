# Smart Label Creation for Trading Model

## 🎯 Overview

A sophisticated labeling system that goes beyond simple up/down prediction to create actionable, balanced labels for supervised learning.

## ✅ Status: COMPLETE

**Output**: `data/training_dataset.parquet` (85,488 rows, 137 features + 3 labels, 42.91 MB)

## 📊 Three Smart Labels

### LABEL 1: Direction Probability (`label_direction`)

**Purpose**: Predict if price will hit profit target before stop loss

**Logic**:
- Look forward 10 candles
- Track cumulative price movement
- If price moves +1.5% before -1.0% → **Label = 1** (Profit first)
- If price moves -1.0% before +1.5% → **Label = 0** (Loss first)
- If neither target hit → **Label = -1** (No clear move - removed in balancing)

**Why it's smart**:
- Not just "next candle up/down"
- Considers risk/reward ratio (1.5:1)
- Filters out choppy, unclear moves
- Actionable for actual trading

**Distribution** (balanced):
- Profit first (1): 42,744 (50.0%)
- Loss first (0): 42,744 (50.0%)

### LABEL 2: Volatility Expansion (`label_volatility`)

**Purpose**: Predict if volatility will increase

**Logic**:
- Calculate average ATR over next 10 candles
- If future ATR > 1.3 × current ATR → **Label = 1** (Expansion)
- Else → **Label = 0** (No expansion)

**Why it's smart**:
- Helps identify breakout opportunities
- Useful for position sizing
- Complements direction prediction
- Volatility expansion often precedes strong moves

**Distribution**:
- Expansion (1): 65,778 (76.9%)
- No expansion (0): 19,710 (23.1%)

### LABEL 3: No-Trade Filter (`label_no_trade`)

**Purpose**: Identify when NOT to trade

**Logic**: Label = 1 if ANY of these conditions:
1. **Asia session** (low liquidity)
2. **Low ATR** (< 20th percentile)
3. **Small candle body** (< 30% of range)
4. **High spread** (> 80th percentile)
5. **Range compression** (consolidation flag)

**Why it's smart**:
- Prevents trading in poor conditions
- Reduces false signals
- Improves win rate by avoiding bad setups
- Can be used as a filter before predictions

**Distribution**:
- No trade (1): 64,133 (75.0%)
- Trade OK (0): 21,355 (25.0%)

## 🔧 Configuration

Edit parameters in `create_labels.py`:

```python
labeler = SmartLabeler(
    lookforward_candles=10,      # How far to look ahead
    profit_pips=0.015,           # 1.5% profit target
    loss_pips=0.010,             # 1.0% stop loss
    volatility_threshold=1.3,    # 30% ATR increase
    atr_low_percentile=20,       # Bottom 20% ATR
    body_ratio_threshold=0.3,    # 30% body/range
    spread_high_percentile=80    # Top 20% spread
)
```

## 📈 Label Statistics

### Final Dataset
- **Total Rows**: 85,488
- **Features**: 137
- **Labels**: 3
- **File Size**: 42.91 MB
- **Format**: Parquet (compressed)

### Class Balance
- **Direction**: Perfectly balanced (50/50)
- **Volatility**: Imbalanced (77% expansion) - reflects market reality
- **No-Trade**: Imbalanced (75% no-trade) - reflects that most conditions aren't ideal

### Label Combinations
- Direction=1 & Volatility=1: 33,248 (best setups)
- Direction=1 & NoTrade=0: 10,542 (tradeable bullish)
- Direction=0 & Volatility=1: 32,530 (volatile bearish)

## 🚀 Usage

### Create Labels

```bash
cd data_ingestion/feature_engineering
python create_labels.py
```

### Load Training Data

```python
import pandas as pd

# Load complete training dataset
df = pd.read_parquet('data/training_dataset.parquet')

# Separate features and labels
feature_cols = [col for col in df.columns 
                if not col.startswith('label_') 
                and col not in ['timestamp', 'symbol', 'timeframe']]

X = df[feature_cols]
y_direction = df['label_direction']
y_volatility = df['label_volatility']
y_notrade = df['label_no_trade']

print(f"Features: {X.shape}")
print(f"Direction labels: {y_direction.value_counts()}")
```

## 💻 Training Examples

### Example 1: Direction Prediction

```python
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

# Load data
df = pd.read_parquet('data/training_dataset.parquet')

# Prepare features and labels
feature_cols = [col for col in df.columns 
                if not col.startswith('label_') 
                and col not in ['timestamp', 'symbol', 'timeframe']]
X = df[feature_cols]
y = df['label_direction']

# Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Train
model = RandomForestClassifier(
    n_estimators=200,
    max_depth=10,
    min_samples_split=100,
    random_state=42
)
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
print(f"Accuracy: {accuracy_score(y_test, y_pred):.2%}")
print(classification_report(y_test, y_pred))
```

### Example 2: Multi-Output Model

```python
from sklearn.multioutput import MultiOutputClassifier
from sklearn.ensemble import GradientBoostingClassifier

# Prepare multi-output labels
y_multi = df[['label_direction', 'label_volatility', 'label_no_trade']]

# Train multi-output model
base_model = GradientBoostingClassifier(n_estimators=100)
multi_model = MultiOutputClassifier(base_model)

X_train, X_test, y_train, y_test = train_test_split(
    X, y_multi, test_size=0.2, random_state=42
)

multi_model.fit(X_train, y_train)
y_pred = multi_model.predict(X_test)

# Evaluate each output
for i, label in enumerate(['direction', 'volatility', 'no_trade']):
    acc = accuracy_score(y_test.iloc[:, i], y_pred[:, i])
    print(f"{label}: {acc:.2%}")
```

### Example 3: Filter-Then-Predict Strategy

```python
# First, filter out no-trade conditions
tradeable = df[df['label_no_trade'] == 0].copy()

print(f"Original: {len(df):,} rows")
print(f"Tradeable: {len(tradeable):,} rows ({len(tradeable)/len(df)*100:.1f}%)")

# Then train direction model only on tradeable conditions
X_tradeable = tradeable[feature_cols]
y_tradeable = tradeable['label_direction']

# This model will be more accurate because it only sees good setups
model = RandomForestClassifier(n_estimators=200)
model.fit(X_tradeable, y_tradeable)
```

### Example 4: Volatility-Aware Position Sizing

```python
# Use volatility label for position sizing
df['position_size'] = 1.0  # Base size

# Reduce size during low volatility
df.loc[df['label_volatility'] == 0, 'position_size'] = 0.5

# Increase size during high volatility + clear direction
high_vol_clear = (df['label_volatility'] == 1) & (df['label_direction'] == 1)
df.loc[high_vol_clear, 'position_size'] = 1.5

print(df['position_size'].value_counts())
```

## 🎓 Advanced Strategies

### Strategy 1: Ensemble with Filters

```python
# Train separate models
direction_model = RandomForestClassifier()
volatility_model = RandomForestClassifier()
notrade_model = RandomForestClassifier()

# Predict
pred_direction = direction_model.predict_proba(X_test)[:, 1]
pred_volatility = volatility_model.predict_proba(X_test)[:, 1]
pred_notrade = notrade_model.predict_proba(X_test)[:, 1]

# Combined signal
signal = (
    (pred_direction > 0.6) &      # High confidence direction
    (pred_volatility > 0.5) &     # Expect volatility
    (pred_notrade < 0.3)          # Low no-trade probability
)

print(f"Signals: {signal.sum()} / {len(signal)} ({signal.sum()/len(signal)*100:.1f}%)")
```

### Strategy 2: Risk-Adjusted Predictions

```python
# Adjust predictions based on risk
df['risk_score'] = (
    df['label_volatility'] * 0.3 +      # Volatility risk
    df['label_no_trade'] * 0.5 +        # Condition risk
    (1 - df['label_direction']) * 0.2   # Direction risk
)

# Only trade when risk is acceptable
low_risk = df[df['risk_score'] < 0.5]
print(f"Low risk opportunities: {len(low_risk):,}")
```

## 🔍 Label Quality Metrics

### Direction Label Quality
- **Balance**: Perfect 50/50 split
- **Clarity**: 99.99% clear moves (only 10 unclear removed)
- **Risk/Reward**: 1.5:1 ratio built-in
- **Actionable**: Directly maps to trading decisions

### Volatility Label Quality
- **Predictive**: 30% expansion threshold is significant
- **Useful**: Helps with position sizing and stop placement
- **Realistic**: 77% expansion rate reflects market dynamics

### No-Trade Label Quality
- **Conservative**: 75% no-trade reflects high standards
- **Multi-factor**: Combines 5 different conditions
- **Protective**: Filters out most poor setups

## 📊 Label Correlation

```python
# Check label correlations
label_cols = ['label_direction', 'label_volatility', 'label_no_trade']
corr = df[label_cols].corr()
print(corr)

# Expected:
# - Direction & Volatility: Moderate positive (volatile moves are clearer)
# - Direction & NoTrade: Negative (no-trade filters out unclear moves)
# - Volatility & NoTrade: Negative (low volatility triggers no-trade)
```

## 🚨 Important Notes

### Look-Ahead Bias Prevention
- Last 10 rows dropped from dataset
- All labels use only future data (not current)
- No information leakage

### Class Imbalance Handling
- **Direction**: Balanced via undersampling
- **Volatility**: Kept imbalanced (reflects reality)
- **No-Trade**: Kept imbalanced (informative)

### Label Limitations
- **Direction**: Assumes 1.5% and 1.0% thresholds work for all symbols
- **Volatility**: 30% expansion may be too aggressive for some markets
- **No-Trade**: Asia session filter may not apply to all symbols

## 🎯 Next Steps

1. **Train Models**: Use the three labels to train separate or multi-output models
2. **Backtest**: Test predictions on historical data
3. **Optimize**: Tune label parameters for your specific strategy
4. **Deploy**: Use models in live trading with proper risk management

## 📚 Files

- `create_labels.py` - Label creation script
- `data/training_dataset.parquet` - Final dataset with labels
- `LABELS_README.md` - This file

---

**Ready for model training!** 🚀

Your dataset now has:
- ✅ 137 engineered features
- ✅ 3 smart labels
- ✅ 85,488 balanced samples
- ✅ No look-ahead bias
- ✅ Production-ready format
