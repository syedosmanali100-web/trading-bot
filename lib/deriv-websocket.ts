/**
 * Deriv WebSocket Connection Manager
 * Handles WebSocket connection, authentication, reconnection, and message handling
 */

import { 
  DerivAPIResponse, 
  DerivAuthorizeResponse, 
  WebSocketMessage 
} from '@/types/dashboard'

type MessageHandler = (message: any) => void
type ConnectionStateHandler = (isConnected: boolean) => void

export class DerivWebSocketManager {
  private ws: WebSocket | null = null
  private appId: string
  private endpoint: string
  private isConnected: boolean = false
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5
  private reconnectDelay: number = 3000
  private messageHandlers: Map<string, MessageHandler[]> = new Map()
  private connectionStateHandlers: ConnectionStateHandler[] = []
  private requestId: number = 0
  private pendingRequests: Map<number, { resolve: Function; reject: Function }> = new Map()

  constructor(appId: string = '1089') {
    this.appId = appId
    this.endpoint = `wss://ws.derivws.com/websockets/v3?app_id=${this.appId}`
  }

  /**
   * Connect to Deriv WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.endpoint)

        this.ws.onopen = () => {
          console.log('Deriv WebSocket connected')
          this.isConnected = true
          this.reconnectAttempts = 0
          this.notifyConnectionState(true)
          resolve()
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data)
        }

        this.ws.onerror = (error) => {
          console.error('Deriv WebSocket error:', error)
          this.isConnected = false
          this.notifyConnectionState(false)
        }

        this.ws.onclose = () => {
          console.log('Deriv WebSocket closed')
          this.isConnected = false
          this.notifyConnectionState(false)
          this.attemptReconnect()
        }
      } catch (error) {
        console.error('Failed to connect to Deriv WebSocket:', error)
        reject(error)
      }
    })
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
      this.isConnected = false
      this.notifyConnectionState(false)
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`)

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('Reconnection failed:', error)
      })
    }, delay)
  }

  /**
   * Send a message to Deriv API
   */
  send<T = any>(message: WebSocketMessage): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.ws) {
        reject(new Error('WebSocket is not connected'))
        return
      }

      const reqId = ++this.requestId
      const messageWithId = { ...message, req_id: reqId }

      this.pendingRequests.set(reqId, { resolve, reject })

      try {
        this.ws.send(JSON.stringify(messageWithId))
      } catch (error) {
        this.pendingRequests.delete(reqId)
        reject(error)
      }

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(reqId)) {
          this.pendingRequests.delete(reqId)
          reject(new Error('Request timeout'))
        }
      }, 30000)
    })
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data) as DerivAPIResponse

      // Handle request-response pattern
      if (message.req_id && this.pendingRequests.has(message.req_id)) {
        const { resolve, reject } = this.pendingRequests.get(message.req_id)!
        this.pendingRequests.delete(message.req_id)

        if (message.error) {
          reject(new Error(message.error.message))
        } else {
          resolve(message)
        }
      }

      // Notify message type handlers
      if (message.msg_type) {
        const handlers = this.messageHandlers.get(message.msg_type)
        if (handlers) {
          handlers.forEach((handler) => handler(message))
        }
      }

      // Notify wildcard handlers
      const wildcardHandlers = this.messageHandlers.get('*')
      if (wildcardHandlers) {
        wildcardHandlers.forEach((handler) => handler(message))
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error)
    }
  }

  /**
   * Subscribe to specific message types
   */
  on(messageType: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, [])
    }
    this.messageHandlers.get(messageType)!.push(handler)

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(messageType)
      if (handlers) {
        const index = handlers.indexOf(handler)
        if (index > -1) {
          handlers.splice(index, 1)
        }
      }
    }
  }

  /**
   * Subscribe to connection state changes
   */
  onConnectionStateChange(handler: ConnectionStateHandler): () => void {
    this.connectionStateHandlers.push(handler)

    // Return unsubscribe function
    return () => {
      const index = this.connectionStateHandlers.indexOf(handler)
      if (index > -1) {
        this.connectionStateHandlers.splice(index, 1)
      }
    }
  }

  /**
   * Notify all connection state handlers
   */
  private notifyConnectionState(isConnected: boolean): void {
    this.connectionStateHandlers.forEach((handler) => handler(isConnected))
  }

  /**
   * Authorize with API token
   */
  async authorize(token: string): Promise<DerivAuthorizeResponse> {
    const response = await this.send<DerivAuthorizeResponse>({
      authorize: token,
      msg_type: 'authorize',
    })
    return response
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected
  }

  /**
   * Reset reconnection attempts
   */
  resetReconnectAttempts(): void {
    this.reconnectAttempts = 0
  }
}

// Singleton instance
let derivWSInstance: DerivWebSocketManager | null = null

/**
 * Get or create Deriv WebSocket instance
 */
export function getDerivWebSocket(appId?: string): DerivWebSocketManager {
  if (!derivWSInstance) {
    derivWSInstance = new DerivWebSocketManager(appId)
  }
  return derivWSInstance
}

/**
 * React hook for Deriv WebSocket connection
 */
export function useDerivWebSocket() {
  const ws = getDerivWebSocket()
  
  return {
    connect: () => ws.connect(),
    disconnect: () => ws.disconnect(),
    send: <T = any>(message: WebSocketMessage) => ws.send<T>(message),
    on: (messageType: string, handler: MessageHandler) => ws.on(messageType, handler),
    onConnectionStateChange: (handler: ConnectionStateHandler) => 
      ws.onConnectionStateChange(handler),
    authorize: (token: string) => ws.authorize(token),
    isConnected: ws.getConnectionStatus(),
  }
}
