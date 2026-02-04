/**
 * Deriv API Service Functions
 * Provides high-level API functions for trading operations
 */

import { getDerivWebSocket } from './deriv-websocket'
import {
  DerivBalance,
  DerivSymbol,
  TradeConfig,
  DerivBalanceResponse,
  DerivActiveSymbolsResponse,
  DerivBuyContractResponse,
  DerivAuthorizeResponse,
} from '@/types/dashboard'

/**
 * Get account balance
 */
export async function getBalance(): Promise<DerivBalance> {
  const ws = getDerivWebSocket()
  
  try {
    const response = await ws.send<DerivBalanceResponse>({
      balance: 1,
      subscribe: 1,
      msg_type: 'balance',
    })

    if (response.error) {
      throw new Error(response.error.message)
    }

    const { balance, currency } = response.balance

    return {
      balance,
      currency,
      display_balance: formatCurrency(balance, currency),
    }
  } catch (error) {
    console.error('Failed to get balance:', error)
    throw error
  }
}

/**
 * Get all available trading symbols
 */
export async function getActiveSymbols(): Promise<DerivSymbol[]> {
  const ws = getDerivWebSocket()
  
  try {
    const response = await ws.send<DerivActiveSymbolsResponse>({
      active_symbols: 'brief',
      product_type: 'basic',
      msg_type: 'active_symbols',
    })

    if (response.error) {
      throw new Error(response.error.message)
    }

    // Transform API response to our format
    const symbols: DerivSymbol[] = response.active_symbols
      .filter((symbol) => symbol.exchange_is_open === 1 && symbol.is_trading_suspended === 0)
      .map((symbol) => ({
        symbol: symbol.symbol,
        name: symbol.display_name,
        market: symbol.market,
        submarket: symbol.submarket,
        pip: symbol.pip,
        decimal_places: getDecimalPlaces(symbol.pip),
      }))

    return symbols
  } catch (error) {
    console.error('Failed to get active symbols:', error)
    throw error
  }
}

/**
 * Execute a trade (buy contract)
 */
export async function buyContract(config: TradeConfig): Promise<DerivBuyContractResponse> {
  const ws = getDerivWebSocket()
  
  try {
    const response = await ws.send<DerivBuyContractResponse>({
      buy: 1,
      price: config.stake,
      parameters: {
        contract_type: config.type,
        symbol: config.asset,
        duration: config.duration,
        duration_unit: config.duration_unit,
        basis: 'stake',
        amount: config.stake,
      },
      msg_type: 'buy',
    })

    if (response.error) {
      throw new Error(response.error.message)
    }

    return response
  } catch (error) {
    console.error('Failed to buy contract:', error)
    throw error
  }
}

/**
 * Subscribe to balance updates
 */
export function subscribeToBalance(callback: (balance: DerivBalance) => void): () => void {
  const ws = getDerivWebSocket()
  
  const unsubscribe = ws.on('balance', (message: DerivBalanceResponse) => {
    if (message.balance) {
      const { balance, currency } = message.balance
      callback({
        balance,
        currency,
        display_balance: formatCurrency(balance, currency),
      })
    }
  })

  // Send initial subscription request
  ws.send({
    balance: 1,
    subscribe: 1,
    msg_type: 'balance',
  }).catch((error) => {
    console.error('Failed to subscribe to balance:', error)
  })

  return unsubscribe
}

/**
 * Subscribe to price updates for a symbol
 */
export function subscribeToPrices(
  symbol: string,
  callback: (price: { bid: number; ask: number; quote: number }) => void
): () => void {
  const ws = getDerivWebSocket()
  
  const unsubscribe = ws.on('tick', (message: any) => {
    if (message.tick && message.tick.symbol === symbol) {
      callback({
        bid: message.tick.bid,
        ask: message.tick.ask,
        quote: message.tick.quote,
      })
    }
  })

  // Send initial subscription request
  ws.send({
    ticks: symbol,
    subscribe: 1,
    msg_type: 'ticks',
  }).catch((error) => {
    console.error('Failed to subscribe to prices:', error)
  })

  return unsubscribe
}

/**
 * Get proposal (price quote) for a trade
 */
export async function getProposal(config: TradeConfig): Promise<{
  ask_price: number
  payout: number
  spot: number
}> {
  const ws = getDerivWebSocket()
  
  try {
    const response = await ws.send<any>({
      proposal: 1,
      amount: config.stake,
      basis: 'stake',
      contract_type: config.type,
      currency: 'USD',
      duration: config.duration,
      duration_unit: config.duration_unit,
      symbol: config.asset,
      msg_type: 'proposal',
    })

    if (response.error) {
      throw new Error(response.error.message)
    }

    return {
      ask_price: response.proposal.ask_price,
      payout: response.proposal.payout,
      spot: response.proposal.spot,
    }
  } catch (error) {
    console.error('Failed to get proposal:', error)
    throw error
  }
}

/**
 * Get trading times for a symbol
 */
export async function getTradingTimes(symbol: string): Promise<any> {
  const ws = getDerivWebSocket()
  
  try {
    const response = await ws.send<any>({
      trading_times: new Date().toISOString().split('T')[0],
      msg_type: 'trading_times',
    })

    if (response.error) {
      throw new Error(response.error.message)
    }

    return response.trading_times
  } catch (error) {
    console.error('Failed to get trading times:', error)
    throw error
  }
}

/**
 * Authorize with API token
 */
export async function authorize(token: string): Promise<DerivAuthorizeResponse> {
  const ws = getDerivWebSocket()
  
  try {
    const response = await ws.authorize(token)
    
    if (response.error) {
      throw new Error(response.error.message)
    }

    return response
  } catch (error) {
    console.error('Failed to authorize:', error)
    throw error
  }
}

/**
 * Get account statement (transaction history)
 */
export async function getStatement(limit: number = 50): Promise<any[]> {
  const ws = getDerivWebSocket()
  
  try {
    const response = await ws.send<any>({
      statement: 1,
      description: 1,
      limit,
      msg_type: 'statement',
    })

    if (response.error) {
      throw new Error(response.error.message)
    }

    return response.statement.transactions || []
  } catch (error) {
    console.error('Failed to get statement:', error)
    throw error
  }
}

/**
 * Get profit table (completed trades)
 */
export async function getProfitTable(limit: number = 50): Promise<any[]> {
  const ws = getDerivWebSocket()
  
  try {
    const response = await ws.send<any>({
      profit_table: 1,
      description: 1,
      limit,
      msg_type: 'profit_table',
    })

    if (response.error) {
      throw new Error(response.error.message)
    }

    return response.profit_table.transactions || []
  } catch (error) {
    console.error('Failed to get profit table:', error)
    throw error
  }
}

/**
 * Sell a contract (close position)
 */
export async function sellContract(contractId: number, price?: number): Promise<any> {
  const ws = getDerivWebSocket()
  
  try {
    const response = await ws.send<any>({
      sell: contractId,
      price: price || 0,
      msg_type: 'sell',
    })

    if (response.error) {
      throw new Error(response.error.message)
    }

    return response.sell
  } catch (error) {
    console.error('Failed to sell contract:', error)
    throw error
  }
}

// Utility Functions

/**
 * Format currency value
 */
export function formatCurrency(amount: number, currency: string): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return formatter.format(amount)
}

/**
 * Get decimal places from pip value
 */
function getDecimalPlaces(pip: number): number {
  if (pip >= 1) return 0
  if (pip >= 0.1) return 1
  if (pip >= 0.01) return 2
  if (pip >= 0.001) return 3
  if (pip >= 0.0001) return 4
  return 5
}

/**
 * Format trade duration
 */
export function formatDuration(duration: number, unit: 's' | 'm' | 'h'): string {
  const unitNames = {
    s: 'second',
    m: 'minute',
    h: 'hour',
  }
  const unitName = unitNames[unit]
  return `${duration} ${unitName}${duration !== 1 ? 's' : ''}`
}

/**
 * Parse Deriv error message
 */
export function parseDerivError(error: any): string {
  if (typeof error === 'string') return error
  if (error?.message) return error.message
  if (error?.error?.message) return error.error.message
  return 'An unknown error occurred'
}

/**
 * Check if market is open
 */
export function isMarketOpen(symbol: DerivSymbol): boolean {
  // This is a simplified check
  // In production, you'd want to check against trading_times API
  return true
}

/**
 * Group symbols by market
 */
export function groupSymbolsByMarket(symbols: DerivSymbol[]): Record<string, DerivSymbol[]> {
  return symbols.reduce((acc, symbol) => {
    if (!acc[symbol.market]) {
      acc[symbol.market] = []
    }
    acc[symbol.market].push(symbol)
    return acc
  }, {} as Record<string, DerivSymbol[]>)
}

/**
 * Filter symbols by search query
 */
export function filterSymbols(symbols: DerivSymbol[], query: string): DerivSymbol[] {
  const lowerQuery = query.toLowerCase()
  return symbols.filter(
    (symbol) =>
      symbol.name.toLowerCase().includes(lowerQuery) ||
      symbol.symbol.toLowerCase().includes(lowerQuery) ||
      symbol.market.toLowerCase().includes(lowerQuery)
  )
}
