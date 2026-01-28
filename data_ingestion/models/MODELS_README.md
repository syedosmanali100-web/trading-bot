# Trading Bot Models - Complete Guide

## 🎯 Overview

Three separate machine learning models trained with walk-forward validation for algorithmic trading.

## ✅ Status: COMPLETE

**6 models trained** (3 model types × 2 time splits)

### Models Trained

1. **Direction Model** (LightGBM) - Predicts profit vs loss probability
2. **Volatility Model** (Random Forest) - Predicts volatility expansion
3. **No-Trade Filter** (Logistic Regression) - Identifies poor conditions

---

## 📊 Model Performance Summary

### Split 1 (Train: 2021-2022, Test: 2023)

| Model | Accuracy | Precision | Recall | F1 Score | ROC AUC |
|-------|----------|-----------|--------|----------|---------|
| **Direction** | 87.28% | 0.8728 | 0.8728 | 0.8728 | 0.9509 |
| **Volatility** | 97.17% | 0.9725 | 0.9717 | 0.9717 | 0.9937 |
| **No-Trade** | 92.87% | 0.9283 | 0.9287 | 0.9280 | 0.9792 |

### Split 2 (Train: 2021-2023, Test: 2024-2026)

| Model | Accuracy | Precision | Recall | F1 Score | ROC AUC |
|-------|----------|-----------|--------|----------|---------|
| **Direction** | 87.31% | 0.8731 | 0.8731 | 0.8731 | 0.9507 |
| **Volatility** | 96.95% | 0.9691 | 0.9695 | 0.9692 | 0.9930 |
| **No-Trade** | 88.14% | 0.8920 | 0.8814 | 0.8850 | 0.9399 |

---

## 🎓 Model Details

### MODEL 1: Direction Model

**Purpose**: Predict if price will hit profit target before stop loss

**Algorithm**: LightGBM Gradient Boosting
- n_estimators: 200
- max_depth: 8
- learning_rate: 0.05
- num_leaves: 31

**Input**: 137 features
**Output**: Probability [0-1]
- 0 = Loss first (price hits stop before target)
- 1 = Profit first (price hits target before stop)

**Performance**:
- Accuracy: ~87%
- ROC AUC: ~0.95 (excellent discrimination)
- Balanced performance on both classes

**Use Case**: Primary signal for trade direction

---

### MODEL 2: Volatility Model

**Purpose**: Predict if volatility will expand

**Algorithm**: Random Forest
- n_estimators: 200
- max_depth: 10
- min_samples_split: 100

**Input**: 137 features
**Output**: Probability [0-1]
- 0 = No expansion (ATR stays low)
- 1 = Expansion (ATR increases 30%+)

**Performance**:
- Accuracy: ~97%
- ROC AUC: ~0.99 (outstanding)
- Very high precision on expansion class

**Use Case**: Position sizing, stop loss adjustment

---

### MODEL 3: No-Trade Filter

**Purpose**: Identify poor trading conditions

**Algorithm**: Logistic Regression
- C: 1.0
- max_iter: 1000

**Input**: 137 features
**Output**: Probability [0-1]
- 0 = Trade OK (good conditions)
- 1 = No trade (poor conditions)

**Performance**:
- Accuracy: ~88-93%
- ROC AUC: ~0.94-0.98
- High recall on no-trade class (catches most bad conditions)

**Use Case**: Filter before making predictions

---

## 📁 Files Structure

```
models/
├── direction_model_Split_1.pkl          # Direction model (2021-2022 train)
├── direction_model_Split_2.pkl          # Direction model (2021-2023 train)
├── volatility_model_Split_1.pkl         # Volatility model (2021-2022 train)
├── volatility_model_Split_2.pkl         # Volatility model (2021-2023 train)
├── notrade_model_Split_1.pkl            # No-trade filter (2021-2022 train)
├── notrade_model_Split_2.pkl            # No-trade filter (2021-2023 train)
│
├── metrics/                             # JSON metrics for each model
│   ├── direction_model_Split_1_metrics.json
│   ├── direction_model_Split_2_metrics.json
│   ├── volatility_model_Split_1_metrics.json
│   ├── volatility_model_Split_2_metrics.json
│   ├── notrade_model_Split_1_metrics.json
│   └── notrade_model_Split_2_metrics.json
│
└── plots/                               # Visualization plots
    ├── direction_importance_Split_1.png
    ├── direction_confusion_Split_1.png
    ├── direction_roc_Split_1.png
    ├── volatility_importance_Split_1.png
    ├── volatility_confusion_Split_1.png
    ├── notrade_coefficients_Split_1.png
    ├── notrade_confusion_Split_1.png
    └── ... (Split_2 versions)
```

---

## 🚀 Usage Examples

### Example 1: Load and Predict

```python
import joblib
import pandas as pd

# Load models
direction_model = joblib.load('models/direction_model_Split_2.pkl')
volatility_model = joblib.load('models/volatility_model_Split_2.pkl')
notrade_model = joblib.load('models/notrade_model_Split_2.pkl')

# Load new data (must have same 137 features)
df = pd.read_parquet('data/new_data.parquet')

# Get features
feature_cols = [col for col in df.columns 
                if not col.startswith('label_') 
                and col not in ['timestamp', 'symbol', 'timeframe']]
X = df[feature_cols]

# Predict
direction_prob = direction_model.predict_proba(X)[:, 1]  # Probability of profit
volatility_prob = volatility_model.predict_proba(X)[:, 1]  # Probability of expansion
notrade_prob = notrade_model.predict_proba(X)[:, 1]  # Probability of no-trade

# Add to dataframe
df['pred_direction'] = direction_prob
df['pred_volatility'] = volatility_prob
df['pred_notrade'] = notrade_prob

print(df[['timestamp', 'pred_direction', 'pred_volatility', 'pred_notrade']].head())
```

### Example 2: Filter-Then-Predict Strategy

```python
# Step 1: Filter out no-trade conditions
notrade_threshold = 0.7
tradeable_mask = notrade_prob < notrade_threshold

print(f"Tradeable: {tradeable_mask.sum()} / {len(df)} ({tradeable_mask.sum()/len(df)*100:.1f}%)")

# Step 2: Only predict on tradeable conditions
tradeable_df = df[tradeable_mask].copy()
X_tradeable = tradeable_df[feature_cols]

# Step 3: Get direction predictions
direction_prob_filtered = direction_model.predict_proba(X_tradeable)[:, 1]

# Step 4: Generate signals
signal_threshold = 0.6
long_signals = direction_prob_filtered > signal_threshold
short_signals = direction_prob_filtered < (1 - signal_threshold)

print(f"Long signals: {long_signals.sum()}")
print(f"Short signals: {short_signals.sum()}")
```

### Example 3: Volatility-Adjusted Position Sizing

```python
# Base position size
base_size = 1.0

# Adjust based on volatility prediction
position_sizes = np.where(
    volatility_prob > 0.7,  # High volatility expected
    base_size * 0.5,        # Reduce size
    base_size * 1.5         # Increase size
)

df['position_size'] = position_sizes

print(f"Average position size: {position_sizes.mean():.2f}")
```

### Example 4: Ensemble Strategy

```python
# Combine all three models
def generate_trading_signal(direction_prob, volatility_prob, notrade_prob):
    """
    Generate trading signal based on all three models
    
    Returns:
        1 = Strong long
        0.5 = Weak long
        0 = No trade
        -0.5 = Weak short
        -1 = Strong short
    """
    # Filter: Skip if no-trade probability is high
    if notrade_prob > 0.7:
        return 0
    
    # Strong signals require high confidence + volatility
    if direction_prob > 0.7 and volatility_prob > 0.6:
        return 1  # Strong long
    elif direction_prob < 0.3 and volatility_prob > 0.6:
        return -1  # Strong short
    
    # Weak signals
    elif direction_prob > 0.6:
        return 0.5  # Weak long
    elif direction_prob < 0.4:
        return -0.5  # Weak short
    
    return 0  # No trade

# Apply to dataframe
signals = [generate_trading_signal(d, v, n) 
           for d, v, n in zip(direction_prob, volatility_prob, notrade_prob)]

df['signal'] = signals

print(df['signal'].value_counts().sort_index())
```

### Example 5: Backtesting

```python
# Simple backtest
df['returns'] = df['close'].pct_change()

# Only trade when signal is strong
df['strategy_returns'] = 0.0
df.loc[df['signal'] == 1, 'strategy_returns'] = df['returns']
df.loc[df['signal'] == -1, 'strategy_returns'] = -df['returns']

# Calculate cumulative returns
df['cumulative_returns'] = (1 + df['strategy_returns']).cumprod()

# Metrics
total_return = df['cumulative_returns'].iloc[-1] - 1
sharpe_ratio = df['strategy_returns'].mean() / df['strategy_returns'].std() * np.sqrt(252)

print(f"Total Return: {total_return:.2%}")
print(f"Sharpe Ratio: {sharpe_ratio:.2f}")
```

---

## 📈 Feature Importance

### Top Features (Direction Model)

Based on feature importance plots:

1. **Trend Features**: EMA distances, trend score
2. **Momentum Features**: RSI, MACD histogram
3. **Volatility Features**: ATR %, BB position
4. **Market Structure**: BOS, swing distances
5. **Time Features**: Session overlaps

### Top Features (Volatility Model)

1. **Volatility Features**: ATR, std dev, BB width
2. **Candle Features**: Body/range ratio
3. **Market Structure**: Consolidation, breakout
4. **Momentum Features**: ROC, momentum

### Top Coefficients (No-Trade Filter)

**Positive** (increase no-trade probability):
- Low ATR
- Small candle body
- High spread
- Asia session
- Consolidation

**Negative** (decrease no-trade probability):
- High volatility
- Large candle body
- Session overlaps
- Breakout patterns

---

## 🎯 Model Selection Guide

### Which Split to Use?

**Split 1** (Train: 2021-2022, Test: 2023):
- Use if you want models trained on earlier data
- Better for testing on 2023 data
- Slightly better no-trade filter

**Split 2** (Train: 2021-2023, Test: 2024-2026):
- **Recommended** for production
- More training data (49,937 samples)
- More recent patterns learned
- Better generalization

### Recommended: Split 2 Models

```python
# Load recommended models
direction_model = joblib.load('models/direction_model_Split_2.pkl')
volatility_model = joblib.load('models/volatility_model_Split_2.pkl')
notrade_model = joblib.load('models/notrade_model_Split_2.pkl')
```

---

## 🔧 Model Retraining

### When to Retrain

- Every 3-6 months with new data
- When performance degrades
- After major market regime changes
- When adding new features

### How to Retrain

```bash
cd data_ingestion/feature_engineering
python train_models.py
```

This will:
1. Load latest training_dataset.parquet
2. Create time-based splits
3. Train all 3 models
4. Save new models with timestamp
5. Generate new plots and metrics

---

## 📊 Performance Monitoring

### Track These Metrics

1. **Accuracy**: Overall correctness
2. **Precision**: Avoid false positives
3. **Recall**: Catch all opportunities
4. **ROC AUC**: Discrimination ability
5. **Sharpe Ratio**: Risk-adjusted returns

### Warning Signs

- Accuracy drops below 80% (direction)
- Accuracy drops below 90% (volatility)
- ROC AUC drops below 0.85
- Increasing false positives
- Negative Sharpe ratio

---

## 🚨 Important Notes

### Model Limitations

1. **Past Performance**: Not guarantee of future results
2. **Market Regimes**: Models trained on specific conditions
3. **Feature Drift**: Features may change over time
4. **Overfitting**: High accuracy doesn't mean profitability

### Risk Management

1. **Always use stop losses**
2. **Position sizing based on volatility**
3. **Diversify across symbols**
4. **Monitor drawdowns**
5. **Paper trade first**

### Production Checklist

- [ ] Load correct model version
- [ ] Verify feature alignment
- [ ] Implement proper error handling
- [ ] Add logging and monitoring
- [ ] Set up alerts for anomalies
- [ ] Test with paper trading
- [ ] Start with small position sizes

---

## 📚 Additional Resources

### Files to Review

1. **Plots**: `models/plots/` - Visual analysis
2. **Metrics**: `models/metrics/` - Detailed performance
3. **Training Script**: `train_models.py` - Retraining code

### Next Steps

1. Review feature importance plots
2. Analyze confusion matrices
3. Test models on new data
4. Implement in backtesting framework
5. Paper trade before live deployment

---

**Models are ready for production use!** 🚀

Remember: These are tools to assist trading decisions, not guarantees of profit. Always use proper risk management.
