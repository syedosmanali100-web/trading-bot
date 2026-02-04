/**
 * Trade Inputs Component
 * Duration and stake amount inputs with validation
 */

'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Clock, DollarSign } from 'lucide-react'
import { DurationUnit } from '@/types/dashboard'

interface DurationInputProps {
  duration: number
  durationUnit: DurationUnit
  onDurationChange: (duration: number) => void
  onDurationUnitChange: (unit: DurationUnit) => void
  disabled?: boolean
}

export function DurationInput({
  duration,
  durationUnit,
  onDurationChange,
  onDurationUnitChange,
  disabled = false,
}: DurationInputProps) {
  const handleDurationChange = (value: string) => {
    const numValue = parseInt(value, 10)
    if (!isNaN(numValue) && numValue > 0) {
      onDurationChange(numValue)
    }
  }

  return (
    <div className="space-y-2">
      <Label className="text-gray-300 flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Duration
      </Label>
      <div className="flex gap-2">
        <Input
          type="number"
          min="1"
          max={durationUnit === 's' ? 3600 : durationUnit === 'm' ? 1440 : 24}
          value={duration}
          onChange={(e) => handleDurationChange(e.target.value)}
          disabled={disabled}
          className="flex-1 border-gray-700 bg-gray-900 text-white"
        />
        <select
          value={durationUnit}
          onChange={(e) => onDurationUnitChange(e.target.value as DurationUnit)}
          disabled={disabled}
          className="border border-gray-700 rounded-md bg-gray-900 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="s">Seconds</option>
          <option value="m">Minutes</option>
          <option value="h">Hours</option>
        </select>
      </div>
      <p className="text-xs text-gray-500">
        {getDurationHint(duration, durationUnit)}
      </p>
    </div>
  )
}

interface StakeInputProps {
  stake: number
  currency: string
  minStake?: number
  maxStake?: number
  balance?: number
  onStakeChange: (stake: number) => void
  disabled?: boolean
}

export function StakeInput({
  stake,
  currency = 'USD',
  minStake = 1,
  maxStake = 10000,
  balance,
  onStakeChange,
  disabled = false,
}: StakeInputProps) {
  const handleStakeChange = (value: string) => {
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0) {
      onStakeChange(numValue)
    }
  }

  const isValid = stake >= minStake && stake <= maxStake
  const hasBalance = balance === undefined || stake <= balance

  return (
    <div className="space-y-2">
      <Label className="text-gray-300 flex items-center gap-2">
        <DollarSign className="w-4 h-4" />
        Stake Amount
      </Label>
      <div className="flex gap-2">
        <Input
          type="number"
          min={minStake}
          max={maxStake}
          step="0.01"
          value={stake}
          onChange={(e) => handleStakeChange(e.target.value)}
          disabled={disabled}
          className={`flex-1 border-gray-700 bg-gray-900 text-white ${
            !isValid || !hasBalance ? 'border-red-500' : ''
          }`}
        />
        <span className="flex items-center px-3 border border-gray-700 rounded-md bg-gray-900 text-white text-sm">
          {currency}
        </span>
      </div>
      
      {/* Validation Messages */}
      <div className="space-y-1">
        {!isValid && (
          <p className="text-xs text-red-400">
            Stake must be between {minStake} and {maxStake} {currency}
          </p>
        )}
        {!hasBalance && balance !== undefined && (
          <p className="text-xs text-red-400">
            Insufficient balance. Available: {balance.toFixed(2)} {currency}
          </p>
        )}
        {isValid && hasBalance && (
          <p className="text-xs text-gray-500">
            Min: {minStake} {currency} • Max: {maxStake} {currency}
            {balance !== undefined && ` • Balance: ${balance.toFixed(2)} ${currency}`}
          </p>
        )}
      </div>

      {/* Quick Stake Buttons */}
      <div className="flex gap-2">
        <QuickStakeButton
          label="Min"
          value={minStake}
          onClick={() => onStakeChange(minStake)}
          disabled={disabled}
        />
        {balance !== undefined && balance >= 10 && (
          <QuickStakeButton
            label="10"
            value={10}
            onClick={() => onStakeChange(10)}
            disabled={disabled}
          />
        )}
        {balance !== undefined && balance >= 50 && (
          <QuickStakeButton
            label="50"
            value={50}
            onClick={() => onStakeChange(50)}
            disabled={disabled}
          />
        )}
        {balance !== undefined && balance >= 100 && (
          <QuickStakeButton
            label="100"
            value={100}
            onClick={() => onStakeChange(100)}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  )
}

interface QuickStakeButtonProps {
  label: string
  value: number
  onClick: () => void
  disabled?: boolean
}

function QuickStakeButton({ label, onClick, disabled }: QuickStakeButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-1 text-xs border border-gray-700 rounded bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {label}
    </button>
  )
}

// Helper Functions

function getDurationHint(duration: number, unit: DurationUnit): string {
  const unitNames = {
    s: 'second',
    m: 'minute',
    h: 'hour',
  }
  const unitName = unitNames[unit]
  const plural = duration !== 1 ? 's' : ''
  
  return `Trade will last ${duration} ${unitName}${plural}`
}
