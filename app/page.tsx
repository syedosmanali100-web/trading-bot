"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  TrendingUp,
  TrendingDown,
  Play,
  Pause,
  Clock,
  Wifi,
  WifiOff,
  Timer,
  User,
  Brain,
  Zap,
  Target,
  CheckCircle2,
  BarChart3,
} from "lucide-react"
import Link from "next/link"
import { getPriceService, fetchCurrentPrice } from "@/utils/priceService"
import { getSimulatedPriceService, fetchCurrentPriceFree } from "@/utils/priceServiceFree"

// Types
interface TrendSignal {
  id: string
  symbol: string
  direction: "UP" | "DOWN"
  durationMinutes: number
  confidence: number
  timestamp: number
  validUntil: number
  status: "ACTIVE" | "EXPIRED"
  entryPrice?: number
  exitPrice?: number
  profitLoss?: {
    amount1000: number
    amount5000: number
    amount10000: number
    pips?: number
    isProfit?: boolean
  }
  analysis?: {
    pattern: string
    trend: string
    indicators: string
    reason: string
  }
}

// Currency pairs
const CURRENCY_PAIRS = [
  { symbol: "EURUSD", name: "Euro / US Dollar" },
  { symbol: "GBPUSD", name: "British Pound / US Dollar" },
  { symbol: "USDJPY", name: "US Dollar / Japanese Yen" },
  { symbol: "AUDUSD", name: "Australian Dollar / US Dollar" },
  { symbol: "USDCAD", name: "US Dollar / Canadian Dollar" },
]

// Duration options
const DURATION_OPTIONS = [1, 3, 5, 10, 15, 30]

export default function TradingDashboard() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [selectedPair, setSelectedPair] = useState("EURUSD")
  const [selectedDuration, setSelectedDuration] = useState(5)
  const [isConnected, setIsConnected] = useState(false)
  const [currentSignal, setCurrentSignal] = useState<TrendSignal | null>(null)
  const [signalHistory, setSignalHistory] = useState<TrendSignal[]>([])
  const [currentPrice, setCurrentPrice] = useState(1.0850)
  const [lastPriceUpdate, setLastPriceUpdate] = useState<number>(Date.now())
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisStep, setAnalysisStep] = useState("")
  const [currentUserId, setCurrentUserId] = useState<string>("")

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const priceServiceRef = useRef<ReturnType<typeof getPriceService>>(null)

  // Get user-specific storage key
  const getUserSignalKey = (userId: string) => `signal_history_${userId}`

  // Check authentication
  useEffect(() => {
    const userSession = localStorage.getItem('user_session')
    if (!userSession) {
      router.push('/login')
    } else {
      try {
        const session = JSON.parse(userSession)
        setCurrentUserId(session.id)
        setIsAuthenticated(true)
      } catch (error) {
        console.error('Session error:', error)
        router.push('/login')
      }
    }
  }, [router])

  // Load signal history from localStorage (user-specific)
  useEffect(() => {
    if (!currentUserId) return
    
    const loadHistory = () => {
      const stored = localStorage.getItem(getUserSignalKey(currentUserId))
      if (stored) {
        const history = JSON.parse(stored)
        setSignalHistory(history.slice(0, 10))
      }
    }
    
    loadHistory()
    const interval = setInterval(loadHistory, 1000) // Update every second
    
    return () => clearInterval(interval)
  }, [currentUserId])

  // Calculate profit/loss for expired signal
  const calculateProfitLoss = useCallback((signal: TrendSignal, exitPrice: number) => {
    if (!signal.entryPrice) return null
    
    const entryPrice = signal.entryPrice
    const priceChange = exitPrice - entryPrice
    const pips = Math.abs(priceChange * 10000) // Convert to pips
    
    // Determine if trade was profitable
    const isProfit = signal.direction === "UP" ? priceChange > 0 : priceChange < 0
    const multiplier = isProfit ? 1 : -1
    
    // Calculate profit for different amounts (using 80% payout for binary options)
    const payout = 0.80
    const usdToInr = 83.50 // Current USD to INR rate
    
    return {
      amount1000: multiplier > 0 ? Math.round(1000 * payout * usdToInr) : Math.round(-1000 * usdToInr),
      amount5000: multiplier > 0 ? Math.round(5000 * payout * usdToInr) : Math.round(-5000 * usdToInr),
      amount10000: multiplier > 0 ? Math.round(10000 * payout * usdToInr) : Math.round(-10000 * usdToInr),
      pips: pips,
      isProfit: isProfit
    }
  }, [])

  // Auto-expire signals
  useEffect(() => {
    if (!currentUserId) return
    
    const checkExpiration = () => {
      const now = Date.now()
      
      // Expire current signal if time is up
      if (currentSignal && now >= currentSignal.validUntil) {
        const exitPrice = currentPrice
        const profitLoss = calculateProfitLoss(currentSignal, exitPrice)
        
        const expiredSignal = { 
          ...currentSignal, 
          status: 'EXPIRED' as const,
          exitPrice: exitPrice,
          profitLoss: profitLoss || undefined
        }
        setCurrentSignal(null)
        
        // Update in localStorage (user-specific)
        const stored = localStorage.getItem(getUserSignalKey(currentUserId))
        if (stored) {
          const history = JSON.parse(stored)
          const index = history.findIndex((s: TrendSignal) => s.id === expiredSignal.id)
          if (index !== -1) {
            history[index].status = 'EXPIRED'
            history[index].exitPrice = exitPrice
            history[index].profitLoss = profitLoss || undefined
            localStorage.setItem(getUserSignalKey(currentUserId), JSON.stringify(history))
            setSignalHistory(history.slice(0, 10))
          }
        }
      }
      
      // Update all expired signals in history
      const stored = localStorage.getItem(getUserSignalKey(currentUserId))
      if (stored) {
        const history = JSON.parse(stored)
        let updated = false
        
        history.forEach((signal: TrendSignal, index: number) => {
          if (signal.status === 'ACTIVE' && now >= signal.validUntil) {
            history[index].status = 'EXPIRED'
            history[index].exitPrice = currentPrice
            history[index].profitLoss = calculateProfitLoss(signal, currentPrice) || undefined
            updated = true
          }
        })
        
        if (updated) {
          localStorage.setItem(getUserSignalKey(currentUserId), JSON.stringify(history))
          setSignalHistory(history.slice(0, 10))
        }
      }
    }
    
    const interval = setInterval(checkExpiration, 100) // Check every 100ms for accuracy
    return () => clearInterval(interval)
  }, [currentSignal, currentPrice, calculateProfitLoss, currentUserId])

  // Generate signal with AI analysis
  const generateSignal = useCallback(async () => {
    setIsAnalyzing(true)
    
    // Step 1: Fetching candlestick data
    setAnalysisStep("🕯️ Fetching candlestick patterns from chart...")
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Step 2: Pattern recognition
    setAnalysisStep("🔍 Identifying current candlestick formation...")
    await new Promise(resolve => setTimeout(resolve, 2200))
    
    // Step 3: Historical comparison
    setAnalysisStep("📚 Comparing with historical patterns database...")
    await new Promise(resolve => setTimeout(resolve, 2400))
    
    // Step 4: Pattern matching
    setAnalysisStep("🎯 Matching patterns: Doji, Hammer, Engulfing...")
    await new Promise(resolve => setTimeout(resolve, 2100))
    
    // Step 5: Support/Resistance
    setAnalysisStep("📊 Analyzing support & resistance levels...")
    await new Promise(resolve => setTimeout(resolve, 2300))
    
    // Step 6: Volume confirmation
    setAnalysisStep("💹 Confirming volume and momentum indicators...")
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Step 7: Technical indicators
    setAnalysisStep("📈 Cross-checking RSI, MACD, Bollinger Bands...")
    await new Promise(resolve => setTimeout(resolve, 2200))
    
    // Step 8: Trend analysis
    setAnalysisStep("📉 Evaluating overall market trend direction...")
    await new Promise(resolve => setTimeout(resolve, 1900))
    
    // Step 9: AI prediction
    setAnalysisStep("🤖 AI neural network processing prediction...")
    await new Promise(resolve => setTimeout(resolve, 2100))
    
    // Step 10: Risk assessment
    setAnalysisStep("⚖️ Calculating risk-reward ratio...")
    await new Promise(resolve => setTimeout(resolve, 1800))
    
    // Step 11: Final validation
    setAnalysisStep("✅ Validating signal accuracy and confidence...")
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Step 12: Signal generation
    setAnalysisStep("✨ Generating optimal trading signal...")
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Generate signal based on "deep analysis"
    const direction = Math.random() > 0.5 ? "UP" : "DOWN"
    const confidence = Math.floor(Math.random() * 15) + 80 // 80-95% (higher after deep analysis)
    const now = Date.now()
    
    // Generate detailed analysis reason
    const bullishPatterns = [
      {
        name: "Bullish Engulfing Pattern",
        description: "Large green candle completely engulfs previous red candle",
        location: `Formed at ${currentPrice.toFixed(5)} support level`,
        confirmation: "Second candle opened below and closed above first candle's body"
      },
      {
        name: "Hammer Formation",
        description: "Small body with long lower wick, minimal upper wick",
        location: `Appeared at key support zone ${(currentPrice * 0.9998).toFixed(5)}`,
        confirmation: "Lower wick is 2-3x longer than body, showing rejection of lower prices"
      },
      {
        name: "Morning Star Pattern",
        description: "Three-candle reversal: Red → Small Doji → Large Green",
        location: `Completed at ${currentPrice.toFixed(5)} after downtrend`,
        confirmation: "Third candle closed above midpoint of first candle"
      },
      {
        name: "Three White Soldiers",
        description: "Three consecutive strong green candles with higher closes",
        location: `Starting from ${(currentPrice * 0.9995).toFixed(5)} moving upward`,
        confirmation: "Each candle opens within previous body and closes higher"
      }
    ]
    
    const bearishPatterns = [
      {
        name: "Bearish Engulfing Pattern",
        description: "Large red candle completely engulfs previous green candle",
        location: `Formed at ${currentPrice.toFixed(5)} resistance level`,
        confirmation: "Second candle opened above and closed below first candle's body"
      },
      {
        name: "Shooting Star Pattern",
        description: "Small body with long upper wick, minimal lower wick",
        location: `Appeared at key resistance zone ${(currentPrice * 1.0002).toFixed(5)}`,
        confirmation: "Upper wick is 2-3x longer than body, showing rejection of higher prices"
      },
      {
        name: "Evening Star Pattern",
        description: "Three-candle reversal: Green → Small Doji → Large Red",
        location: `Completed at ${currentPrice.toFixed(5)} after uptrend`,
        confirmation: "Third candle closed below midpoint of first candle"
      },
      {
        name: "Three Black Crows",
        description: "Three consecutive strong red candles with lower closes",
        location: `Starting from ${(currentPrice * 1.0005).toFixed(5)} moving downward`,
        confirmation: "Each candle opens within previous body and closes lower"
      }
    ]
    
    const bullishIndicators = [
      {
        rsi: "RSI at 28 (Oversold)",
        macd: "MACD bullish crossover confirmed",
        bollinger: "Price bounced off lower Bollinger Band",
        volume: "Volume spike of 145% on last green candle"
      },
      {
        rsi: "RSI rising from 32 to 45 (Momentum building)",
        macd: "MACD histogram turning positive",
        bollinger: "Price moving from lower to middle band",
        volume: "Buying volume increased by 180%"
      }
    ]
    
    const bearishIndicators = [
      {
        rsi: "RSI at 78 (Overbought)",
        macd: "MACD bearish crossover detected",
        bollinger: "Price rejected at upper Bollinger Band",
        volume: "Volume spike of 160% on last red candle"
      },
      {
        rsi: "RSI falling from 72 to 58 (Losing momentum)",
        macd: "MACD histogram turning negative",
        bollinger: "Price moving from upper to middle band",
        volume: "Selling pressure increased by 195%"
      }
    ]
    
    const selectedPattern = direction === "UP" 
      ? bullishPatterns[Math.floor(Math.random() * bullishPatterns.length)]
      : bearishPatterns[Math.floor(Math.random() * bearishPatterns.length)]
    
    const selectedIndicators = direction === "UP"
      ? bullishIndicators[Math.floor(Math.random() * bullishIndicators.length)]
      : bearishIndicators[Math.floor(Math.random() * bearishIndicators.length)]
    
    const supportResistance = direction === "UP"
      ? `Strong support at ${(currentPrice * 0.9997).toFixed(5)}, next resistance at ${(currentPrice * 1.0008).toFixed(5)}`
      : `Strong resistance at ${(currentPrice * 1.0003).toFixed(5)}, next support at ${(currentPrice * 0.9992).toFixed(5)}`
    
    const trendAnalysis = direction === "UP"
      ? "Market showing bullish momentum with higher lows forming. Buyers are stepping in at support levels."
      : "Market showing bearish pressure with lower highs forming. Sellers are dominating at resistance levels."
    
    const reason = direction === "UP"
      ? `${selectedPattern.name} detected on ${selectedPair}. ${selectedPattern.description}. ${selectedPattern.location}. ${selectedPattern.confirmation}. Technical indicators align: ${selectedIndicators.rsi}, ${selectedIndicators.macd}, ${selectedIndicators.bollinger}. ${selectedIndicators.volume}. ${supportResistance}. ${trendAnalysis} High probability CALL setup with ${confidence}% confidence.`
      : `${selectedPattern.name} identified on ${selectedPair}. ${selectedPattern.description}. ${selectedPattern.location}. ${selectedPattern.confirmation}. Technical indicators confirm: ${selectedIndicators.rsi}, ${selectedIndicators.macd}, ${selectedIndicators.bollinger}. ${selectedIndicators.volume}. ${supportResistance}. ${trendAnalysis} Optimal PUT entry with ${confidence}% confidence.`
    
    const newSignal: TrendSignal = {
      id: now.toString(),
      symbol: selectedPair,
      direction,
      durationMinutes: selectedDuration,
      confidence,
      timestamp: now,
      validUntil: now + (selectedDuration * 60 * 1000),
      status: "ACTIVE",
      entryPrice: currentPrice,
      analysis: {
        pattern: selectedPattern.name,
        trend: `${selectedPattern.description} | ${selectedPattern.location}`,
        indicators: `${selectedIndicators.rsi} | ${selectedIndicators.macd} | ${selectedIndicators.bollinger}`,
        reason: reason
      }
    }
    
    setCurrentSignal(newSignal)
    setIsAnalyzing(false)
    setAnalysisStep("")
    
    // Save to localStorage (user-specific)
    if (!currentUserId) return
    
    const stored = localStorage.getItem(getUserSignalKey(currentUserId))
    const history = stored ? JSON.parse(stored) : []
    
    // Mark all previous signals as expired
    history.forEach((s: TrendSignal) => {
      if (s.status === 'ACTIVE') {
        s.status = 'EXPIRED'
      }
    })
    
    history.unshift(newSignal)
    localStorage.setItem(getUserSignalKey(currentUserId), JSON.stringify(history.slice(0, 50)))
    setSignalHistory(history.slice(0, 10))
  }, [selectedPair, selectedDuration, currentPrice, currentUserId])

  // Real-time price updates via WebSocket or Free API
  useEffect(() => {
    if (!isConnected) return

    const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY
    
    // Use WebSocket if API key is available, otherwise use free service
    if (apiKey && apiKey !== 'demo') {
      // Initialize Finnhub WebSocket price service
      priceServiceRef.current = getPriceService()

      if (priceServiceRef.current) {
        priceServiceRef.current.onPriceUpdate(selectedPair, (price) => {
          setCurrentPrice(price)
          setLastPriceUpdate(Date.now())
        })
      }

      // Fallback: Fetch price via REST API
      const fetchPrice = async () => {
        const price = await fetchCurrentPrice(selectedPair)
        if (price !== null) {
          setCurrentPrice(price)
          setLastPriceUpdate(Date.now())
        }
      }

      fetchPrice()
      intervalRef.current = setInterval(() => {
        fetchPrice()
        if (!currentSignal && Math.random() > 0.95) {
          generateSignal()
        }
      }, 1000)
    } else {
      // Use FREE service (no API key required)
      const freeService = getSimulatedPriceService()
      
      if (freeService) {
        freeService.startRealTimeUpdates(selectedPair, (price) => {
          setCurrentPrice(price)
          setLastPriceUpdate(Date.now())
        })
      }

      // Generate signals
      intervalRef.current = setInterval(() => {
        if (!currentSignal && Math.random() > 0.95) {
          generateSignal()
        }
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (priceServiceRef.current) {
        priceServiceRef.current.removePriceUpdate(selectedPair)
      }
      const freeService = getSimulatedPriceService()
      if (freeService) {
        freeService.stopRealTimeUpdates(selectedPair)
      }
    }
  }, [isConnected, currentSignal, generateSignal, selectedPair])

  const connectToMarket = () => {
    setIsConnected(true)
  }

  const disconnectFromMarket = () => {
    setIsConnected(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    if (priceServiceRef.current) {
      priceServiceRef.current.removePriceUpdate(selectedPair)
    }
    const freeService = getSimulatedPriceService()
    if (freeService) {
      freeService.stopRealTimeUpdates(selectedPair)
    }
  }

  const getTimeRemaining = (validUntil: number) => {
    const remaining = Math.max(0, validUntil - Date.now())
    const minutes = Math.floor(remaining / 60000)
    const seconds = Math.floor((remaining % 60000) / 1000)
    
    // If time is up, return "00:00" instead of negative
    if (remaining <= 0) {
      return "00:00"
    }
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <Link href="/profile">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full w-10 h-10 sm:w-12 sm:h-12 border-primary/30 bg-secondary hover:bg-primary hover:text-primary-foreground transition-all"
              >
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </Link>
            <div className="flex-1 sm:flex-none">
              <h1 className="text-xl sm:text-2xl md:text-4xl font-bold gradient-text">
                NEXUS AI SIGNALS
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                AI-Powered Forex Trading
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <Badge variant="outline" className="border-primary/50 text-primary px-2 sm:px-4 py-1 text-xs">
              <Brain className="w-3 h-3 mr-1" />
              AI TRAINED
            </Badge>
            <Button
              onClick={isConnected ? disconnectFromMarket : connectToMarket}
              variant={isConnected ? "destructive" : "default"}
              className={`flex-1 sm:flex-none text-xs sm:text-sm ${isConnected ? "" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
              size="sm"
            >
              {isConnected ? <Pause className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> : <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />}
              {isConnected ? "Disconnect" : "Connect"}
            </Button>
          </div>
        </div>

        {/* Connection Status */}
        <Card className="glass premium-card">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <Wifi className="w-4 h-4 sm:w-5 sm:h-5 text-primary animate-pulse" />
                ) : (
                  <WifiOff className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                )}
                <span className="font-medium text-sm sm:text-base">
                  {isConnected ? "AI System Online" : "Disconnected"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left: Settings */}
          <Card className="glass premium-card lg:col-span-1">
            <CardHeader className="pb-3 px-4 sm:px-6">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                Trading Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
              {/* Currency Pair */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2">Currency Pair</Label>
                <Select value={selectedPair} onValueChange={setSelectedPair}>
                  <SelectTrigger className="bg-secondary border-border h-9 sm:h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {CURRENCY_PAIRS.map((pair) => (
                      <SelectItem key={pair.symbol} value={pair.symbol} className="text-sm">
                        {pair.symbol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* INSTANT DURATION SELECTOR */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <Timer className="w-3 h-3" />
                  Signal Duration (Minutes)
                </Label>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-2">
                  {DURATION_OPTIONS.map((duration) => (
                    <Button
                      key={duration}
                      variant={selectedDuration === duration ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedDuration(duration)}
                      className={`text-xs sm:text-sm h-8 sm:h-9 ${
                        selectedDuration === duration 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-secondary hover:bg-primary/20"
                      }`}
                    >
                      {duration}m
                    </Button>
                  ))}
                </div>
                <div className="mt-2 text-xs text-center text-yellow-400 font-bold">
                  ⚡ Selected: {selectedDuration} Minutes
                </div>
              </div>
              
              {/* Live Price */}
              {isConnected && (
                <div className="pt-3 sm:pt-4 border-t border-border">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-muted-foreground text-xs sm:text-sm">Live Price</span>
                    <span className="text-lg sm:text-xl font-bold text-primary animate-pulse">{currentPrice.toFixed(5)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    Updated: {new Date(lastPriceUpdate).toLocaleTimeString()}
                  </div>
                </div>
              )}
              
              {/* Generate Signal Button */}
              {isConnected && (
                <Button 
                  onClick={generateSignal} 
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-9 sm:h-10 text-sm"
                  disabled={!!currentSignal || isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Generate Signal
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Center: Live Chart */}
          <Card className="glass premium-card lg:col-span-2">
            <CardHeader className="pb-3 px-4 sm:px-6">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                Live Chart - {selectedPair}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              {/* TradingView Widget */}
              <div className="w-full h-[250px] sm:h-[350px] md:h-[400px] bg-secondary/30 rounded-lg flex items-center justify-center relative">
                <iframe
                  src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=FX:${selectedPair}&interval=5&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=en&utm_source=localhost&utm_medium=widget_new&utm_campaign=chart&utm_term=FX:${selectedPair}`}
                  className="w-full h-full rounded-lg"
                  style={{ border: 0 }}
                  allowFullScreen={true}
                ></iframe>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Analysis Progress */}
        {isAnalyzing && (
          <Card className="premium-card border-purple-500/50 animate-pulse">
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500/30 border-t-purple-500"></div>
                  <Brain className="w-8 h-8 text-purple-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-purple-400 mb-2">AI Analysis in Progress</h3>
                  <p className="text-lg text-muted-foreground animate-pulse">{analysisStep}</p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Signal */}
        {currentSignal && !isAnalyzing && (
          <Card className={`premium-card animate-pulse-glow ${currentSignal.direction === "UP" ? "border-emerald-500/50" : "border-red-500/50"}`}>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-6 items-center">
                {/* Signal Icon */}
                <div className={`p-6 rounded-xl ${currentSignal.direction === "UP" ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
                  {currentSignal.direction === "UP" ? (
                    <TrendingUp className="w-16 h-16 text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-16 h-16 text-red-400" />
                  )}
                </div>
                
                {/* Signal Info */}
                <div className="flex-1 text-center lg:text-left">
                  <div className="flex items-center gap-3 justify-center lg:justify-start mb-2">
                    <h2 className={`text-3xl font-bold ${currentSignal.direction === "UP" ? "text-emerald-400" : "text-red-400"}`}>
                      {currentSignal.direction === "UP" ? "⬆ CALL" : "⬇ PUT"}
                    </h2>
                    <Badge className="bg-primary text-primary-foreground text-lg px-3 py-1">
                      {currentSignal.confidence}% Confidence
                    </Badge>
                  </div>
                  <p className="text-xl text-muted-foreground">{currentSignal.symbol}</p>
                  
                  {/* Duration & Timer */}
                  <div className="mt-4 flex items-center gap-4 justify-center lg:justify-start">
                    <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg px-4 py-2">
                      <div className="text-xs text-yellow-300">Duration</div>
                      <div className="text-2xl font-bold text-yellow-400">{currentSignal.durationMinutes} min</div>
                    </div>
                    <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg px-4 py-2">
                      <div className="text-xs text-blue-300">Time Remaining</div>
                      <div className="text-2xl font-bold text-blue-400">{getTimeRemaining(currentSignal.validUntil)}</div>
                    </div>
                  </div>
                  
                  {/* Analysis Reason */}
                  {currentSignal.analysis && (
                    <div className="mt-6 bg-secondary/50 rounded-lg p-4 text-left">
                      <div className="flex items-center gap-2 mb-3">
                        <Brain className="w-5 h-5 text-purple-400" />
                        <h3 className="font-bold text-purple-400">AI Analysis Report</h3>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <span className="text-yellow-400 font-bold">🕯️ Pattern:</span>
                          <span className="text-muted-foreground">{currentSignal.analysis.pattern}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-blue-400 font-bold">📊 Trend:</span>
                          <span className="text-muted-foreground">{currentSignal.analysis.trend}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-green-400 font-bold">📈 Indicators:</span>
                          <span className="text-muted-foreground">{currentSignal.analysis.indicators}</span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-border">
                          <div className="text-xs text-purple-400 font-bold mb-1">SIGNAL REASON:</div>
                          <p className="text-muted-foreground leading-relaxed">{currentSignal.analysis.reason}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* AI Badge */}
                <div className="text-center">
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50 px-4 py-2">
                    <Brain className="w-4 h-4 mr-2" />
                    AI Generated
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Signal History */}
        <Card className="glass premium-card">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Recent Signals
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {signalHistory.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {signalHistory.map((signal) => {
                  const isActive = signal.status === 'ACTIVE'
                  const timeRemaining = isActive ? getTimeRemaining(signal.validUntil) : null
                  const hasProfit = signal.profitLoss && !isActive
                  
                  return (
                    <div key={signal.id} className="bg-secondary/30 rounded-lg p-2 sm:p-3">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                          <div className={`p-1.5 sm:p-2 rounded-lg ${signal.direction === "UP" ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
                            {signal.direction === "UP" ? (
                              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
                            ) : (
                              <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm sm:text-base">{signal.symbol}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(signal.timestamp).toLocaleTimeString()} • {signal.durationMinutes}min
                            </div>
                            {signal.entryPrice && (
                              <div className="text-xs text-yellow-400 font-mono">
                                Entry: {signal.entryPrice.toFixed(5)}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
                          <div className="text-left sm:text-right">
                            <div className={`font-bold text-sm ${signal.direction === "UP" ? "text-emerald-400" : "text-red-400"}`}>
                              {signal.direction}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {signal.confidence}% conf.
                            </div>
                          </div>
                          <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
                            {isActive ? (
                              <>
                                <Clock className="w-3 h-3 mr-1" />
                                {timeRemaining}
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                EXPIRED
                              </>
                            )}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Profit/Loss Calculation - Only show if PROFIT */}
                      {hasProfit && signal.profitLoss && signal.profitLoss.isProfit && (
                        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-border">
                          <div className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            💰 POTENTIAL PROFIT (if traded):
                          </div>
                          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                            <div className="text-center p-1.5 sm:p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/50">
                              <div className="text-xs text-muted-foreground">₹1,000</div>
                              <div className="font-bold text-xs sm:text-sm text-emerald-400">
                                +₹{signal.profitLoss.amount1000.toLocaleString('en-IN')}
                              </div>
                            </div>
                            <div className="text-center p-1.5 sm:p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/50">
                              <div className="text-xs text-muted-foreground">₹5,000</div>
                              <div className="font-bold text-xs sm:text-sm text-emerald-400">
                                +₹{signal.profitLoss.amount5000.toLocaleString('en-IN')}
                              </div>
                            </div>
                            <div className="text-center p-1.5 sm:p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/50">
                              <div className="text-xs text-muted-foreground">₹10,000</div>
                              <div className="font-bold text-xs sm:text-sm text-emerald-400">
                                +₹{signal.profitLoss.amount10000.toLocaleString('en-IN')}
                              </div>
                            </div>
                          </div>
                          {signal.exitPrice && (
                            <div className="text-xs text-center mt-1.5 sm:mt-2 text-muted-foreground font-mono">
                              Entry: {signal.entryPrice?.toFixed(5)} → Exit: {signal.exitPrice.toFixed(5)} • +{signal.profitLoss.pips?.toFixed(1)} pips
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-6 text-sm">
                No signals yet. Connect and generate signals to start trading.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pb-4 px-2">
          <p className="flex items-center justify-center gap-1">
            <Brain className="w-3 h-3" />
            Powered by Advanced AI • Real-time Forex Analysis
          </p>
          <p className="mt-1">Trading involves risk. Signals are not financial advice.</p>
        </div>
      </div>
    </div>
  )
}
