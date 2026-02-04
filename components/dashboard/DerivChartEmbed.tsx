/**
 * Deriv Chart Embed Component
 * Iframe component with Deriv chart URL, responsive sizing, and fallback
 * Syncs with asset selection and handles chart reload on asset change
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { TrendingUp, AlertCircle, RefreshCw } from 'lucide-react'

interface DerivChartEmbedProps {
  symbol: string
  theme?: 'dark' | 'light'
  interval?: string
  className?: string
  onSymbolChange?: (symbol: string) => void
}

export function DerivChartEmbed({
  symbol,
  theme = 'dark',
  interval = '1m',
  className = '',
  onSymbolChange,
}: DerivChartEmbedProps) {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentSymbol, setCurrentSymbol] = useState(symbol)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const previousSymbolRef = useRef(symbol)

  // Construct Deriv chart URL
  const chartUrl = `https://charts.deriv.com/?symbol=${encodeURIComponent(
    currentSymbol
  )}&theme=${theme}&interval=${interval}`

  // Handle symbol changes - reload chart when asset changes
  useEffect(() => {
    if (symbol !== previousSymbolRef.current) {
      // Symbol changed, trigger reload
      setIsLoading(true)
      setHasError(false)
      setCurrentSymbol(symbol)
      previousSymbolRef.current = symbol

      // Notify parent component of symbol change
      if (onSymbolChange) {
        onSymbolChange(symbol)
      }

      // Force iframe reload by updating key
      if (iframeRef.current) {
        iframeRef.current.src = `https://charts.deriv.com/?symbol=${encodeURIComponent(
          symbol
        )}&theme=${theme}&interval=${interval}`
      }
    }
  }, [symbol, theme, interval, onSymbolChange])

  const handleLoad = () => {
    setIsLoading(false)
    setHasError(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  const handleRetry = () => {
    setHasError(false)
    setIsLoading(true)
    // Force reload
    if (iframeRef.current) {
      iframeRef.current.src = chartUrl
    }
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-700">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-400 text-sm">Loading chart...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm rounded-lg border border-red-700/50">
          <div className="text-center p-6">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Chart Failed to Load</h3>
            <p className="text-gray-400 text-sm mb-4">
              Unable to load the Deriv chart for {symbol}
            </p>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Chart Iframe */}
      <iframe
        ref={iframeRef}
        src={chartUrl}
        key={currentSymbol} // Force remount on symbol change
        title={`${currentSymbol} Trading Chart`}
        className="w-full h-full rounded-lg border border-gray-700"
        onLoad={handleLoad}
        onError={handleError}
        allow="fullscreen"
        style={{
          minHeight: '400px',
          display: hasError ? 'none' : 'block',
        }}
      />

      {/* Chart Header */}
      <div className="absolute top-3 left-3 bg-gray-900/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-gray-700">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          <span className="text-white font-medium text-sm">{currentSymbol}</span>
          <span className="text-gray-400 text-xs">• {interval}</span>
          {isLoading && (
            <RefreshCw className="w-3 h-3 text-blue-400 animate-spin" />
          )}
        </div>
      </div>
    </div>
  )
}
