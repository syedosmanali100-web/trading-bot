"""
Example: Using ingested data for trading bot training
"""
import pandas as pd
import numpy as np
from pathlib import Path

print("="*80)
print("TRADING BOT TRAINING - EXAMPLE")
print("="*80)

# 1. Load data
print("\n[1] Loading historical data...")
df = pd.read_parquet('data/BTCUSD_1h.parquet')
print(f"✓ Loaded {len(df):,} rows of BTCUSD 1h data")
print(f"  Date range: {df['timestamp'].min()} to {df['timestamp'].max()}")

# 2. Feature engineering
print("\n[2] Engineering features...")

# Price-based features
df['returns'] = df['close'].pct_change()
df['log_returns'] = np.log(df['close'] / df['close'].shift(1))

# Moving averages
df['sma_20'] = df['close'].rolling(20).mean()
df['sma_50'] = df['close'].rolling(50).mean()
df['sma_200'] = df['close'].rolling(200).mean()

# Exponential moving averages
df['ema_12'] = df['close'].ewm(span=12).mean()
df['ema_26'] = df['close'].ewm(span=26).mean()

# MACD
df['macd'] = df['ema_12'] - df['ema_26']
df['macd_signal'] = df['macd'].ewm(span=9).mean()
df['macd_diff'] = df['macd'] - df['macd_signal']

# RSI
def calculate_rsi(data, periods=14):
    delta = data.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=periods).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=periods).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs))

df['rsi'] = calculate_rsi(df['close'])

# Bollinger Bands
df['bb_middle'] = df['close'].rolling(20).mean()
df['bb_std'] = df['close'].rolling(20).std()
df['bb_upper'] = df['bb_middle'] + (df['bb_std'] * 2)
df['bb_lower'] = df['bb_middle'] - (df['bb_std'] * 2)
df['bb_width'] = (df['bb_upper'] - df['bb_lower']) / df['bb_middle']

# Volatility
df['volatility'] = df['returns'].rolling(20).std()
df['atr'] = df['high'].rolling(14).max() - df['low'].rolling(14).min()

# Volume features
df['volume_sma'] = df['volume'].rolling(20).mean()
df['volume_ratio'] = df['volume'] / df['volume_sma']

# Price momentum
df['momentum_5'] = df['close'] - df['close'].shift(5)
df['momentum_10'] = df['close'] - df['close'].shift(10)
df['momentum_20'] = df['close'] - df['close'].shift(20)

# Trend indicators
df['trend_sma'] = (df['sma_20'] > df['sma_50']).astype(int)
df['price_above_sma20'] = (df['close'] > df['sma_20']).astype(int)

print(f"✓ Created {len(df.columns)} features")

# 3. Create target variable (predict next hour's direction)
print("\n[3] Creating target variable...")
df['target'] = (df['close'].shift(-1) > df['close']).astype(int)  # 1 = up, 0 = down
df['target_return'] = df['close'].shift(-1) / df['close'] - 1

print(f"✓ Target distribution:")
print(f"  Up moves: {(df['target'] == 1).sum():,} ({(df['target'] == 1).sum() / len(df) * 100:.1f}%)")
print(f"  Down moves: {(df['target'] == 0).sum():,} ({(df['target'] == 0).sum() / len(df) * 100:.1f}%)")

# 4. Clean data
print("\n[4] Cleaning data...")
df_clean = df.dropna()
print(f"✓ Removed {len(df) - len(df_clean):,} rows with NaN values")
print(f"✓ Final dataset: {len(df_clean):,} rows")

# 5. Train/validation/test split
print("\n[5] Splitting data...")
train_size = int(len(df_clean) * 0.7)
val_size = int(len(df_clean) * 0.15)

train_df = df_clean[:train_size]
val_df = df_clean[train_size:train_size + val_size]
test_df = df_clean[train_size + val_size:]

print(f"✓ Training set: {len(train_df):,} rows ({len(train_df)/len(df_clean)*100:.1f}%)")
print(f"  Date: {train_df['timestamp'].min()} to {train_df['timestamp'].max()}")
print(f"✓ Validation set: {len(val_df):,} rows ({len(val_df)/len(df_clean)*100:.1f}%)")
print(f"  Date: {val_df['timestamp'].min()} to {val_df['timestamp'].max()}")
print(f"✓ Test set: {len(test_df):,} rows ({len(test_df)/len(df_clean)*100:.1f}%)")
print(f"  Date: {test_df['timestamp'].min()} to {test_df['timestamp'].max()}")

# 6. Feature selection
print("\n[6] Selecting features for model...")
feature_columns = [
    'returns', 'log_returns',
    'sma_20', 'sma_50', 'sma_200',
    'ema_12', 'ema_26',
    'macd', 'macd_signal', 'macd_diff',
    'rsi',
    'bb_width',
    'volatility', 'atr',
    'volume_ratio',
    'momentum_5', 'momentum_10', 'momentum_20',
    'trend_sma', 'price_above_sma20',
    'spread'
]

X_train = train_df[feature_columns]
y_train = train_df['target']

X_val = val_df[feature_columns]
y_val = val_df['target']

X_test = test_df[feature_columns]
y_test = test_df['target']

print(f"✓ Selected {len(feature_columns)} features:")
for i, feat in enumerate(feature_columns, 1):
    print(f"  {i:2d}. {feat}")

# 7. Feature statistics
print("\n[7] Feature statistics (training set):")
print(X_train.describe().round(4))

# 8. Save processed data
print("\n[8] Saving processed data...")
train_df.to_parquet('data/BTCUSD_1h_train.parquet', index=False)
val_df.to_parquet('data/BTCUSD_1h_val.parquet', index=False)
test_df.to_parquet('data/BTCUSD_1h_test.parquet', index=False)
print("✓ Saved train/val/test datasets")

# Summary
print("\n" + "="*80)
print("DATA PREPARATION COMPLETE!")
print("="*80)
print("\nNext steps:")
print("  1. Train a model (Random Forest, XGBoost, Neural Network)")
print("  2. Evaluate on validation set")
print("  3. Optimize hyperparameters")
print("  4. Test on test set")
print("  5. Backtest strategy")
print("  6. Deploy to live trading")
print("\nExample model training:")
print("""
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# Train model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Predict
y_pred = model.predict(X_val)

# Evaluate
accuracy = accuracy_score(y_val, y_pred)
print(f"Validation Accuracy: {accuracy:.2%}")
print(classification_report(y_val, y_pred))
""")
print("="*80)
