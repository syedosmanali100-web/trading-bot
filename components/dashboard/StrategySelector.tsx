/**
 * Strategy Selector Component
 * Dropdown with strategy options and descriptions
 */

'use client'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StrategyName } from '@/types/dashboard'
import { Brain } from 'lucide-react'

interface StrategySelectorProps {
  selectedStrategy: StrategyName
  onStrategyChange: (strategy: StrategyName) => void
  disabled?: boolean
}

const STRATEGIES: Array<{
  name: StrategyName
  description: string
  riskLevel: 'Low' | 'Medium' | 'High'
}> = [
  {
    name: 'Martingale',
    description: 'Double stake after each loss to recover losses with one win',
    riskLevel: 'High',
  },
  {
    name: 'Fibonacci',
    description: 'Increase stake following Fibonacci sequence after losses',
    riskLevel: 'Medium',
  },
  {
    name: "D'Alembert",
    description: 'Increase stake by one unit after loss, decrease after win',
    riskLevel: 'Low',
  },
  {
    name: "Oscar's Grind",
    description: 'Increase stake after wins to grind out small consistent profits',
    riskLevel: 'Low',
  },
]

export function StrategySelector({
  selectedStrategy,
  onStrategyChange,
  disabled = false,
}: StrategySelectorProps) {
  const selectedStrategyInfo = STRATEGIES.find((s) => s.name === selectedStrategy)

  return (
    <div className="space-y-2">
      <Label htmlFor="strategy-selector" className="text-gray-300 font-medium">
        <Brain className="w-4 h-4 inline mr-2 text-purple-400" />
        Trading Strategy
      </Label>
      
      <Select
        value={selectedStrategy}
        onValueChange={(value) => onStrategyChange(value as StrategyName)}
        disabled={disabled}
      >
        <SelectTrigger
          id="strategy-selector"
          className="bg-gray-800/50 border-gray-700 text-white hover:bg-gray-800 focus:ring-purple-500"
        >
          <SelectValue placeholder="Select a strategy" />
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-700">
          {STRATEGIES.map((strategy) => (
            <SelectItem
              key={strategy.name}
              value={strategy.name}
              className="text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer"
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-medium">{strategy.name}</span>
                <span
                  className={`ml-3 text-xs px-2 py-0.5 rounded ${
                    strategy.riskLevel === 'High'
                      ? 'bg-red-900/30 text-red-400'
                      : strategy.riskLevel === 'Medium'
                      ? 'bg-yellow-900/30 text-yellow-400'
                      : 'bg-green-900/30 text-green-400'
                  }`}
                >
                  {strategy.riskLevel}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Strategy Description */}
      {selectedStrategyInfo && (
        <div className="p-3 bg-gray-800/30 border border-gray-700 rounded-lg">
          <p className="text-sm text-gray-400">{selectedStrategyInfo.description}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-gray-500">Risk Level:</span>
            <span
              className={`text-xs font-medium ${
                selectedStrategyInfo.riskLevel === 'High'
                  ? 'text-red-400'
                  : selectedStrategyInfo.riskLevel === 'Medium'
                  ? 'text-yellow-400'
                  : 'text-green-400'
              }`}
            >
              {selectedStrategyInfo.riskLevel}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
