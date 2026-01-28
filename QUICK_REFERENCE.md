# 📋 Data Ingestion System - Quick Reference

## 🚀 One-Line Commands

```bash
# View all data files
cd data_ingestion && python view_data.py

# View specific data
python view_data.py BTCUSD 1h

# Validate system
python validate_system.py

# Generate more data
python quick_sample_data.py

# Run training example
python example_bot_training.py
```

## 💻 Code Snippets

### Load Data
```python
import pandas as pd
df = pd.read_parquet('data/BTCUSD_1h.parquet')
```

### Load Multiple Timeframes
```python
btc_1h = pd.read_parquet('data/BTCUSD_1h.parquet')
btc_4h = pd.read_parquet('data/BTCUSD_4h.parquet')
```

### Load Preprocessed Data
```python
train = pd.read_parquet('data/BTCUSD_1h_train.parquet')
val = pd.read_parquet('data/BTCUSD_1h_val.parquet')
test = pd.read_parquet('data/BTCUSD_1h_test.parquet')
```

### Basic Analysis
```python
print(f"Rows: {len(df):,}")
print(f"Date: {df['timestamp'].min()} to {df['timestamp'].max()}")
print(df.describe())
```

## 📊 Available Data

| Symbol | Timeframes | Total Rows | Size |
|--------|-----------|------------|------|
| EURUSD | 1m, 5m, 15m, 1h, 4h | 3,383,550 | 79.5 MB |
| GBPUSD | 1m, 5m, 15m, 1h, 4h | 3,383,550 | 87.7 MB |
| BTCUSD | 15m, 1h, 4h | 45,990 | 2.7 MB |
| ETHUSD | 15m, 1h, 4h | 45,990 | 2.7 MB |

**Total: 6,675,120 rows, 174.5 MB**

## 🎯 Common Tasks

### Train a Model
```python
from sklearn.ensemble import RandomForestClassifier

# Load preprocessed data
train = pd.read_parquet('data/BTCUSD_1h_train.parquet')

# Features and target
features = ['returns', 'rsi', 'macd', 'volatility', 'volume_ratio']
X = train[features]
y = train['target']

# Train
model = RandomForestClassifier(n_estimators=100)
model.fit(X, y)
```

### Calculate RSI
```python
def calculate_rsi(data, periods=14):
    delta = data.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=periods).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=periods).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs))

df['rsi'] = calculate_rsi(df['close'])
```

### Calculate MACD
```python
df['ema_12'] = df['close'].ewm(span=12).mean()
df['ema_26'] = df['close'].ewm(span=26).mean()
df['macd'] = df['ema_12'] - df['ema_26']
df['macd_signal'] = df['macd'].ewm(span=9).mean()
```

### Backtest Strategy
```python
# Simple moving average crossover
df['sma_20'] = df['close'].rolling(20).mean()
df['sma_50'] = df['close'].rolling(50).mean()
df['signal'] = (df['sma_20'] > df['sma_50']).astype(int)
df['returns'] = df['close'].pct_change()
df['strategy_returns'] = df['signal'].shift(1) * df['returns']

# Calculate metrics
total_return = (1 + df['strategy_returns']).prod() - 1
sharpe_ratio = df['strategy_returns'].mean() / df['strategy_returns'].std() * np.sqrt(252)

print(f"Total Return: {total_return:.2%}")
print(f"Sharpe Ratio: {sharpe_ratio:.2f}")
```

## 📁 File Locations

```
data/                           # All data files
data_ingestion/                 # System code
logs/                           # Log files
DATA_INGESTION_GUIDE.md         # Full documentation
DATA_INGESTION_SUMMARY.md       # Summary
QUICK_REFERENCE.md              # This file
```

## 🔧 Configuration

Edit `data_ingestion/config.py`:
```python
SYMBOLS = ['EURUSD', 'BTCUSD', 'ETHUSD']  # Add/remove symbols
TIMEFRAMES = {'1h': 60, '4h': 240}         # Add/remove timeframes
START_DATE = END_DATE - timedelta(days=365) # Change date range
OUTPUT_FORMAT = 'parquet'                   # or 'csv'
```

## ✅ Validation Checks

```bash
python validate_system.py
```

Checks:
- ✓ Data folder exists
- ✓ Files present
- ✓ Schema valid
- ✓ No nulls
- ✓ Valid OHLC
- ✓ No duplicates
- ✓ Positive prices

## 🎓 Learning Resources

**Example Scripts:**
- `example_bot_training.py` - Complete training pipeline
- `view_data.py` - Data exploration
- `validate_system.py` - Quality checks

**Documentation:**
- `DATA_INGESTION_GUIDE.md` - Full guide
- `DATA_INGESTION_SUMMARY.md` - Overview
- `data_ingestion/README.md` - Technical docs

## 🚨 Troubleshooting

**Issue: File not found**
```bash
# Check if data exists
cd data_ingestion && python view_data.py
```

**Issue: Memory error**
```python
# Load in chunks
for chunk in pd.read_parquet('data/EURUSD_1m.parquet', chunksize=100000):
    process(chunk)
```

**Issue: Need more data**
```bash
# Generate more
cd data_ingestion && python quick_sample_data.py
```

## 📞 Quick Help

```bash
# List all commands
cd data_ingestion
ls *.py

# Run any script
python <script_name>.py

# View script help
python <script_name>.py --help
```

---

**Ready to build your trading bot? Start with:**
```bash
cd data_ingestion
python example_bot_training.py
```
