# Requirements Document

## Introduction

This document outlines the requirements for redesigning the trading bot dashboard frontend. The dashboard will provide a clean, modern dark-themed interface for users to connect their Deriv accounts, execute manual trades, configure automated trading bots, and monitor their trading performance.

## Glossary

- **Dashboard**: The main user interface displayed after login
- **Deriv_API**: The Deriv broker API for account integration and trading
- **Trading_Bot**: Automated trading system that executes trades based on configured strategies
- **Manual_Trading**: User-initiated trades executed through the interface
- **Auto_Trading**: Bot-initiated trades executed automatically based on strategy
- **Asset_Pair**: Trading instruments available on Deriv (Forex, Crypto, Commodities, Indices)
- **Trade_Position**: An active CALL or PUT trade
- **Strategy**: Trading algorithm (Martingale, Fibonacci, D'Alembert, Oscar's Grind)
- **Stake_Amount**: The amount of money wagered on a single trade
- **Win_Rate**: Percentage of profitable trades
- **P/L**: Profit and Loss

## Requirements

### Requirement 1: Dashboard Overview

**User Story:** As a trader, I want to see my account overview at a glance, so that I can quickly understand my current trading status.

#### Acceptance Criteria

1. WHEN a user logs in, THE Dashboard SHALL display the account balance from Deriv
2. WHEN the dashboard loads, THE Dashboard SHALL display total trades count
3. WHEN the dashboard loads, THE Dashboard SHALL display current win rate percentage
4. WHEN the dashboard loads, THE Dashboard SHALL display total profit/loss amount
5. WHEN account data updates, THE Dashboard SHALL refresh the displayed metrics within 2 seconds

### Requirement 2: Deriv Account Connection

**User Story:** As a trader, I want to connect my Deriv account, so that I can trade using the bot.

#### Acceptance Criteria

1. WHEN a user has not connected a Deriv account, THE Dashboard SHALL display a connection prompt
2. WHEN a user enters a valid Deriv API token, THE System SHALL authenticate and store the connection
3. WHEN a Deriv account is connected, THE Dashboard SHALL display the account ID and connection status
4. WHEN a connection fails, THE System SHALL display a clear error message
5. WHEN a user disconnects their account, THE System SHALL remove stored credentials and stop all active trading

### Requirement 3: Live Trading Terminal with Deriv Charts

**User Story:** As a trader, I want to view live market charts from Deriv, so that I can make informed trading decisions.

#### Acceptance Criteria

1. WHEN the trading terminal loads, THE Dashboard SHALL embed Deriv's native chart widget
2. WHEN a user selects an asset pair, THE Chart SHALL update to display that asset's price data
3. WHEN market data updates, THE Chart SHALL refresh in real-time
4. THE Chart SHALL support all asset pairs available on Deriv (Forex, Crypto, Commodities, Indices)
5. WHEN the chart fails to load, THE System SHALL display a fallback message

### Requirement 4: Manual Trading Controls

**User Story:** As a trader, I want to execute manual trades, so that I can trade based on my own analysis.

#### Acceptance Criteria

1. WHEN manual trading is enabled, THE Dashboard SHALL display CALL and PUT buttons
2. WHEN a user clicks CALL or PUT, THE System SHALL execute a trade with the configured stake amount and duration
3. WHEN a trade is executed, THE System SHALL display a confirmation message
4. WHEN a trade completes, THE System SHALL update the trade history and account balance
5. WHEN manual trading is disabled, THE System SHALL prevent trade execution and display a warning
6. THE Manual_Trading_Panel SHALL allow selection of any asset pair available on Deriv
7. THE Manual_Trading_Panel SHALL allow configuration of trade duration (seconds or minutes)
8. THE Manual_Trading_Panel SHALL allow configuration of stake amount

### Requirement 5: Automated Trading Bot

**User Story:** As a trader, I want to configure and run automated trading bots, so that I can trade without constant monitoring.

#### Acceptance Criteria

1. WHEN auto trading is enabled, THE Trading_Bot SHALL execute trades automatically based on the selected strategy
2. WHEN a user selects a strategy, THE System SHALL apply that strategy's rules to trade execution
3. THE Auto_Trading_Panel SHALL support Martingale, Fibonacci, D'Alembert, and Oscar's Grind strategies
4. WHEN auto trading is active, THE Dashboard SHALL display a visual indicator
5. WHEN a user stops auto trading, THE System SHALL complete current trades and halt new trade execution
6. THE Auto_Trading_Panel SHALL allow configuration of maximum trades per hour
7. THE Auto_Trading_Panel SHALL allow configuration of risk percentage per trade
8. WHEN auto trading is running, THE System SHALL respect the configured limits

### Requirement 6: Trade History Display

**User Story:** As a trader, I want to view my recent trades, so that I can track my trading activity.

#### Acceptance Criteria

1. WHEN the dashboard loads, THE Trade_History_Table SHALL display the most recent 50 trades
2. WHEN a new trade completes, THE Trade_History_Table SHALL add the trade to the top of the list
3. THE Trade_History_Table SHALL display asset pair, trade type, stake amount, profit/loss, status, and timestamp
4. WHEN a user scrolls the trade history, THE System SHALL load older trades
5. THE Trade_History_Table SHALL color-code profitable trades (green) and losing trades (red)

### Requirement 7: Analytics and Performance Metrics

**User Story:** As a trader, I want to see my performance analytics, so that I can evaluate my trading effectiveness.

#### Acceptance Criteria

1. THE Dashboard SHALL display a profit/loss chart showing daily performance
2. THE Dashboard SHALL display win rate trends over time
3. THE Dashboard SHALL display best performing asset pairs
4. WHEN the time period changes, THE Analytics SHALL update to reflect the selected period
5. THE Analytics SHALL support daily, weekly, and monthly views

### Requirement 8: Settings and Configuration

**User Story:** As a trader, I want to configure my trading preferences, so that I can customize the bot behavior.

#### Acceptance Criteria

1. THE Settings_Panel SHALL allow configuration of daily loss limits
2. THE Settings_Panel SHALL allow configuration of maximum daily trades
3. THE Settings_Panel SHALL allow configuration of default stake amount
4. WHEN a limit is reached, THE System SHALL stop trading and display a warning
5. THE Settings_Panel SHALL allow users to update their Deriv API token

### Requirement 9: Responsive Design

**User Story:** As a trader, I want to access the dashboard on any device, so that I can trade from anywhere.

#### Acceptance Criteria

1. THE Dashboard SHALL be fully responsive on desktop screens (1920x1080 and above)
2. THE Dashboard SHALL be fully responsive on tablet screens (768x1024)
3. THE Dashboard SHALL be fully responsive on mobile screens (375x667 and above)
4. WHEN the screen size changes, THE Dashboard SHALL reorganize components for optimal viewing
5. THE Dashboard SHALL maintain all functionality across all screen sizes

### Requirement 10: Dark Theme UI

**User Story:** As a trader, I want a dark-themed interface, so that I can trade comfortably for extended periods.

#### Acceptance Criteria

1. THE Dashboard SHALL use a dark color scheme with gray-900 as the primary background
2. THE Dashboard SHALL use gradient accents (blue to purple) for primary actions
3. THE Dashboard SHALL use color-coded indicators (green for profit, red for loss, blue for neutral)
4. THE Dashboard SHALL maintain WCAG AA contrast ratios for text readability
5. THE Dashboard SHALL use backdrop blur effects for card components
