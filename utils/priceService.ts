// Real-time price service for forex pairs
export class PriceService {
  private ws: WebSocket | null = null
  private callbacks: Map<string, (price: number) => void> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 2000

  constructor() {
    if (typeof window !== 'undefined') {
      this.connect()
    }
  }

  private connect() {
    try {
      // Using Finnhub WebSocket for real-time forex data
      // Get your free API key from https://finnhub.io/
      const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || 'demo'
      this.ws = new WebSocket(`wss://ws.finnhub.io?token=${apiKey}`)

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected')
        this.reconnectAttempts = 0
        
        // Subscribe to all active pairs
        this.callbacks.forEach((_, symbol) => {
          this.subscribe(symbol)
        })
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'trade' && data.data) {
            data.data.forEach((trade: any) => {
              const symbol = trade.s.replace('OANDA:', '')
              const price = trade.p
              
              const callback = this.callbacks.get(symbol)
              if (callback && price) {
                callback(Number(price.toFixed(5)))
              }
            })
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      this.ws.onclose = () => {
        console.log('WebSocket disconnected')
        this.attemptReconnect()
      }
    } catch (error) {
      console.error('Error connecting WebSocket:', error)
      this.attemptReconnect()
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`)
      setTimeout(() => this.connect(), this.reconnectDelay)
    }
  }

  private subscribe(symbol: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Finnhub format: OANDA:EUR_USD
      const formattedSymbol = `OANDA:${symbol.slice(0, 3)}_${symbol.slice(3, 6)}`
      this.ws.send(JSON.stringify({ type: 'subscribe', symbol: formattedSymbol }))
      console.log(`📊 Subscribed to ${formattedSymbol}`)
    }
  }

  private unsubscribe(symbol: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const formattedSymbol = `OANDA:${symbol.slice(0, 3)}_${symbol.slice(3, 6)}`
      this.ws.send(JSON.stringify({ type: 'unsubscribe', symbol: formattedSymbol }))
      console.log(`📊 Unsubscribed from ${formattedSymbol}`)
    }
  }

  public onPriceUpdate(symbol: string, callback: (price: number) => void) {
    this.callbacks.set(symbol, callback)
    this.subscribe(symbol)
  }

  public removePriceUpdate(symbol: string) {
    this.unsubscribe(symbol)
    this.callbacks.delete(symbol)
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.callbacks.clear()
  }
}

// Singleton instance
let priceServiceInstance: PriceService | null = null

export const getPriceService = () => {
  if (typeof window === 'undefined') return null
  
  if (!priceServiceInstance) {
    priceServiceInstance = new PriceService()
  }
  return priceServiceInstance
}

// Fallback: Fetch from REST API if WebSocket fails
export const fetchCurrentPrice = async (symbol: string): Promise<number | null> => {
  try {
    // Using Finnhub REST API
    const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || 'demo'
    const formattedSymbol = `OANDA:${symbol.slice(0, 3)}_${symbol.slice(3, 6)}`
    
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${formattedSymbol}&token=${apiKey}`
    )
    
    if (!response.ok) throw new Error('Failed to fetch price')
    
    const data = await response.json()
    return data.c ? Number(data.c.toFixed(5)) : null
  } catch (error) {
    console.error('Error fetching price:', error)
    return null
  }
}
