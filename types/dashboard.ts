/**
 * Core TypeScript interfaces and types for Trading Bot Dashboard
 * These types define the data structures used throughout the application
 */

// User and Authentication Types
export interface UserData {
  id: string
  username: string
  is_admin: boolean
  is_active: boolean
  subscription_end: string
  deriv_account_id?: string
  deriv_token?: string
  is_deriv_user: boolean
}

// Deriv Connection Types
export interface DerivConnection {
  isConnected: boolean
  accountId: string
  balance: number
  currency: string
}

export interface DerivBalance {
  balance: number
  currency: string
  display_balance: string
}

// Asset and Market Types
export interface AssetPair {
  symbol: string
  display_name: string
  market: string
  submarket: string
  pip: number
  min_stake: number
  max_stake: number
}

export interface DerivSymbol {
  symbol: string
  name: string
  market: string
  submarket: string
  pip: number
  decimal_places: number
}

// Trading Configuration Types
export interface TradeConfig {
  asset: string
  duration: number
  duration_unit: 's' | 'm' | 'h'
  stake: number
  type: 'CALL' | 'PUT'
}

export type TradeType = 'CALL' | 'PUT'
export type TradeStatus = 'WIN' | 'LOSS' | 'PENDING'
export type DurationUnit = 's' | 'm' | 'h'

// Trade Types
export interface Trade {
  id: string
  asset: string
  type: TradeType
  stake: number
  profit_loss: number
  status: TradeStatus
  entry_time: string
  exit_time?: string
  entry_price: number
  exit_price?: number
}

// Bot Strategy Types
export type StrategyName = 'Martingale' | 'Fibonacci' | 'D\'Alembert' | 'Oscar\'s Grind'

export interface BotStrategy {
  name: StrategyName
  base_stake: number
  max_trades_per_hour: number
  risk_percentage: number
  stop_loss: number
}

export interface BotState {
  isActive: boolean
  strategy: BotStrategy
  trades_today: number
  profit_today: number
}

// Analytics Types
export interface DailyPnL {
  date: string
  profit: number
}

export interface WinRateTrend {
  date: string
  rate: number
}

export interface TopAsset {
  asset: string
  profit: number
  trades: number
}

export interface AnalyticsData {
  daily_pnl: DailyPnL[]
  win_rate_trend: WinRateTrend[]
  top_assets: TopAsset[]
}

// Settings Types
export interface TradingPreferences {
  default_stake: number
  default_duration: number
  default_duration_unit: DurationUnit
  favorite_assets: string[]
}

export interface RiskLimits {
  daily_loss_limit: number
  daily_trade_limit: number
  max_stake: number
}

// API Response Types
export interface DerivAPIResponse<T = any> {
  msg_type: string
  error?: {
    code: string
    message: string
  }
  [key: string]: T
}

export interface DerivAuthorizeResponse {
  authorize: {
    account_list: Array<{
      account_type: string
      created_at: number
      currency: string
      is_disabled: number
      is_virtual: number
      landing_company_name: string
      loginid: string
    }>
    balance: number
    country: string
    currency: string
    email: string
    fullname: string
    is_virtual: number
    landing_company_fullname: string
    landing_company_name: string
    local_currencies: Record<string, any>
    loginid: string
    preferred_language: string
    scopes: string[]
    upgradeable_landing_companies: string[]
    user_id: number
  }
}

export interface DerivBalanceResponse {
  balance: {
    balance: number
    currency: string
    id: string
    loginid: string
  }
}

export interface DerivActiveSymbolsResponse {
  active_symbols: Array<{
    allow_forward_starting: number
    display_name: string
    display_order: number
    exchange_is_open: number
    is_trading_suspended: number
    market: string
    market_display_name: string
    pip: number
    subgroup: string
    subgroup_display_name: string
    submarket: string
    submarket_display_name: string
    symbol: string
    symbol_type: string
  }>
}

export interface DerivBuyContractResponse {
  buy: {
    balance_after: number
    buy_price: number
    contract_id: number
    longcode: string
    payout: number
    purchase_time: number
    shortcode: string
    start_time: number
    transaction_id: number
  }
}

// WebSocket Message Types
export interface WebSocketMessage {
  msg_type: string
  req_id?: number
  [key: string]: any
}

// Component Props Types
export interface AccountMetricsProps {
  balance: number
  currency: string
  totalTrades: number
  winRate: number
  profitLoss: number
}

export interface TradingTerminalProps {
  symbols: DerivSymbol[]
  balance: number
  onTrade: (config: TradeConfig) => Promise<void>
  onBotStart: (strategy: BotStrategy) => void
  onBotStop: () => void
}

export interface TradeHistoryProps {
  trades: Trade[]
  onLoadMore?: () => void
}

export interface AnalyticsSectionProps {
  data: AnalyticsData
  timePeriod: 'day' | 'week' | 'month'
  onTimePeriodChange: (period: 'day' | 'week' | 'month') => void
}

export interface SettingsPanelProps {
  preferences: TradingPreferences
  riskLimits: RiskLimits
  onSave: (preferences: TradingPreferences, riskLimits: RiskLimits) => void
  onClose: () => void
}

// Local Storage Keys
export const STORAGE_KEYS = {
  USER_SESSION: 'user_session',
  ADMIN_SESSION: 'admin_session',
  TRADING_PREFERENCES: 'trading_preferences',
  RISK_LIMITS: 'risk_limits',
  TRADE_HISTORY: 'trade_history',
  DERIV_TOKEN: 'deriv_token',
} as const

// Trading Mode Type
export type TradingMode = 'manual' | 'auto'

// Chart Configuration
export interface ChartConfig {
  symbol: string
  theme: 'dark' | 'light'
  interval?: string
}
