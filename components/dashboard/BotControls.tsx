/**
 * Bot Controls Component
 * Start/stop button with confirmation, state management, and visual indicators
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Play, Square, Loader2, Activity } from 'lucide-react'
import { BotStrategy } from '@/types/dashboard'

interface BotControlsProps {
  isActive: boolean
  strategy: BotStrategy
  tradesExecuted: number
  profitToday: number
  onStart: () => void
  onStop: () => void
  disabled?: boolean
}

export function BotControls({
  isActive,
  strategy,
  tradesExecuted,
  profitToday,
  onStart,
  onStop,
  disabled = false,
}: BotControlsProps) {
  const [showStartDialog, setShowStartDialog] = useState(false)
  const [showStopDialog, setShowStopDialog] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleStartClick = () => {
    setShowStartDialog(true)
  }

  const handleStopClick = () => {
    setShowStopDialog(true)
  }

  const handleConfirmStart = async () => {
    setIsProcessing(true)
    setShowStartDialog(false)
    try {
      await onStart()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConfirmStop = async () => {
    setIsProcessing(true)
    setShowStopDialog(false)
    try {
      await onStop()
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Bot Status Indicator */}
      {isActive && (
        <div className="p-3 bg-green-900/20 border border-green-700/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-green-400 animate-pulse" />
            <span className="text-sm font-medium text-green-400">Bot Active</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-400">Trades Today:</span>
              <span className="ml-2 text-white font-medium">{tradesExecuted}</span>
            </div>
            <div>
              <span className="text-gray-400">Profit:</span>
              <span
                className={`ml-2 font-medium ${
                  profitToday >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {profitToday >= 0 ? '+' : ''}
                {profitToday.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Start/Stop Button */}
      {!isActive ? (
        <Button
          onClick={handleStartClick}
          disabled={disabled || isProcessing}
          className="w-full h-14 text-lg font-bold bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-500 transition-all duration-200 shadow-lg hover:shadow-green-500/50"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Starting Bot...
            </>
          ) : (
            <>
              <Play className="w-5 h-5 mr-2" />
              Start Auto Trading
            </>
          )}
        </Button>
      ) : (
        <Button
          onClick={handleStopClick}
          disabled={disabled || isProcessing}
          className="w-full h-14 text-lg font-bold bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-500 transition-all duration-200 shadow-lg hover:shadow-red-500/50"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Stopping Bot...
            </>
          ) : (
            <>
              <Square className="w-5 h-5 mr-2" />
              Stop Auto Trading
            </>
          )}
        </Button>
      )}

      {/* Current Strategy Info */}
      <div className="p-3 bg-gray-800/30 border border-gray-700 rounded-lg">
        <div className="text-xs text-gray-400 mb-1">Current Strategy</div>
        <div className="text-sm font-medium text-white">{strategy.name}</div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-400">
          <div>
            Base Stake: <span className="text-white">{strategy.base_stake}</span>
          </div>
          <div>
            Max/Hour: <span className="text-white">{strategy.max_trades_per_hour}</span>
          </div>
        </div>
      </div>

      {/* Start Confirmation Dialog */}
      <AlertDialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Start Auto Trading Bot?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              The bot will start executing trades automatically using the{' '}
              <span className="font-medium text-white">{strategy.name}</span> strategy.
              <div className="mt-3 p-3 bg-gray-900/50 rounded border border-gray-700 space-y-1 text-sm">
                <div>• Base Stake: {strategy.base_stake}</div>
                <div>• Max Trades/Hour: {strategy.max_trades_per_hour}</div>
                <div>• Risk Per Trade: {strategy.risk_percentage}%</div>
                <div>• Stop Loss: {strategy.stop_loss}</div>
              </div>
              <div className="mt-3 text-yellow-400 text-sm">
                ⚠️ Make sure you have sufficient balance and understand the risks involved.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmStart}
              className="bg-green-600 hover:bg-green-700"
            >
              Start Bot
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stop Confirmation Dialog */}
      <AlertDialog open={showStopDialog} onOpenChange={setShowStopDialog}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Stop Auto Trading Bot?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              The bot will complete any pending trades and then stop executing new trades.
              <div className="mt-3 p-3 bg-gray-900/50 rounded border border-gray-700 space-y-1 text-sm">
                <div>• Trades Executed Today: {tradesExecuted}</div>
                <div
                  className={profitToday >= 0 ? 'text-green-400' : 'text-red-400'}
                >
                  • Profit Today: {profitToday >= 0 ? '+' : ''}
                  {profitToday.toFixed(2)}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmStop}
              className="bg-red-600 hover:bg-red-700"
            >
              Stop Bot
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
