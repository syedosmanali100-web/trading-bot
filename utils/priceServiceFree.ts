// FREE Real-time price service (no API key required)
// Uses exchangerate-api.com and fcsapi.com free tiers

export const fetchCurrentPriceFree = async (symbol: string): Promise<number | null> => {
  try {
    const baseCurrency = symbol.slice(0, 3)
    const quoteCurrency = symbol.slice(3, 6)
    
    // Try multiple free APIs in order
    
    // 1. Try exchangerate-api.com (no key required, 1500 requests/month free)
    try {
      const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`
      )
      if (response.ok) {
        const data = await response.json()
        if (data.rates && data.rates[quoteCurrency]) {
          return Number(data.rates[quoteCurrency].toFixed(5))
        }
      }
    } catch (e) {
      console.log('exchangerate-api failed, trying next...')
    }
    
    // 2. Try frankfurter.app (free, no limits, EU-based)
    try {
      const response = await fetch(
        `https://api.frankfurter.app/latest?from=${baseCurrency}&to=${quoteCurrency}`
      )
      if (response.ok) {
        const data = await response.json()
        if (data.rates && data.rates[quoteCurrency]) {
          return Number(data.rates[quoteCurrency].toFixed(5))
        }
      }
    } catch (e) {
      console.log('frankfurter failed, trying next...')
    }
    
    // 3. Try fixer.io free tier (1000 requests/month)
    try {
      const response = await fetch(
        `https://api.fixer.io/latest?base=${baseCurrency}&symbols=${quoteCurrency}`
      )
      if (response.ok) {
        const data = await response.json()
        if (data.rates && data.rates[quoteCurrency]) {
          return Number(data.rates[quoteCurrency].toFixed(5))
        }
      }
    } catch (e) {
      console.log('fixer failed')
    }
    
    return null
  } catch (error) {
    console.error('Error fetching price:', error)
    return null
  }
}

// Simulated real-time updates with actual market-like behavior
export class SimulatedPriceService {
  private intervals: Map<string, NodeJS.Timeout> = new Map()
  private callbacks: Map<string, (price: number) => void> = new Map()
  private lastPrices: Map<string, number> = new Map()
  
  // Base prices for common pairs
  private basePrices: Record<string, number> = {
    'EURUSD': 1.0850,
    'GBPUSD': 1.2650,
    'USDJPY': 149.50,
    'AUDUSD': 0.6550,
    'USDCAD': 1.3550,
  }

  public async startRealTimeUpdates(symbol: string, callback: (price: number) => void) {
    // First, try to get real price
    const realPrice = await fetchCurrentPriceFree(symbol)
    const startPrice = realPrice || this.basePrices[symbol] || 1.0000
    
    this.lastPrices.set(symbol, startPrice)
    this.callbacks.set(symbol, callback)
    
    // Initial callback
    callback(startPrice)
    
    // Update every 500ms with realistic market movements
    const interval = setInterval(async () => {
      let currentPrice = this.lastPrices.get(symbol) || startPrice
      
      // Every 10 seconds, try to fetch real price
      if (Math.random() > 0.95) {
        const newRealPrice = await fetchCurrentPriceFree(symbol)
        if (newRealPrice) {
          currentPrice = newRealPrice
        }
      }
      
      // Simulate realistic micro-movements (0.0001 to 0.0003)
      const volatility = 0.0002
      const trend = (Math.random() - 0.5) * 2 // -1 to 1
      const change = trend * volatility * (0.5 + Math.random() * 0.5)
      
      const newPrice = Number((currentPrice + change).toFixed(5))
      this.lastPrices.set(symbol, newPrice)
      
      const cb = this.callbacks.get(symbol)
      if (cb) {
        cb(newPrice)
      }
    }, 500) // Update every 500ms for smooth real-time feel
    
    this.intervals.set(symbol, interval)
  }

  public stopRealTimeUpdates(symbol: string) {
    const interval = this.intervals.get(symbol)
    if (interval) {
      clearInterval(interval)
      this.intervals.delete(symbol)
    }
    this.callbacks.delete(symbol)
    this.lastPrices.delete(symbol)
  }

  public disconnect() {
    this.intervals.forEach(interval => clearInterval(interval))
    this.intervals.clear()
    this.callbacks.clear()
    this.lastPrices.clear()
  }
}

// Singleton instance
let simulatedServiceInstance: SimulatedPriceService | null = null

export const getSimulatedPriceService = () => {
  if (typeof window === 'undefined') return null
  
  if (!simulatedServiceInstance) {
    simulatedServiceInstance = new SimulatedPriceService()
  }
  return simulatedServiceInstance
}
