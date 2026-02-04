"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TrendingUp,
  TrendingDown,
  Play,
  Pause,
  DollarSign,
  Zap,
  Target,
  Clock,
  CheckCircle2,
  XCircle,
  BarChart3,
  Activity,
} from "lucide-react"

// Deriv trading pairs (same as their platform)
const DERIV_PAIRS = [
  { symbol: "frxEURUSD", name: "EUR/USD", category: "Forex" },
  { symbol: "frxGBPUSD", name: "GBP/USD", category: "Forex" },
  { symbol: "frxUSDJPY", name: "USD/JPY", category: "Forex" },
  { symbol: "frxAUDUSD", name: "AUD/USD", category: "Forex" },
  { symbol: "frxUSDCAD", name: "USD/CAD", category: "Forex" },
  { symbol: "frxEURGBP", name: "EUR/GBP", category: "Forex" },
  { symbol: "frxUSDCHF", name: "USD/CHF", category: "Forex" },
  { symbol: "frxNZDUSD", name: "NZD/USD", category: "Forex" },
  { symbol: "R_10", name: "Volatility 10 Index", category: "Synthetics" },
  { symbol: "R_25", name: "Volatility 25 Index", category: "Synthetics" },
  { symbol: "R_50", name: "Volatility 50 Index", category: "Synthetics" },
  { symbol: "R_75", name: "Volatility 75 Index", category: "Synthetics" },
  { symbol: "R_100", name: "Volatility 100 Index", category: "Synthetics" },
  { symbol: "BOOM1000", name: "Boom 1000 Index", category: "Synthetics" },
  { symbol: "CRASH1000", name: "Crash 1000 Index", category: "Synthetics" },
]

// Contract durations
const DURATIONS = [
  { value: 1, label: "1 Minute", ticks: 5 },
  { value: 3, label: "3 Minutes", ticks: 15 },
  { value: 5, label: "5 Minutes", ticks: 25 },
  { value: 10, label: "10 Minutes", ticks: 50 },
  { value: 15, label: "15 Minutes", ticks: 75 },
]

// Trading strategies
const STRATEGIES = [
  { 
    id: "trend_follow", 
    name: "Trend Following",
    description: "Follows market momentum and trends",
    winRate: 72
  },
  { 
    id: "mean_revert", 
    name: "Mean Reversion",
    description: "Trades price returns to average",
    winRate: 68
  },
  { 
    id: "breakout", 
    name: "Breakout Trading",
    description: "Captures strong price movements",
    winRate: 75
  },
  { 
    id: "scalping", 
    name: "Scalping",
    description: "Quick small profits strategy",
    winRate: 65
  },
]

interface Trade {
  id: string
  symbol: string
  direction: "CALL" | "PUT"
  stake: number
  duration: number
  entryPrice: number
  currentPrice?: number
  exitPrice?: number
  profit?: number
  status: "PENDING" | "ACTIVE" | "WON" | "LOST"
  timestamp: number
  strategy?: string
}

interface DerivTradingPanelProps {
  isDeriv?: boolean
}

export default function DerivTradingPanel({ isDeriv = false }: DerivTradingPanelProps) {
  const [selectedPair, setSelectedPair] = useState("frxEURUSD")
  const [selectedDuration, setSelectedDuration] = useState(5)
  const [stakeAmount, setStakeAmount] = useState(10)
  const [tradingMode, setTradingMode] = useState<"manual" | "auto">("manual")
  const [selectedStrategy, setSelectedStrategy] = useState("trend_follow")
  const [isAutoTrading, setIsAutoTrading] = useState(false)
  const [currentPrice, setCurrentPrice] = useState(0)
  const [activeTrades, setActiveTrades] = useState<Trade[]>([])
  const [tradeHistory, setTradeHistory] = useState<Trade[]>([])
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null)

  // Initialize WebSocket connection to Deriv
  useEffect(() => {
    if (!isDeriv) return

    const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=124906')
    
    ws.onopen = () => {
      console.log('Connected to Deriv WebSocket')
      // Subscribe to tick stream for selected pair
      ws.send(JSON.stringify({
        ticks: selectedPair,
        subscribe: 1
      }))
    }

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data)
      
      if (data.tick) {
        setCurrentPrice(data.tick.quote)
        updateActiveTrades(data.tick.quote)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    setWsConnection(ws)

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
  }, [isDeriv, selectedPair])

  // Update active trades with current price
  const updateActiveTrades = (price: number) => {
    setActiveTrades(prev => prev.map(trade => ({
      ...trade,
      currentPrice: price,
      profit: trade.direction === "CALL"
        ? ((price - trade.entryPrice) / trade.entryPrice) * trade.stake
        : ((trade.entryPrice - price) / trade.entryPrice) * trade.stake
    })))
  }

  // Execute manual trade
  const executeTrade = async (direction: "CALL" | "PUT") => {
    if (!wsConnection || wsConnection.readyState !== WebSocket.OPEN) {
      console.error('Not connected to Deriv')
      return
    }

    const trade: Trade = {
      id: `trade_${Date.now()}`,
      symbol: selectedPair,
      direction,
      stake: stakeAmount,
      duration: selectedDuration,
      entryPrice: currentPrice,
      status: "ACTIVE",
      timestamp: Date.now(),
    }

    setActiveTrades(prev => [...prev, trade])

    // Send trade to Deriv API
    wsConnection.send(JSON.stringify({
      proposal: 1,
      amount: stakeAmount,
      basis: "stake",
      contract_type: direction === "CALL" ? "CALL" : "PUT",
      currency: "USD",
      duration: selectedDuration,
      duration_unit: "m",
      symbol: selectedPair,
    }))

    // Simulate trade completion (in production, this would come from Deriv's response)
    setTimeout(() => {
      completeTrade(trade.id)
    }, selectedDuration * 60 * 1000)
  }

  // Complete trade
  const completeTrade = (tradeId: string) => {
    setActiveTrades(prev => {
      const trade = prev.find(t => t.id === tradeId)
      if (!trade) return prev

      const exitPrice = currentPrice
      const profit = trade.direction === "CALL"
        ? ((exitPrice - trade.entryPrice) / trade.entryPrice) * trade.stake
        : ((trade.entryPrice - exitPrice) / trade.entryPrice) * trade.stake

      const completedTrade: Trade = {
        ...trade,
        exitPrice,
        profit,
        status: profit > 0 ? "WON" : "LOST",
      }

      setTradeHistory(prev => [completedTrade, ...prev].slice(0, 50))
      return prev.filter(t => t.id !== tradeId)
    })
  }

  // Auto trading logic
  useEffect(() => {
    if (!isAutoTrading || tradingMode !== "auto") return

    const interval = setInterval(() => {
      // Implement strategy logic here
      const strategy = STRATEGIES.find(s => s.id === selectedStrategy)
      if (!strategy) return

      // Simple example: random direction based on strategy win rate
      const shouldTrade = Math.random() < (strategy.winRate / 100)
      if (shouldTrade) {
        const direction = Math.random() > 0.5 ? "CALL" : "PUT"
        executeTrade(direction)
      }
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [isAutoTrading, tradingMode, selectedStrategy])

  if (!isDeriv) {
    return (
      <Card className="bg-gradient-to-br from-gray-500/10 to-gray-500/5 border-gray-500/20">
        <CardHeader>
          <CardTitle className="text-lg">Deriv Trading</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Connect your Deriv account to start trading
          </p>
          <Button className="mt-4 w-full bg-[#ff444f] hover:bg-[#ff444f]/90">
            Connect Deriv Account
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Trading Mode Selector */}
      <Card className="bg-gradient-to-br from-[#ff444f]/10 to-[#ff444f]/5 border-[#ff444f]/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#ff444f]" />
            Trading Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={tradingMode} onValueChange={(v) => setTradingMode(v as "manual" | "auto")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Trading</TabsTrigger>
              <TabsTrigger value="auto">Auto Trading</TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-4 mt-4">
              {/* Manual Trading Controls */}
              <div className="space-y-3">
                <div>
                  <Label>Trading Pair</Label>
                  <Select value={selectedPair} onValueChange={setSelectedPair}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DERIV_PAIRS.map(pair => (
                        <SelectItem key={pair.symbol} value={pair.symbol}>
                          {pair.name} ({pair.category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Duration</Label>
                  <Select 
                    value={selectedDuration.toString()} 
                    onValueChange={(v) => setSelectedDuration(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATIONS.map(duration => (
                        <SelectItem key={duration.value} value={duration.value.toString()}>
                          {duration.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Stake Amount ($)</Label>
                  <Input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(parseFloat(e.target.value))}
                    min={1}
                    step={1}
                  />
                </div>

                {/* Current Price */}
                <div className="p-3 rounded-lg bg-background/50 border">
                  <p className="text-xs text-muted-foreground mb-1">Current Price</p>
                  <p className="text-2xl font-bold text-[#ff444f]">
                    {currentPrice.toFixed(5)}
                  </p>
                </div>

                {/* Trade Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => executeTrade("CALL")}
                    className="bg-green-500 hover:bg-green-600 text-white"
                    disabled={activeTrades.length >= 5}
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    CALL / UP
                  </Button>
                  <Button
                    onClick={() => executeTrade("PUT")}
                    className="bg-red-500 hover:bg-red-600 text-white"
                    disabled={activeTrades.length >= 5}
                  >
                    <TrendingDown className="mr-2 h-4 w-4" />
                    PUT / DOWN
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="auto" className="space-y-4 mt-4">
              {/* Auto Trading Settings */}
              <div className="space-y-3">
                <div>
                  <Label>Trading Strategy</Label>
                  <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STRATEGIES.map(strategy => (
                        <SelectItem key={strategy.id} value={strategy.id}>
                          <div>
                            <p>{strategy.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Win Rate: {strategy.winRate}%
                            </p>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {STRATEGIES.find(s => s.id === selectedStrategy)?.description}
                  </p>
                </div>

                <div>
                  <Label>Trading Pair</Label>
                  <Select value={selectedPair} onValueChange={setSelectedPair}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DERIV_PAIRS.map(pair => (
                        <SelectItem key={pair.symbol} value={pair.symbol}>
                          {pair.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Stake per Trade ($)</Label>
                  <Input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(parseFloat(e.target.value))}
                    min={1}
                    step={1}
                  />
                </div>

                {/* Auto Trading Control */}
                <Button
                  onClick={() => setIsAutoTrading(!isAutoTrading)}
                  className={`w-full ${
                    isAutoTrading 
                      ? "bg-red-500 hover:bg-red-600" 
                      : "bg-green-500 hover:bg-green-600"
                  }`}
                >
                  {isAutoTrading ? (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      Stop Auto Trading
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Start Auto Trading
                    </>
                  )}
                </Button>

                {isAutoTrading && (
                  <Badge className="w-full justify-center bg-green-500/10 text-green-500 border-green-500/20">
                    <Zap className="mr-2 h-3 w-3 animate-pulse" />
                    Auto Trading Active
                  </Badge>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Active Trades */}
      {activeTrades.length > 0 && (
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              Active Trades ({activeTrades.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeTrades.map(trade => (
              <div key={trade.id} className="p-3 rounded-lg bg-background/50 border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={
                      trade.direction === "CALL" 
                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                        : "bg-red-500/10 text-red-500 border-red-500/20"
                    }>
                      {trade.direction}
                    </Badge>
                    <span className="text-sm font-medium">{trade.symbol}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    ${trade.stake}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Entry</p>
                    <p className="font-mono">{trade.entryPrice.toFixed(5)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Current</p>
                    <p className="font-mono">{trade.currentPrice?.toFixed(5) || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">P/L</p>
                    <p className={`font-mono ${
                      (trade.profit || 0) >= 0 ? "text-green-500" : "text-red-500"
                    }`}>
                      ${trade.profit?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Trade History */}
      {tradeHistory.length > 0 && (
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              Recent Trades
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {tradeHistory.slice(0, 5).map(trade => (
              <div key={trade.id} className="p-2 rounded-lg bg-background/50 border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {trade.status === "WON" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">{trade.symbol}</span>
                    <Badge variant="outline" className="text-xs">
                      {trade.direction}
                    </Badge>
                  </div>
                  <span className={`text-sm font-mono ${
                    (trade.profit || 0) >= 0 ? "text-green-500" : "text-red-500"
                  }`}>
                    {(trade.profit || 0) >= 0 ? "+" : ""}${trade.profit?.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
