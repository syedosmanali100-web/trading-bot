// Deriv API Configuration
export const DERIV_CONFIG = {
  APP_ID: '124906',
  API_KEY: '5Y3elgqgq9nRsmk',
  OAUTH_URL: 'https://oauth.deriv.com/oauth2/authorize',
  API_URL: 'wss://ws.derivws.com/websockets/v3',
  REDIRECT_URI: process.env.NEXT_PUBLIC_APP_URL + '/api/auth/deriv/callback',
  
  // Your referral link (you need to provide this)
  REFERRAL_LINK: 'https://deriv.com/signup/?affiliate_token=YOUR_AFFILIATE_TOKEN',
  
  // OAuth Scopes
  SCOPES: ['read', 'trade', 'trading_information', 'payments', 'admin'],
}

// WebSocket connection to Deriv API
export class DerivAPI {
  private ws: WebSocket | null = null
  private messageHandlers: Map<number, (data: any) => void> = new Map()
  private requestId = 1
  private token: string

  constructor(token: string) {
    this.token = token
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`${DERIV_CONFIG.API_URL}?app_id=${DERIV_CONFIG.APP_ID}`)
      
      this.ws.onopen = () => {
        console.log('Connected to Deriv API')
        resolve()
      }
      
      this.ws.onerror = (error) => {
        console.error('Deriv WebSocket error:', error)
        reject(error)
      }
      
      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        const handler = this.messageHandlers.get(data.req_id)
        if (handler) {
          handler(data)
          this.messageHandlers.delete(data.req_id)
        }
      }
    })
  }

  private send(request: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'))
        return
      }

      const reqId = this.requestId++
      request.req_id = reqId
      
      this.messageHandlers.set(reqId, (data) => {
        if (data.error) {
          reject(data.error)
        } else {
          resolve(data)
        }
      })

      this.ws.send(JSON.stringify(request))
    })
  }

  // Authorize with token
  async authorize(): Promise<any> {
    return this.send({
      authorize: this.token
    })
  }

  // Get account balance
  async getBalance(): Promise<any> {
    return this.send({
      balance: 1,
      subscribe: 1
    })
  }

  // Get active symbols (assets)
  async getActiveSymbols(): Promise<any> {
    return this.send({
      active_symbols: 'brief',
      product_type: 'basic'
    })
  }

  // Get ticks (price data)
  async subscribeTicks(symbol: string): Promise<any> {
    return this.send({
      ticks: symbol,
      subscribe: 1
    })
  }

  // Get candles (OHLC data)
  async getCandles(symbol: string, granularity: number = 60, count: number = 1000): Promise<any> {
    return this.send({
      ticks_history: symbol,
      adjust_start_time: 1,
      count: count,
      end: 'latest',
      granularity: granularity,
      style: 'candles'
    })
  }

  // Buy contract
  async buyContract(params: {
    symbol: string
    contract_type: 'CALL' | 'PUT'
    duration: number
    duration_unit: 's' | 'm' | 'h' | 'd'
    amount: number
    basis: 'stake' | 'payout'
  }): Promise<any> {
    return this.send({
      buy: 1,
      price: params.amount,
      parameters: {
        amount: params.amount,
        basis: params.basis,
        contract_type: params.contract_type,
        currency: 'USD',
        duration: params.duration,
        duration_unit: params.duration_unit,
        symbol: params.symbol
      }
    })
  }

  // Get open positions
  async getOpenPositions(): Promise<any> {
    return this.send({
      portfolio: 1
    })
  }

  // Sell contract
  async sellContract(contractId: number, price: number): Promise<any> {
    return this.send({
      sell: contractId,
      price: price
    })
  }

  // Get profit table
  async getProfitTable(limit: number = 50): Promise<any> {
    return this.send({
      profit_table: 1,
      limit: limit,
      sort: 'DESC'
    })
  }

  // Get statement (transaction history)
  async getStatement(limit: number = 50): Promise<any> {
    return this.send({
      statement: 1,
      limit: limit
    })
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

// OAuth helper functions
export function getDerivOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    app_id: DERIV_CONFIG.APP_ID,
    l: 'EN',
    brand: 'deriv',
    redirect_uri: DERIV_CONFIG.REDIRECT_URI,
    state: state,
    response_type: 'code'
  })
  
  return `${DERIV_CONFIG.OAUTH_URL}?${params.toString()}`
}

// Server-side Deriv API (Node.js)
export class DerivAPIServer {
  private token: string

  constructor(token: string) {
    this.token = token
  }

  private async fetch(endpoint: string, params: any = {}): Promise<any> {
    const ws = await import('ws')
    
    return new Promise((resolve, reject) => {
      const socket = new ws.WebSocket(`${DERIV_CONFIG.API_URL}?app_id=${DERIV_CONFIG.APP_ID}`)
      
      socket.on('open', () => {
        socket.send(JSON.stringify({ ...params, req_id: 1 }))
      })
      
      socket.on('message', (data: any) => {
        const response = JSON.parse(data.toString())
        if (response.error) {
          reject(response.error)
        } else {
          resolve(response)
        }
        socket.close()
      })
      
      socket.on('error', reject)
    })
  }

  async authorize() {
    return this.fetch('authorize', { authorize: this.token })
  }

  async getBalance() {
    return this.fetch('balance', { balance: 1 })
  }

  async getActiveSymbols() {
    return this.fetch('active_symbols', { 
      active_symbols: 'brief',
      product_type: 'basic'
    })
  }
}
