# Implementation Plan: Dashboard Redesign

## Overview

This implementation plan breaks down the dashboard redesign into incremental coding tasks. Each task builds on previous work and focuses on delivering functional components that can be tested immediately. The plan prioritizes core functionality first, then adds enhancements.

## Tasks

- [x] 1. Create core TypeScript interfaces and types
  - Define all interfaces from design document (UserData, DerivConnection, AssetPair, TradeConfig, Trade, BotStrategy, BotState, AnalyticsData)
  - Create type definitions file at `types/dashboard.ts`
  - Export all types for use across components
  - _Requirements: All requirements (foundational)_

- [ ] 2. Set up Deriv API integration utilities
  - [x] 2.1 Create Deriv WebSocket connection manager
    - Implement connection, authentication, and reconnection logic
    - Handle WebSocket message parsing
    - Create hooks for connection state
    - _Requirements: 2.2, 2.3, 8.5_
  
  - [x] 2.2 Create Deriv API service functions
    - Implement getBalance, getActiveSymbols, buyContract functions
    - Handle API responses and errors
    - Create utility for formatting Deriv data
    - _Requirements: 1.1, 3.4, 4.2_
  
  - [x] 2.3 Write unit tests for API utilities
    - Test connection manager with mock WebSocket
    - Test API service functions with mock responses
    - Test error handling scenarios
    - _Requirements: 2.2, 2.4_

- [ ] 3. Build AccountMetrics component
  - [x] 3.1 Create metric card components
    - Build BalanceCard, TotalTradesCard, WinRateCard, ProfitLossCard
    - Implement responsive grid layout
    - Add color-coded styling and icons
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 10.3_
  
  - [x] 3.2 Write property test for metrics display
    - **Property 1: Balance Consistency**
    - **Validates: Requirements 1.1, 4.4**
  
  - [x] 3.3 Write property test for metrics update timeliness
    - **Property 9: Metrics Update Timeliness**
    - **Validates: Requirements 1.5**

- [x] 4. Implement DashboardHeader component
  - Create header with user info and navigation
  - Add Deriv connection status indicator
  - Implement logout functionality
  - Add responsive layout for mobile
  - _Requirements: 2.3, 9.1, 9.2, 9.3_

- [ ] 5. Build ManualTradingPanel component
  - [x] 5.1 Create asset selector dropdown
    - Fetch and display all Deriv asset pairs
    - Implement search/filter functionality
    - Group by market type (Forex, Crypto, etc.)
    - _Requirements: 3.4, 4.6_
  
  - [x] 5.2 Create duration and stake inputs
    - Build duration input with unit selector (s/m)
    - Build stake amount input with validation
    - Add min/max stake validation
    - _Requirements: 4.7, 4.8_
  
  - [x] 5.3 Implement CALL/PUT trade buttons
    - Create large, prominent trade buttons
    - Add enable/disable toggle
    - Implement trade execution logic
    - Show loading state during execution
    - _Requirements: 4.1, 4.2, 4.3, 4.5_
  
  - [x] 5.4 Write property test for trade execution
    - **Property 2: Trade Execution Validation**
    - **Validates: Requirements 4.2, 4.3, 4.5**
  
  - [x] 5.5 Write property test for asset availability
    - **Property 3: Asset Pair Availability**
    - **Validates: Requirements 3.4, 4.6**

- [ ] 6. Build AutoTradingPanel component
  - [x] 6.1 Create strategy selector
    - Build dropdown with strategy options
    - Add strategy descriptions
    - _Requirements: 5.2, 5.3_
  
  - [x] 6.2 Create risk settings inputs
    - Build max trades/hour input
    - Build risk percentage input
    - Add validation for limits
    - _Requirements: 5.6, 5.7_
  
  - [x] 6.3 Implement bot start/stop controls
    - Create start/stop button with confirmation
    - Implement bot state management
    - Add visual indicator for active bot
    - Handle bot execution loop
    - _Requirements: 5.1, 5.4, 5.5, 5.8_
  
  - [x] 6.4 Write property test for bot limits
    - **Property 4: Bot Strategy Limits**
    - **Validates: Requirements 5.6, 5.8**

- [ ] 7. Implement DerivChartEmbed component
  - [x] 7.1 Create chart iframe embed
    - Build iframe component with Deriv chart URL
    - Implement responsive sizing
    - Add fallback message for load failures
    - _Requirements: 3.1, 3.5_
  
  - [x] 7.2 Sync chart with asset selection
    - Update chart URL when asset changes
    - Handle chart reload on asset change
    - _Requirements: 3.2, 3.3_
  
  - [x] 7.3 Write property test for chart synchronization
    - **Property 7: Chart Asset Synchronization**
    - **Validates: Requirements 3.2, 3.3**

- [x] 8. Build TradingTerminal component
  - Integrate ManualTradingPanel and AutoTradingPanel
  - Create mode selector (Manual/Auto tabs)
  - Integrate DerivChartEmbed
  - Implement responsive layout (controls left, chart right)
  - _Requirements: 3.1, 4.1, 5.1, 9.4_

- [x] 9. Checkpoint - Test trading functionality
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Build TradeHistoryTable component
  - [x] 10.1 Create table structure
    - Build table with columns: Asset, Type, Stake, P/L, Status, Time
    - Implement fixed header with scrollable body
    - Add color-coded rows (green/red)
    - _Requirements: 6.3, 6.5_
  
  - [x] 10.2 Implement trade data loading
    - Fetch recent trades from localStorage/API
    - Add new trades to top of list
    - Implement pagination or infinite scroll
    - _Requirements: 6.1, 6.2, 6.4_
  
  - [x] 10.3 Write property test for trade ordering
    - **Property 6: Trade History Ordering**
    - **Validates: Requirements 6.1, 6.2**

- [ ] 11. Build AnalyticsSection component
  - [x] 11.1 Create profit/loss chart
    - Implement line chart for daily P/L
    - Add time period selector
    - Calculate and display data
    - _Requirements: 7.1, 7.4_
  
  - [x] 11.2 Create win rate trend chart
    - Implement line chart for win rate over time
    - Calculate win rate per day/week/month
    - _Requirements: 7.2, 7.4_
  
  - [x] 11.3 Create top assets display
    - Calculate best performing assets
    - Display as list with profit and trade count
    - _Requirements: 7.3_
  
  - [x] 11.4 Write unit tests for analytics calculations
    - Test P/L calculation logic
    - Test win rate calculation
    - Test top assets sorting
    - _Requirements: 7.1, 7.2, 7.3_

- [ ] 12. Build SettingsPanel component
  - [x] 12.1 Create settings modal
    - Build modal overlay with form
    - Create sections for Risk Limits, Preferences, API Config
    - _Requirements: 8.1, 8.2, 8.3, 8.5_
  
  - [x] 12.2 Implement risk limit settings
    - Build daily loss limit input
    - Build daily trade limit input
    - Add validation and save logic
    - _Requirements: 8.1, 8.2, 8.4_
  
  - [x] 12.3 Write property test for risk limit enforcement
    - **Property 5: Risk Limit Enforcement**
    - **Validates: Requirements 8.2, 8.4**

- [ ] 13. Integrate all components in main Dashboard page
  - [x] 13.1 Update app/page.tsx with new components
    - Replace old dashboard code with new component structure
    - Implement state management for all components
    - Connect Deriv API to components
    - _Requirements: All requirements_
  
  - [x] 13.2 Implement connection state management
    - Handle Deriv connection/disconnection
    - Disable trading when disconnected
    - Show connection errors
    - _Requirements: 2.1, 2.4, 2.5_
  
  - [x] 13.3 Write property test for connection state
    - **Property 8: Connection State Consistency**
    - **Validates: Requirements 2.1, 2.5**

- [ ] 14. Implement responsive design
  - [x] 14.1 Add responsive breakpoints
    - Test and adjust layout for desktop (1920x1080+)
    - Test and adjust layout for tablet (768x1024)
    - Test and adjust layout for mobile (375x667+)
    - _Requirements: 9.1, 9.2, 9.3_
  
  - [x] 14.2 Optimize mobile experience
    - Stack components vertically on mobile
    - Adjust font sizes and spacing
    - Ensure touch targets are adequate
    - _Requirements: 9.4, 9.5_
  
  - [x] 14.3 Write property test for responsive layout
    - **Property 10: Responsive Layout Integrity**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**

- [x] 15. Apply dark theme styling
  - Apply dark color scheme (gray-900 background)
  - Add gradient accents (blue to purple)
  - Implement color-coded indicators
  - Add backdrop blur effects to cards
  - Verify WCAG AA contrast ratios
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 16. Implement error handling
  - Add error boundaries for components
  - Implement toast notifications for errors
  - Add retry logic for failed API calls
  - Display user-friendly error messages
  - _Requirements: 2.4, 4.3_

- [x] 17. Final checkpoint - Complete testing
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Login page functionality is preserved and not modified
