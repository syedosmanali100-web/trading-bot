/**
 * Account Metrics Component
 * Displays key trading metrics in card format
 */

import { Card, CardContent } from '@/components/ui/card'
import { DollarSign, Activity, Target, Coins } from 'lucide-react'
import { AccountMetricsProps } from '@/types/dashboard'

export function AccountMetrics({
  balance,
  currency,
  totalTrades,
  winRate,
  profitLoss,
}: AccountMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <BalanceCard balance={balance} currency={currency} />
      <TotalTradesCard totalTrades={totalTrades} />
      <WinRateCard winRate={winRate} />
      <ProfitLossCard profitLoss={profitLoss} />
    </div>
  )
}

interface BalanceCardProps {
  balance: number
  currency: string
}

export function BalanceCard({ balance, currency }: BalanceCardProps) {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return (
    <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Balance</p>
            <h3 className="text-2xl font-bold text-green-400 mt-1">
              {formatter.format(balance)}
            </h3>
          </div>
          <div className="p-3 bg-green-900/30 rounded-lg">
            <DollarSign className="w-6 h-6 text-green-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface TotalTradesCardProps {
  totalTrades: number
}

export function TotalTradesCard({ totalTrades }: TotalTradesCardProps) {
  return (
    <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Total Trades</p>
            <h3 className="text-2xl font-bold text-blue-400 mt-1">
              {totalTrades.toLocaleString()}
            </h3>
          </div>
          <div className="p-3 bg-blue-900/30 rounded-lg">
            <Activity className="w-6 h-6 text-blue-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface WinRateCardProps {
  winRate: number
}

export function WinRateCard({ winRate }: WinRateCardProps) {
  return (
    <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Win Rate</p>
            <h3 className="text-2xl font-bold text-purple-400 mt-1">
              {winRate.toFixed(1)}%
            </h3>
          </div>
          <div className="p-3 bg-purple-900/30 rounded-lg">
            <Target className="w-6 h-6 text-purple-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface ProfitLossCardProps {
  profitLoss: number
}

export function ProfitLossCard({ profitLoss }: ProfitLossCardProps) {
  const isProfit = profitLoss >= 0
  const colorClass = isProfit ? 'text-green-400' : 'text-red-400'

  return (
    <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Profit/Loss</p>
            <h3 className={`text-2xl font-bold ${colorClass} mt-1`}>
              {isProfit ? '+' : ''}${Math.abs(profitLoss).toFixed(2)}
            </h3>
          </div>
          <div className="p-3 bg-gray-700/30 rounded-lg">
            <Coins className="w-6 h-6 text-yellow-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
