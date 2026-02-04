/**
 * Auto Trading Panel Component
 * Combines strategy selector, risk settings, and bot controls
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StrategySelector } from './StrategySelector'
import { RiskSettings } from './RiskSettings'
import { BotControls } from './BotControls'
import { BotStrategy, StrategyName } from '@/types/dashboard'
import { Bot } from 'lucide-react'

interface AutoTradingPanelProps {
  isActive: boolean
  tradesExecuted: number
  profitToday: number
  onStart: (strategy: BotStrategy) => void
  onStop: () => void
  disabled?: boolean
}

export function AutoTradingPanel({
  isActive,
  tradesExecuted,
  profitToday,
  onStart,
  onStop,
  disabled = false,
}: AutoTradingPanelProps) {
  // Strategy configuration state
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyName>('Martingale')
  const [maxTradesPerHour, setMaxTradesPerHour] = useState<number>(10)
  const [riskPercentage, setRiskPercentage] = useState<number>(2)
  const [baseStake, setBaseStake] = useState<number>(10)
  const [stopLoss, setStopLoss] = useState<number>(100)

  const handleStart = () => {
    const strategy: BotStrategy = {
      name: selectedStrategy,
      base_stake: baseStake,
      max_trades_per_hour: maxTradesPerHour,
      risk_percentage: riskPercentage,
      stop_loss: stopLoss,
    }
    onStart(strategy)
  }

  const currentStrategy: BotStrategy = {
    name: selectedStrategy,
    base_stake: baseStake,
    max_trades_per_hour: maxTradesPerHour,
    risk_percentage: riskPercentage,
    stop_loss: stopLoss,
  }

  return (
    <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Bot className="w-5 h-5 text-purple-400" />
          Auto Trading Bot
        </CardTitle>
        <CardDescription className="text-gray-400">
          Configure and run automated trading strategies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Strategy Selection */}
        <StrategySelector
          selectedStrategy={selectedStrategy}
          onStrategyChange={setSelectedStrategy}
          disabled={isActive || disabled}
        />

        {/* Risk Settings */}
        <RiskSettings
          maxTradesPerHour={maxTradesPerHour}
          riskPercentage={riskPercentage}
          onMaxTradesChange={setMaxTradesPerHour}
          onRiskPercentageChange={setRiskPercentage}
          disabled={isActive || disabled}
        />

        {/* Bot Controls */}
        <BotControls
          isActive={isActive}
          strategy={currentStrategy}
          tradesExecuted={tradesExecuted}
          profitToday={profitToday}
          onStart={handleStart}
          onStop={onStop}
          disabled={disabled}
        />
      </CardContent>
    </Card>
  )
}
