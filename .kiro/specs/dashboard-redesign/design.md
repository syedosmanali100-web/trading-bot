# Design Document: Trading Bot Dashboard Redesign

## Overview

The dashboard redesign will create a modern, professional dark-themed interface for the trading bot. The design focuses on clarity, usability, and real-time data presentation. The interface will be built using Next.js 14 with React Server Components where appropriate, TypeScript for type safety, and Tailwind CSS with shadcn/ui components for consistent styling.

The dashboard will integrate directly with Deriv's API for account management, trading execution, and chart display. All trading logic will be client-side to enable real-time updates and responsive user interactions.

## Architecture

### Component Structure

```
app/page.tsx (Dashboard)
├── DashboardHeader
│   ├── UserInfo
│   ├── ConnectionStatus
│   └── NavigationButtons
├── AccountMetrics
│   ├── BalanceCard
│   ├── TotalTradesCard
│   ├── WinRateCard
│   └── ProfitLossCard
├── TradingTerminal
│   ├── ModeSelector (Manual/Auto)
│   ├── ManualTradingPanel
│   │   ├── AssetSelector
│   │   ├── DurationSelector
│   │   ├── StakeAmountInput
│   │   └── TradeButtons (CALL/PUT)
│   ├── AutoTradingPanel
│   │   ├── StrategySelector
│   │   ├── RiskSettings
│   │   └── BotControls (Start/Stop)
│   └── DerivChartEmbed
├── TradeHistoryTable
│   ├── TableHeader
│   └── TradeRows
├── AnalyticsSection
│   ├── ProfitLossChart
│   ├── WinRateTrend
│   └── TopAssets
└── SettingsPanel (Modal)
    ├── RiskLimits
    ├── TradingPreferences
    └── APIConfiguration
```

### Data Flow

1. **Authentication**: User session is validated from localStorage on component mount
2. **Deriv Connection**: API token is used to establish WebSocket connection to Deriv
3. **Real-time Updates**: WebSocket messages update React state for balance, trades, and prices
4. **Trade Execution**: User actions trigger API calls to Deriv, responses update local state
5. **State Management**: React useState and useEffect hooks manage component state
6. **Persistence**: Trade history and settings stored in localStorage and synced with backend

### Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Charts**: Deriv's native chart widget (embedded iframe)
- **State**: React hooks (useState, useEffect, useCallback)
- **API**: Deriv WebSocket API
- **Icons**: Lucide React

## Components and Interfaces

### Core Interfaces

```typescript
interface UserData {
  id: string
  username: string
  is_admin: boolean
  is_active: boolean
  subscription_end: string
  deriv_account_id?: string
  deriv_token?: string
  is_deriv_user: boolean
}

interface DerivConnection {
  isConnected: boolean
  accountId: string
  balance: number
  currency: string
}

interface AssetPair {
  symbol: string
  display_name: string
  market: string
  submarket: string
  pip: number
  min_stake: number
  max_stake: number
}

interface TradeConfig {
  asset: string
  duration: number
  duration_unit: 's' | 'm' | 'h'
  stake: number
  type: 'CALL' | 'PUT'
}

interface Trade {
  id: string
  asset: string
  type: 'CALL' | 'PUT'
  stake: number
  profit_loss: number
  status: 'WIN' | 'LOSS' | 'PENDING'
  entry_time: string
  exit_time?: string
  entry_price: number
  exit_price?: number
}

interface BotStrategy {
  name: 'Martingale' | 'Fibonacci' | 'D\'Alembert' | 'Oscar\'s Grind'
  base_stake: number
  max_trades_per_hour: number
  risk_percentage: number
  stop_loss: number
}

interface BotState {
  isActive: boolean
  strategy: BotStrategy
  trades_today: number
  profit_today: number
}

interface AnalyticsData {
  daily_pnl: Array<{ date: string; profit: number }>
  win_rate_trend: Array<{ date: string; rate: number }>
  top_assets: Array<{ asset: string; profit: number; trades: number }>
}
```

### Component Specifications

#### 1. DashboardHeader
- Displays user welcome message
- Shows Deriv connection status with indicator
- Provides navigation to Profile and Admin (if applicable)
- Includes Logout button

#### 2. AccountMetrics
- Four card layout displaying key metrics
- Real-time updates from Deriv API
- Color-coded values (green for positive, red for negative)
- Animated number transitions

#### 3. TradingTerminal
- Tabbed interface for Manual/Auto trading modes
- Left panel: Trading controls
- Right panel: Deriv chart embed (2/3 width)
- Responsive layout (stacks on mobile)

#### 4. ManualTradingPanel
- Asset dropdown with search/filter
- Duration input with unit selector
- Stake amount input with min/max validation
- Large CALL (green) and PUT (red) buttons
- Enable/Disable toggle

#### 5. AutoTradingPanel
- Strategy dropdown with descriptions
- Risk settings (max trades/hour, risk %, stop loss)
- Start/Stop button with confirmation
- Current bot status display
- Performance metrics for active bot

#### 6. DerivChartEmbed
- Embedded Deriv chart using iframe
- Synced with selected asset
- Responsive sizing
- Fallback message if chart fails to load

#### 7. TradeHistoryTable
- Scrollable table with fixed header
- Columns: Asset, Type, Stake, P/L, Status, Time
- Color-coded rows
- Pagination or infinite scroll
- Export functionality

#### 8. AnalyticsSection
- Line chart for daily P/L
- Win rate trend chart
- Top performing assets list
- Time period selector (Day/Week/Month)

#### 9. SettingsPanel
- Modal overlay
- Sections for Risk Limits, Preferences, API Config
- Form validation
- Save/Cancel buttons

## Data Models

### Local Storage Schema

```typescript
// User session
localStorage.user_session = {
  id: string
  username: string
  token: string
  deriv_token?: string
}

// Trading preferences
localStorage.trading_preferences = {
  default_stake: number
  default_duration: number
  default_duration_unit: string
  favorite_assets: string[]
}

// Risk limits
localStorage.risk_limits = {
  daily_loss_limit: number
  daily_trade_limit: number
  max_stake: number
}

// Trade history cache (last 100 trades)
localStorage.trade_history = Trade[]
```

### API Integration

#### Deriv WebSocket API

**Connection:**
```typescript
const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=YOUR_APP_ID')
```

**Authorize:**
```json
{
  "authorize": "USER_API_TOKEN"
}
```

**Get Balance:**
```json
{
  "balance": 1,
  "subscribe": 1
}
```

**Get Available Assets:**
```json
{
  "active_symbols": "brief",
  "product_type": "basic"
}
```

**Buy Contract (Trade):**
```json
{
  "buy": 1,
  "price": 10,
  "parameters": {
    "contract_type": "CALL",
    "symbol": "R_100",
    "duration": 1,
    "duration_unit": "m",
    "basis": "stake",
    "amount": 10
  }
}
```

**Embed Chart:**
```html
<iframe 
  src="https://charts.deriv.com/?symbol=R_100&theme=dark"
  width="100%"
  height="400px"
/>
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Balance Consistency
*For any* sequence of trades, the displayed balance should equal the initial balance plus the sum of all profit/loss values from completed trades.
**Validates: Requirements 1.1, 4.4**

### Property 2: Trade Execution Validation
*For any* manual trade execution, if the user has sufficient balance and manual trading is enabled, the trade should be submitted to Deriv API and a confirmation should be displayed.
**Validates: Requirements 4.2, 4.3, 4.5**

### Property 3: Asset Pair Availability
*For any* asset pair displayed in the selector, that asset must be available for trading on Deriv (active_symbols API returns it).
**Validates: Requirements 3.4, 4.6**

### Property 4: Bot Strategy Limits
*For any* active bot, the number of trades executed per hour should never exceed the configured max_trades_per_hour limit.
**Validates: Requirements 5.6, 5.8**

### Property 5: Risk Limit Enforcement
*For any* trading session, when the daily loss limit is reached, both manual and auto trading should be disabled until the next day.
**Validates: Requirements 8.2, 8.4**

### Property 6: Trade History Ordering
*For any* trade history display, trades should be ordered by timestamp in descending order (newest first).
**Validates: Requirements 6.1, 6.2**

### Property 7: Chart Asset Synchronization
*For any* asset selection change, the embedded Deriv chart should update to display the selected asset within 2 seconds.
**Validates: Requirements 3.2, 3.3**

### Property 8: Connection State Consistency
*For any* Deriv API interaction, if the connection status is "disconnected", all trading actions should be disabled and display an error message.
**Validates: Requirements 2.1, 2.5**

### Property 9: Metrics Update Timeliness
*For any* account data update from Deriv API, the dashboard metrics should reflect the new values within 2 seconds.
**Validates: Requirements 1.5**

### Property 10: Responsive Layout Integrity
*For any* screen size, all dashboard components should be visible and functional without horizontal scrolling.
**Validates: Requirements 9.1, 9.2, 9.3, 9.4**

## Error Handling

### Connection Errors
- Display toast notification with error message
- Show reconnection button
- Disable trading controls until reconnected
- Cache pending trades for retry

### API Errors
- Parse Deriv API error responses
- Display user-friendly error messages
- Log errors to console for debugging
- Provide actionable recovery steps

### Validation Errors
- Inline form validation with error messages
- Prevent submission of invalid data
- Highlight invalid fields in red
- Display validation rules as hints

### Trade Execution Errors
- Display specific error (insufficient balance, market closed, etc.)
- Rollback optimistic UI updates
- Offer retry option
- Log failed trades for review

## Testing Strategy

### Unit Tests
- Test individual component rendering
- Test form validation logic
- Test utility functions (formatters, calculators)
- Test error handling functions
- Mock Deriv API responses

### Property-Based Tests
- Each correctness property will be implemented as a property-based test
- Use fast-check library for TypeScript
- Generate random trade sequences to test balance consistency
- Generate random asset selections to test chart synchronization
- Generate random bot configurations to test limit enforcement
- Minimum 100 iterations per property test
- Tag format: **Feature: dashboard-redesign, Property {number}: {property_text}**

### Integration Tests
- Test Deriv WebSocket connection flow
- Test trade execution end-to-end
- Test bot strategy execution
- Test data persistence to localStorage

### Manual Testing
- Test on multiple screen sizes
- Test with real Deriv demo account
- Test all trading strategies
- Test error scenarios (network loss, invalid token)
- Verify chart embedding works correctly

### Performance Testing
- Measure component render times
- Test with large trade history (1000+ trades)
- Monitor WebSocket message handling performance
- Ensure smooth animations and transitions
