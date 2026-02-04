/**
 * Asset Selector Component
 * Dropdown for selecting trading assets with search and grouping
 */

'use client'

import { useState, useMemo } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { DerivSymbol } from '@/types/dashboard'
import { Search, TrendingUp } from 'lucide-react'

interface AssetSelectorProps {
  symbols: DerivSymbol[]
  selectedSymbol: string
  onSymbolChange: (symbol: string) => void
  disabled?: boolean
}

export function AssetSelector({
  symbols,
  selectedSymbol,
  onSymbolChange,
  disabled = false,
}: AssetSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Group symbols by market
  const groupedSymbols = useMemo(() => {
    const filtered = symbols.filter((symbol) => {
      const query = searchQuery.toLowerCase()
      return (
        symbol.name.toLowerCase().includes(query) ||
        symbol.symbol.toLowerCase().includes(query) ||
        symbol.market.toLowerCase().includes(query)
      )
    })

    return filtered.reduce((acc, symbol) => {
      const market = symbol.market
      if (!acc[market]) {
        acc[market] = []
      }
      acc[market].push(symbol)
      return acc
    }, {} as Record<string, DerivSymbol[]>)
  }, [symbols, searchQuery])

  // Get market display name
  const getMarketDisplayName = (market: string): string => {
    const names: Record<string, string> = {
      forex: 'Forex',
      cryptocurrency: 'Cryptocurrency',
      commodities: 'Commodities',
      indices: 'Indices',
      synthetic_index: 'Synthetic Indices',
    }
    return names[market] || market.charAt(0).toUpperCase() + market.slice(1)
  }

  // Get selected symbol details
  const selectedSymbolDetails = symbols.find((s) => s.symbol === selectedSymbol)

  return (
    <div className="space-y-2">
      <Label className="text-gray-300 flex items-center gap-2">
        <TrendingUp className="w-4 h-4" />
        Asset Pair
      </Label>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          type="text"
          placeholder="Search assets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={disabled}
          className="pl-10 border-gray-700 bg-gray-900 text-white placeholder:text-gray-500"
        />
      </div>

      {/* Asset Dropdown */}
      <select
        value={selectedSymbol}
        onChange={(e) => onSymbolChange(e.target.value)}
        disabled={disabled}
        className="w-full p-3 border border-gray-700 rounded-md bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {Object.entries(groupedSymbols).map(([market, marketSymbols]) => (
          <optgroup key={market} label={getMarketDisplayName(market)}>
            {marketSymbols.map((symbol) => (
              <option key={symbol.symbol} value={symbol.symbol}>
                {symbol.name} ({symbol.symbol})
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {/* Selected Symbol Info */}
      {selectedSymbolDetails && (
        <div className="text-xs text-gray-400 flex items-center justify-between px-1">
          <span>Market: {getMarketDisplayName(selectedSymbolDetails.market)}</span>
          <span>Pip: {selectedSymbolDetails.pip}</span>
        </div>
      )}

      {/* No Results Message */}
      {searchQuery && Object.keys(groupedSymbols).length === 0 && (
        <div className="text-sm text-gray-500 text-center py-4">
          No assets found matching "{searchQuery}"
        </div>
      )}
    </div>
  )
}
