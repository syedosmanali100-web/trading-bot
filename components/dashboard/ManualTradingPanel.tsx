/**
 * Manual Trading Panel Component
 * Combines asset selection, trade inputs, and trade execution buttons
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AssetSelector } from './AssetSelector'
import { DurationInput, StakeInput } from './TradeInputs'
import { TradeButtons } from './TradeButtons'
import { DerivSymbol, TradeConfig, DurationUnit } from '@/types/dashboard'
import { Maximize2 } from 'lucide-react'

interface ManualTradingPanelProps {
  symbols: DerivSymbol[]
  balance?: number
  currency?: string
  onTrade: (config: TradeConfig) => Promise<void>
  disabled?: boolean
}

export function ManualTradingPanel({
  symbols,
  balance,
  currency = 'USD',
  onTrade,
  disabled = false,
}: ManualTradingPanelProps) {
  // Trading configuration state
  const [selectedAsset, setSelectedAsset] = useState<string>(
    symbols.length > 0 ? symbols[0].symbol : ''
  )
  const [duration, setDuration] = useState<number>(1)
  const [durationUnit, setDurationUnit] = useState<DurationUnit>('m')
  const [stake, setStake] = useState<number>(10)

  // Get selected symbol details for min/max stake
  const selectedSymbol = symbols.find(s => s.symbol === selectedAsset)
  const minStake = 1 // Default, can be from selectedSymbol if available
  const maxStake = 10000 // Default, can be from selectedSymbol if available

  return (
    <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Maximize2 className="w-5 h-5 text-blue-400" />
          Manual Trading
        </CardTitle>
        <CardDescription className="text-gray-400">
          Execute trades manually based on your analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Asset Selection */}
        <AssetSelector
          symbols={symbols}
          selectedSymbol={selectedAsset}
          onSymbolChange={setSelectedAsset}
          disabled={disabled}
        />

        {/* Duration Input */}
        <DurationInput
          duration={duration}
          durationUnit={durationUnit}
          onDurationChange={setDuration}
          onDurationUnitChange={setDurationUnit}
          disabled={disabled}
        />

        {/* Stake Input */}
        <StakeInput
          stake={stake}
          currency={currency}
          minStake={minStake}
          maxStake={maxStake}
          balance={balance}
          onStakeChange={setStake}
          disabled={disabled}
        />

        {/* Trade Buttons */}
        <TradeButtons
          asset={selectedAsset}
          duration={duration}
          durationUnit={durationUnit}
          stake={stake}
          balance={balance}
          minStake={minStake}
          maxStake={maxStake}
          onTrade={onTrade}
          disabled={disabled}
        />
      </CardContent>
    </Card>
  )
}
