# Dashboard Components

This directory contains the core components for the trading dashboard redesign.

## Components

### TradeButtons

Large, prominent CALL/PUT trade execution buttons with enable/disable toggle and loading states.

**Features:**
- Enable/disable toggle for manual trading
- Large, prominent buttons with gradient styling
- Loading states during trade execution
- Comprehensive validation (stake amount, balance)
- Visual feedback for all states (disabled, ready, error)
- Prevents concurrent trade execution

**Usage:**
```tsx
import { TradeButtons } from '@/components/dashboard/TradeButtons'

<TradeButtons
  asset="R_100"
  duration={1}
  durationUnit="m"
  stake={10}
  balance={1000}
  minStake={1}
  maxStake={10000}
  onTrade={handleTrade}
  disabled={false}
/>
```

**Props:**
- `asset` (string): The trading asset symbol
- `duration` (number): Trade duration value
- `durationUnit` ('s' | 'm' | 'h'): Duration unit
- `stake` (number): Stake amount
- `balance` (number, optional): Account balance for validation
- `minStake` (number, optional): Minimum stake amount (default: 1)
- `maxStake` (number, optional): Maximum stake amount (default: 10000)
- `onTrade` (function): Async callback for trade execution
- `disabled` (boolean, optional): Disable all controls

**Requirements Validated:**
- 4.1: Manual trading enable/disable
- 4.2: Trade execution with configured parameters
- 4.3: Trade confirmation messages
- 4.5: Manual trading disable warning

### ManualTradingPanel

Complete manual trading interface combining asset selection, trade inputs, and execution buttons.

**Features:**
- Asset selector with search/filter
- Duration and stake inputs with validation
- Integrated trade buttons
- Responsive card layout

**Usage:**
```tsx
import { ManualTradingPanel } from '@/components/dashboard/ManualTradingPanel'

<ManualTradingPanel
  symbols={derivSymbols}
  balance={1000}
  currency="USD"
  onTrade={handleTrade}
  disabled={false}
/>
```

**Props:**
- `symbols` (DerivSymbol[]): Available trading symbols
- `balance` (number, optional): Account balance
- `currency` (string, optional): Account currency (default: 'USD')
- `onTrade` (function): Async callback for trade execution
- `disabled` (boolean, optional): Disable all controls

### AssetSelector

Dropdown selector for choosing trading assets with search and market grouping.

**Features:**
- Search/filter functionality
- Market grouping (Forex, Crypto, etc.)
- Responsive dropdown
- Keyboard navigation

**Usage:**
```tsx
import { AssetSelector } from '@/components/dashboard/AssetSelector'

<AssetSelector
  symbols={derivSymbols}
  selectedSymbol="R_100"
  onSymbolChange={setSelectedSymbol}
  disabled={false}
/>
```

### TradeInputs

Duration and stake amount inputs with validation and quick-select buttons.

**Components:**
- `DurationInput`: Duration value and unit selector
- `StakeInput`: Stake amount with validation and quick buttons

**Usage:**
```tsx
import { DurationInput, StakeInput } from '@/components/dashboard/TradeInputs'

<DurationInput
  duration={1}
  durationUnit="m"
  onDurationChange={setDuration}
  onDurationUnitChange={setDurationUnit}
  disabled={false}
/>

<StakeInput
  stake={10}
  currency="USD"
  minStake={1}
  maxStake={10000}
  balance={1000}
  onStakeChange={setStake}
  disabled={false}
/>
```

## Integration Example

Complete example of integrating all components:

```tsx
'use client'

import { useState } from 'react'
import { ManualTradingPanel } from '@/components/dashboard/ManualTradingPanel'
import { DerivSymbol, TradeConfig } from '@/types/dashboard'
import { buyContract } from '@/lib/deriv-api'
import { toast } from 'sonner'

export function TradingDashboard() {
  const [symbols, setSymbols] = useState<DerivSymbol[]>([])
  const [balance, setBalance] = useState<number>(1000)

  const handleTrade = async (config: TradeConfig): Promise<void> => {
    try {
      // Execute trade via Deriv API
      const result = await buyContract(config)
      
      // Update balance
      setBalance(result.buy.balance_after)
      
      // Success toast is shown by TradeButtons component
    } catch (error) {
      // Error toast is shown by TradeButtons component
      throw error
    }
  }

  return (
    <ManualTradingPanel
      symbols={symbols}
      balance={balance}
      currency="USD"
      onTrade={handleTrade}
    />
  )
}
```

## Testing

All components have comprehensive unit tests:

```bash
# Run all dashboard component tests
npm test -- __tests__/components/

# Run specific component tests
npm test -- __tests__/components/TradeButtons.test.tsx
```

## Styling

Components use:
- Tailwind CSS for styling
- shadcn/ui components for base UI elements
- Dark theme with gradient accents
- Responsive design for all screen sizes

## Requirements Coverage

### Task 5.3: Implement CALL/PUT trade buttons
- ✅ Create large, prominent trade buttons
- ✅ Add enable/disable toggle
- ✅ Implement trade execution logic
- ✅ Show loading state during execution

### Requirements Validated:
- ✅ 4.1: Manual trading enable/disable
- ✅ 4.2: Trade execution with configured parameters
- ✅ 4.3: Trade confirmation messages
- ✅ 4.5: Manual trading disable warning

## Next Steps

To complete the manual trading implementation:

1. **Task 5.4**: Write property test for trade execution
2. **Task 5.5**: Write property test for asset availability
3. **Integration**: Connect to real Deriv WebSocket API
4. **Testing**: Test with Deriv demo account
