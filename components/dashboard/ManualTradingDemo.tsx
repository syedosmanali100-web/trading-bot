/**
 * Manual Trading Demo Component
 * Example integration of ManualTradingPanel with trade execution
 */

'use client'

import { useState } from 'react'
import { ManualTradingPanel } from './ManualTradingPanel'
import { DerivSymbol, TradeConfig } from '@/types/dashboard'
import { toast } from 'sonner'

// Mock symbols for demonstration
const MOCK_SYMBOLS: DerivSymbol[] = [
  {
    symbol: 'R_10',
    name: 'Volatility 10 Index',
    market: 'synthetic_index',
    submarket: 'random_index',
    pip: 0.01,
    decimal_places: 2,
  },
  {
    symbol: 'R_25',
    name: 'Volatility 25 Index',
    market: 'synthetic_index',
    submarket: 'random_index',
    pip: 0.01,
    decimal_places: 2,
  },
  {
    symbol: 'R_50',
    name: 'Volatility 50 Index',
    market: 'synthetic_index',
    submarket: 'random_index',
    pip: 0.01,
    decimal_places: 2,
  },
  {
    symbol: 'R_75',
    name: 'Volatility 75 Index',
    market: 'synthetic_index',
    submarket: 'random_index',
    pip: 0.01,
    decimal_places: 2,
  },
  {
    symbol: 'R_100',
    name: 'Volatility 100 Index',
    market: 'synthetic_index',
    submarket: 'random_index',
    pip: 0.01,
    decimal_places: 2,
  },
  {
    symbol: 'frxEURUSD',
    name: 'EUR/USD',
    market: 'forex',
    submarket: 'major_pairs',
    pip: 0.0001,
    decimal_places: 5,
  },
  {
    symbol: 'frxGBPUSD',
    name: 'GBP/USD',
    market: 'forex',
    submarket: 'major_pairs',
    pip: 0.0001,
    decimal_places: 5,
  },
  {
    symbol: 'frxUSDJPY',
    name: 'USD/JPY',
    market: 'forex',
    submarket: 'major_pairs',
    pip: 0.01,
    decimal_places: 3,
  },
]

interface ManualTradingDemoProps {
  balance?: number
  currency?: string
  onTradeExecuted?: (config: TradeConfig) => void
}

export function ManualTradingDemo({
  balance = 1000,
  currency = 'USD',
  onTradeExecuted,
}: ManualTradingDemoProps) {
  const [isExecuting, setIsExecuting] = useState(false)

  const handleTrade = async (config: TradeConfig): Promise<void> => {
    setIsExecuting(true)

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Simulate trade execution
      console.log('Executing trade:', config)

      // In a real implementation, this would call the Deriv API:
      // const derivAPI = new DerivAPI(token)
      // await derivAPI.connect()
      // await derivAPI.authorize()
      // const result = await derivAPI.buyContract({
      //   symbol: config.asset,
      //   contract_type: config.type,
      //   duration: config.duration,
      //   duration_unit: config.duration_unit,
      //   amount: config.stake,
      //   basis: 'stake'
      // })

      // Notify parent component
      if (onTradeExecuted) {
        onTradeExecuted(config)
      }

      // Success - the toast is already shown by TradeButtons component
    } catch (error) {
      console.error('Trade execution failed:', error)
      throw error // Re-throw to let TradeButtons handle the error toast
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <ManualTradingPanel
      symbols={MOCK_SYMBOLS}
      balance={balance}
      currency={currency}
      onTrade={handleTrade}
      disabled={isExecuting}
    />
  )
}
