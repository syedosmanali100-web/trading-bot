/**
 * Risk Settings Component
 * Inputs for max trades/hour and risk percentage with validation
 */

'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Shield, TrendingUp, AlertTriangle } from 'lucide-react'

interface RiskSettingsProps {
  maxTradesPerHour: number
  riskPercentage: number
  onMaxTradesChange: (value: number) => void
  onRiskPercentageChange: (value: number) => void
  disabled?: boolean
}

export function RiskSettings({
  maxTradesPerHour,
  riskPercentage,
  onMaxTradesChange,
  onRiskPercentageChange,
  disabled = false,
}: RiskSettingsProps) {
  // Validation limits
  const MIN_TRADES_PER_HOUR = 1
  const MAX_TRADES_PER_HOUR = 60
  const MIN_RISK_PERCENTAGE = 0.1
  const MAX_RISK_PERCENTAGE = 10

  const isMaxTradesValid =
    maxTradesPerHour >= MIN_TRADES_PER_HOUR && maxTradesPerHour <= MAX_TRADES_PER_HOUR
  const isRiskPercentageValid =
    riskPercentage >= MIN_RISK_PERCENTAGE && riskPercentage <= MAX_RISK_PERCENTAGE

  const handleMaxTradesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    if (!isNaN(value)) {
      onMaxTradesChange(Math.max(MIN_TRADES_PER_HOUR, Math.min(MAX_TRADES_PER_HOUR, value)))
    }
  }

  const handleRiskPercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    if (!isNaN(value)) {
      onRiskPercentageChange(
        Math.max(MIN_RISK_PERCENTAGE, Math.min(MAX_RISK_PERCENTAGE, value))
      )
    }
  }

  return (
    <div className="space-y-4">
      {/* Max Trades Per Hour */}
      <div className="space-y-2">
        <Label htmlFor="max-trades" className="text-gray-300 font-medium">
          <TrendingUp className="w-4 h-4 inline mr-2 text-blue-400" />
          Max Trades Per Hour
        </Label>
        <Input
          id="max-trades"
          type="number"
          min={MIN_TRADES_PER_HOUR}
          max={MAX_TRADES_PER_HOUR}
          step={1}
          value={maxTradesPerHour}
          onChange={handleMaxTradesChange}
          disabled={disabled}
          className={`bg-gray-800/50 border-gray-700 text-white focus:ring-blue-500 ${
            !isMaxTradesValid ? 'border-red-500' : ''
          }`}
        />
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">
            Limit: {MIN_TRADES_PER_HOUR}-{MAX_TRADES_PER_HOUR} trades/hour
          </span>
          {!isMaxTradesValid && (
            <span className="text-red-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Invalid value
            </span>
          )}
        </div>
      </div>

      {/* Risk Percentage */}
      <div className="space-y-2">
        <Label htmlFor="risk-percentage" className="text-gray-300 font-medium">
          <Shield className="w-4 h-4 inline mr-2 text-purple-400" />
          Risk Percentage Per Trade
        </Label>
        <div className="relative">
          <Input
            id="risk-percentage"
            type="number"
            min={MIN_RISK_PERCENTAGE}
            max={MAX_RISK_PERCENTAGE}
            step={0.1}
            value={riskPercentage}
            onChange={handleRiskPercentageChange}
            disabled={disabled}
            className={`bg-gray-800/50 border-gray-700 text-white focus:ring-purple-500 pr-8 ${
              !isRiskPercentageValid ? 'border-red-500' : ''
            }`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            %
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">
            Limit: {MIN_RISK_PERCENTAGE}%-{MAX_RISK_PERCENTAGE}% of balance
          </span>
          {!isRiskPercentageValid && (
            <span className="text-red-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Invalid value
            </span>
          )}
        </div>
      </div>

      {/* Risk Level Indicator */}
      <div className="p-3 bg-gray-800/30 border border-gray-700 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Risk Assessment</span>
          <span
            className={`text-xs font-medium px-2 py-1 rounded ${
              riskPercentage >= 5
                ? 'bg-red-900/30 text-red-400'
                : riskPercentage >= 2
                ? 'bg-yellow-900/30 text-yellow-400'
                : 'bg-green-900/30 text-green-400'
            }`}
          >
            {riskPercentage >= 5 ? 'High Risk' : riskPercentage >= 2 ? 'Medium Risk' : 'Low Risk'}
          </span>
        </div>
        <p className="text-xs text-gray-500">
          {maxTradesPerHour} trades/hour at {riskPercentage}% risk per trade
        </p>
      </div>
    </div>
  )
}
