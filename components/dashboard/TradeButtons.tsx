/**
 * Trade Buttons Component
 * Large CALL/PUT buttons with enable/disable toggle and loading states
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react'
import { TradeConfig, TradeType } from '@/types/dashboard'
import { toast } from 'sonner'

interface TradeButtonsProps {
  asset: string
  duration: number
  durationUnit: 's' | 'm' | 'h'
  stake: number
  balance?: number
  minStake?: number
  maxStake?: number
  onTrade: (config: TradeConfig) => Promise<void>
  disabled?: boolean
}

export function TradeButtons({
  asset,
  duration,
  durationUnit,
  stake,
  balance,
  minStake = 1,
  maxStake = 10000,
  onTrade,
  disabled = false,
}: TradeButtonsProps) {
  const [isEnabled, setIsEnabled] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [executingType, setExecutingType] = useState<TradeType | null>(null)

  // Validation checks
  const isStakeValid = stake >= minStake && stake <= maxStake
  const hasBalance = balance === undefined || stake <= balance
  const canTrade = isEnabled && isStakeValid && hasBalance && !disabled && !isExecuting

  const handleToggle = (checked: boolean) => {
    setIsEnabled(checked)
    if (checked) {
      toast.success('Manual trading enabled')
    } else {
      toast.info('Manual trading disabled')
    }
  }

  const handleTrade = async (type: TradeType) => {
    if (!canTrade) {
      if (!isEnabled) {
        toast.error('Please enable manual trading first')
      } else if (!isStakeValid) {
        toast.error(`Stake must be between ${minStake} and ${maxStake}`)
      } else if (!hasBalance) {
        toast.error('Insufficient balance')
      }
      return
    }

    setIsExecuting(true)
    setExecutingType(type)

    try {
      const tradeConfig: TradeConfig = {
        asset,
        duration,
        duration_unit: durationUnit,
        stake,
        type,
      }

      await onTrade(tradeConfig)
      
      toast.success(
        `${type} trade executed on ${asset}`,
        {
          description: `Stake: ${stake} | Duration: ${duration}${durationUnit}`,
        }
      )
    } catch (error) {
      console.error('Trade execution error:', error)
      toast.error(
        'Trade execution failed',
        {
          description: error instanceof Error ? error.message : 'Please try again',
        }
      )
    } finally {
      setIsExecuting(false)
      setExecutingType(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
        <Label htmlFor="manual-trading-toggle" className="text-gray-300 font-medium">
          Manual Trading
        </Label>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${isEnabled ? 'text-green-400' : 'text-gray-500'}`}>
            {isEnabled ? 'ON' : 'OFF'}
          </span>
          <Switch
            id="manual-trading-toggle"
            checked={isEnabled}
            onCheckedChange={handleToggle}
            disabled={disabled}
            className="data-[state=checked]:bg-green-600"
          />
        </div>
      </div>

      {/* Trade Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {/* CALL Button */}
        <Button
          onClick={() => handleTrade('CALL')}
          disabled={!canTrade || (isExecuting && executingType !== 'CALL')}
          className="h-20 text-lg font-bold bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-500 transition-all duration-200 shadow-lg hover:shadow-green-500/50"
        >
          {isExecuting && executingType === 'CALL' ? (
            <>
              <Loader2 className="w-6 h-6 mr-2 animate-spin" />
              Executing...
            </>
          ) : (
            <>
              <TrendingUp className="w-6 h-6 mr-2" />
              CALL
            </>
          )}
        </Button>

        {/* PUT Button */}
        <Button
          onClick={() => handleTrade('PUT')}
          disabled={!canTrade || (isExecuting && executingType !== 'PUT')}
          className="h-20 text-lg font-bold bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-500 transition-all duration-200 shadow-lg hover:shadow-red-500/50"
        >
          {isExecuting && executingType === 'PUT' ? (
            <>
              <Loader2 className="w-6 h-6 mr-2 animate-spin" />
              Executing...
            </>
          ) : (
            <>
              <TrendingDown className="w-6 h-6 mr-2" />
              PUT
            </>
          )}
        </Button>
      </div>

      {/* Status Messages */}
      {!isEnabled && (
        <div className="p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
          <p className="text-sm text-yellow-400 text-center">
            Enable manual trading to execute trades
          </p>
        </div>
      )}

      {isEnabled && !isStakeValid && (
        <div className="p-3 bg-red-900/20 border border-red-700/50 rounded-lg">
          <p className="text-sm text-red-400 text-center">
            Invalid stake amount. Must be between {minStake} and {maxStake}
          </p>
        </div>
      )}

      {isEnabled && isStakeValid && !hasBalance && balance !== undefined && (
        <div className="p-3 bg-red-900/20 border border-red-700/50 rounded-lg">
          <p className="text-sm text-red-400 text-center">
            Insufficient balance. Available: {balance.toFixed(2)}
          </p>
        </div>
      )}

      {isEnabled && canTrade && (
        <div className="p-3 bg-green-900/20 border border-green-700/50 rounded-lg">
          <p className="text-sm text-green-400 text-center">
            Ready to trade • {asset} • {duration}{durationUnit} • Stake: {stake}
          </p>
        </div>
      )}
    </div>
  )
}
