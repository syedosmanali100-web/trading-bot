/**
 * Trading Terminal Component
 * Integrates ManualTradingPanel, AutoTradingPanel, and DerivChartEmbed
 * with mode selector and responsive layout
 */

'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ManualTradingPanel } from './ManualTradingPanel'
import { AutoTradingPanel } from './AutoTradingPanel'
import { DerivChartEmbed } from './DerivChartEmbed'
import { DerivSymbol, TradeConfig, BotStrategy, TradingMode } from '@/types/dashboard'
import { Hand, Bot } from 'lucide-react'

interface TradingTerminalProps {
  symbols: DerivSymbol[]
  balance?: number
  currency?: string
  onTrade: (config: TradeConfig) => Promise<void>
  onBotStart: (strategy: BotStrategy) => void
  onBotStop: () => void
  isBotActive?: boolean
  botTradesExecuted?: number
  botProfitToday?: number
  disabled?: boolean
}

export function TradingTerminal({
  symbols,
  balance,
  currency = 'USD',
  onTrade,
  onBotStart,
  onBotStop,
  isBotActive = false,
  botTradesExecuted = 0,
  botProfitToday = 0,
  disabled = false,
}: TradingTerminalProps) {
  const [mode, setMode] = useState<TradingMode>('manual')
  const [selectedAsset, setSelectedAsset] = useState<string>(
    symbols.length > 0 ? symbols[0].symbol : 'EUR/USD'
  )

  // Handle asset change from manual trading panel
  const handleAssetChange = (asset: string) => {
    setSelectedAsset(asset)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Trading Controls - Left Panel (1/3 width on desktop) */}
      <div className="lg:col-span-1">
        <Tabs value={mode} onValueChange={(value) => setMode(value as TradingMode)}>
          <TabsList className="grid w-full grid-cols-2 bg-gray-800 border border-gray-700">
            <TabsTrigger
              value="manual"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Hand className="w-4 h-4 mr-2" />
              Manual
            </TabsTrigger>
            <TabsTrigger
              value="auto"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              <Bot className="w-4 h-4 mr-2" />
              Auto
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="mt-4">
            <ManualTradingPanel
              symbols={symbols}
              balance={balance}
              currency={currency}
              onTrade={onTrade}
              disabled={disabled || isBotActive}
            />
          </TabsContent>

          <TabsContent value="auto" className="mt-4">
            <AutoTradingPanel
              isActive={isBotActive}
              tradesExecuted={botTradesExecuted}
              profitToday={botProfitToday}
              onStart={onBotStart}
              onStop={onBotStop}
              disabled={disabled}
            />
          </TabsContent>
        </Tabs>

        {/* Warning when bot is active */}
        {isBotActive && mode === 'manual' && (
          <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
            <p className="text-sm text-yellow-400 text-center">
              Manual trading is disabled while the bot is active
            </p>
          </div>
        )}
      </div>

      {/* Chart - Right Panel (2/3 width on desktop) */}
      <div className="lg:col-span-2">
        <div className="h-[600px] lg:h-full">
          <DerivChartEmbed
            symbol={selectedAsset}
            theme="dark"
            interval="1m"
            className="h-full"
          />
        </div>
      </div>
    </div>
  )
}
