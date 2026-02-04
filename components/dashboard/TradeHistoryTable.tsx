/**
 * Trade History Table Component
 * Displays recent trades with fixed header, scrollable body, and color-coded rows
 */

'use client'

import { Trade } from '@/types/dashboard'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TrendingUp, TrendingDown, Clock, CheckCircle, XCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface TradeHistoryTableProps {
  trades: Trade[]
  onLoadMore?: () => void
}

export function TradeHistoryTable({ trades, onLoadMore }: TradeHistoryTableProps) {
  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    } catch {
      return timestamp
    }
  }

  const getStatusIcon = (status: Trade['status']) => {
    switch (status) {
      case 'WIN':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'LOSS':
        return <XCircle className="w-4 h-4 text-red-400" />
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-400 animate-pulse" />
    }
  }

  const getStatusColor = (status: Trade['status']) => {
    switch (status) {
      case 'WIN':
        return 'text-green-400'
      case 'LOSS':
        return 'text-red-400'
      case 'PENDING':
        return 'text-yellow-400'
    }
  }

  const getRowColor = (status: Trade['status']) => {
    switch (status) {
      case 'WIN':
        return 'bg-green-900/10 hover:bg-green-900/20'
      case 'LOSS':
        return 'bg-red-900/10 hover:bg-red-900/20'
      case 'PENDING':
        return 'bg-yellow-900/10 hover:bg-yellow-900/20'
    }
  }

  if (trades.length === 0) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-8">
        <div className="text-center">
          <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">No Trades Yet</h3>
          <p className="text-gray-500 text-sm">
            Your trade history will appear here once you start trading
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg overflow-hidden">
      <ScrollArea className="h-[400px]">
        <Table>
          <TableHeader className="sticky top-0 bg-gray-800 z-10">
            <TableRow className="border-gray-700 hover:bg-gray-800">
              <TableHead className="text-gray-300 font-semibold">Asset</TableHead>
              <TableHead className="text-gray-300 font-semibold">Type</TableHead>
              <TableHead className="text-gray-300 font-semibold text-right">Stake</TableHead>
              <TableHead className="text-gray-300 font-semibold text-right">P/L</TableHead>
              <TableHead className="text-gray-300 font-semibold">Status</TableHead>
              <TableHead className="text-gray-300 font-semibold">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.map((trade) => (
              <TableRow
                key={trade.id}
                className={`border-gray-700 ${getRowColor(trade.status)} transition-colors`}
              >
                <TableCell className="font-medium text-white">{trade.asset}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {trade.type === 'CALL' ? (
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    )}
                    <span
                      className={
                        trade.type === 'CALL' ? 'text-green-400' : 'text-red-400'
                      }
                    >
                      {trade.type}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right text-gray-300">
                  {trade.stake.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={`font-semibold ${
                      trade.profit_loss >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {trade.profit_loss >= 0 ? '+' : ''}
                    {trade.profit_loss.toFixed(2)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(trade.status)}
                    <span className={`text-sm ${getStatusColor(trade.status)}`}>
                      {trade.status}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-gray-400 text-sm">
                  {formatTime(trade.entry_time)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>

      {/* Load More Button */}
      {onLoadMore && (
        <div className="p-4 border-t border-gray-700 bg-gray-800/30">
          <button
            onClick={onLoadMore}
            className="w-full py-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Load More Trades
          </button>
        </div>
      )}
    </div>
  )
}
