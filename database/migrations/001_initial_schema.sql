-- Create users table with Deriv integration
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  subscription_end TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Deriv integration fields
  deriv_account_id TEXT UNIQUE,
  deriv_token TEXT,
  deriv_token_encrypted TEXT,
  is_deriv_user BOOLEAN DEFAULT FALSE,
  referral_code TEXT,
  
  -- Additional metadata
  last_login TIMESTAMP,
  account_balance DECIMAL(10,2) DEFAULT 0,
  total_trades INTEGER DEFAULT 0
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_deriv_account ON users(deriv_account_id);
CREATE INDEX IF NOT EXISTS idx_users_referral ON users(referral_code);

-- Create trading_sessions table to track Deriv API usage
CREATE TABLE IF NOT EXISTS trading_sessions (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  deriv_token TEXT,
  session_start TIMESTAMP DEFAULT NOW(),
  session_end TIMESTAMP,
  total_trades INTEGER DEFAULT 0,
  profit_loss DECIMAL(10,2) DEFAULT 0
);

-- Create deriv_trades table to log all trades
CREATE TABLE IF NOT EXISTS deriv_trades (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  contract_id TEXT,
  asset TEXT NOT NULL,
  trade_type TEXT NOT NULL,
  stake DECIMAL(10,2) NOT NULL,
  payout DECIMAL(10,2),
  entry_price DECIMAL(10,6),
  exit_price DECIMAL(10,6),
  profit_loss DECIMAL(10,2),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP
);

-- Insert default admin user
INSERT INTO users (id, username, password, is_admin, is_active, subscription_end, created_at)
VALUES (
  'admin-001',
  'admin@nexus.com',
  'admin123',
  TRUE,
  TRUE,
  '2099-12-31 00:00:00',
  NOW()
) ON CONFLICT (id) DO NOTHING;
