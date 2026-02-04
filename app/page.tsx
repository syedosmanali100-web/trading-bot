"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Shield, 
  Zap, 
  Play, 
  Pause, 
  DollarSign, 
  BarChart3, 
  Activity,
  Target,
  Globe,
  Coins,
  Cpu,
  Settings,
  Package,
  Maximize2
} from "lucide-react"
import { toast } from "sonner"

interface UserData {
  id: string
  username: string
  is_admin: boolean
  is_active: boolean
  subscription_end: string
  deriv_account_id?: string
  deriv_token?: string
  is_deriv_user: boolean
}

interface DerivBalance {
  balance: number
  currency: string
  display_balance: string
}

interface DerivSymbol {
  symbol: string
  name: string
  market: string
  submarket: string
  pip: number
  decimal_places: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [balance, setBalance] = useState<DerivBalance | null>(null)
  const [symbols, setSymbols] = useState<DerivSymbol[]>([])
  const [selectedSymbol, setSelectedSymbol] = useState<string>("EUR/USD")
  const [selectedDuration, setSelectedDuration] = useState<number>(1)
  const [durationUnit, setDurationUnit] = useState<"m" | "s">("m")
  const [stakeAmount, setStakeAmount] = useState<number>(10)
  const [isAutoTrading, setIsAutoTrading] = useState<boolean>(false)
  const [isManualTrading, setIsManualTrading] = useState<boolean>(false)
  const [tradingMode, setTradingMode] = useState<"manual" | "auto">("manual")
  const [tradeHistory, setTradeHistory] = useState<any[]>([])
  const [profitLoss, setProfitLoss] = useState<number>(0)
  const [winRate, setWinRate] = useState<number>(0)
  const [totalTrades, setTotalTrades] = useState<number>(0)
  
  // Mock data for demonstration
  useEffect(() => {
    const checkAuth = () => {
      const userSession = localStorage.getItem('user_session')
      if (!userSession) {
        router.push('/login')
        return
      }

      try {
        const user = JSON.parse(userSession)
        setUserData(user)
        
        // Simulate Deriv connection and data
        simulateDerivData()
      } catch (error) {
        console.error('Auth error:', error)
        router.push('/login')
      }
    }

    checkAuth()
  }, [router])

  const simulateDerivData = () => {
    // Simulate account balance
    setBalance({
      balance: 1250.75,
      currency: "USD",
      display_balance: "$1,250.75"
    })

    // Simulate available symbols
    const mockSymbols: DerivSymbol[] = [
      { symbol: "EUR/USD", name: "EUR/USD", market: "forex", submarket: "major_pairs", pip: 0.0001, decimal_places: 5 },
      { symbol: "GBP/USD", name: "GBP/USD", market: "forex", submarket: "major_pairs", pip: 0.0001, decimal_places: 5 },
      { symbol: "USD/JPY", name: "USD/JPY", market: "forex", submarket: "major_pairs", pip: 0.01, decimal_places: 3 },
      { symbol: "BTC/USD", name: "Bitcoin/USD", market: "cryptocurrency", submarket: "major_crypto", pip: 0.01, decimal_places: 2 },
      { symbol: "ETH/USD", name: "Ethereum/USD", market: "cryptocurrency", submarket: "major_crypto", pip: 0.01, decimal_places: 2 },
      { symbol: "XAU/USD", name: "Gold/USD", market: "commodities", submarket: "metals", pip: 0.01, decimal_places: 2 },
    ]
    setSymbols(mockSymbols)
    setSelectedSymbol("EUR/USD")

    // Simulate trade history
    setTradeHistory([
      { id: 1, symbol: "EUR/USD", type: "CALL", amount: 10, profit: 7.5, status: "WIN", time: "2023-05-15 10:30:22" },
      { id: 2, symbol: "BTC/USD", type: "PUT", amount: 15, profit: -15, status: "LOSS", time: "2023-05-15 09:45:11" },
      { id: 3, symbol: "GBP/USD", type: "CALL", amount: 12, profit: 8.4, status: "WIN", time: "2023-05-15 08:20:05" },
      { id: 4, symbol: "ETH/USD", type: "PUT", amount: 20, profit: 14, status: "WIN", time: "2023-05-14 16:15:33" },
    ])

    // Simulate stats
    setProfitLoss(10.9)
    setWinRate(75)
    setTotalTrades(42)

    setIsLoading(false)
  }

  const executeManualTrade = (direction: "CALL" | "PUT") => {
    if (!isManualTrading) {
      toast.error("Enable manual trading first")
      return
    }

    // Simulate trade execution
    const newTrade = {
      id: tradeHistory.length + 1,
      symbol: selectedSymbol,
      type: direction,
      amount: stakeAmount,
      profit: direction === "CALL" ? stakeAmount * 0.75 : -stakeAmount,
      status: Math.random() > 0.3 ? "WIN" : "LOSS",
      time: new Date().toLocaleString()
    }

    setTradeHistory(prev => [newTrade, ...prev.slice(0, 9)]) // Keep last 10 trades
    setTotalTrades(prev => prev + 1)

    toast.success(`Trade executed: ${direction} on ${selectedSymbol} for $${stakeAmount}`)
  }

  const toggleManualTrading = () => {
    setIsManualTrading(!isManualTrading)
    toast.info(`Manual trading ${!isManualTrading ? 'enabled' : 'disabled'}`)
  }

  const toggleAutoTrading = () => {
    setIsAutoTrading(!isAutoTrading)
    toast.info(`Auto trading ${!isAutoTrading ? 'enabled' : 'disabled'}`)
  }

  const handleLogout = () => {
    localStorage.removeItem('user_session')
    localStorage.removeItem('admin_session')
    toast.success("Logged out successfully")
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mx-auto"></div>
          <h2 className="text-2xl font-bold text-white">Loading Deriv Dashboard</h2>
          <p className="text-gray-400">Connecting to your Deriv account...</p>
        </div>
      </div>
    )
  }

  if (!userData) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Deriv Trading Terminal
            </h1>
            <p className="text-gray-400 mt-1">
              Welcome back, {userData.username.split('@')[0] || 'Trader'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/profile')}
              className="gap-2 border-gray-700 text-white hover:bg-gray-800"
            >
              <Shield className="w-4 h-4" />
              Profile
            </Button>
            {userData.is_admin && (
              <Button
                variant="outline"
                onClick={() => router.push('/admin')}
                className="gap-2 border-purple-500 text-purple-400 hover:bg-purple-900/30"
              >
                <Users className="w-4 h-4" />
                Admin
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleLogout}
              className="gap-2 border-red-500 text-red-400 hover:bg-red-900/30"
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Account Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Balance</p>
                  <h3 className="text-2xl font-bold text-green-400">
                    {balance?.display_balance || '$0.00'}
                  </h3>
                </div>
                <div className="p-3 bg-green-900/30 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Trades</p>
                  <h3 className="text-2xl font-bold text-blue-400">{totalTrades}</h3>
                </div>
                <div className="p-3 bg-blue-900/30 rounded-lg">
                  <Activity className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Win Rate</p>
                  <h3 className="text-2xl font-bold text-purple-400">{winRate}%</h3>
                </div>
                <div className="p-3 bg-purple-900/30 rounded-lg">
                  <Target className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Profit/Loss</p>
                  <h3 className={`text-2xl font-bold ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {profitLoss >= 0 ? '+' : ''}${profitLoss.toFixed(2)}
                  </h3>
                </div>
                <div className="p-3 bg-gray-700/30 rounded-lg">
                  <Coins className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trading Controls */}
        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Trading Terminal
            </CardTitle>
            <CardDescription className="text-gray-400">
              Manual and automatic trading controls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Trading Mode Selection */}
              <div className="lg:col-span-1 space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant={tradingMode === "manual" ? "default" : "outline"}
                    className={`flex-1 ${tradingMode === "manual" ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-700 text-white hover:bg-gray-800'}`}
                    onClick={() => setTradingMode("manual")}
                  >
                    <Maximize2 className="w-4 h-4 mr-2" />
                    Manual
                  </Button>
                  <Button
                    variant={tradingMode === "auto" ? "default" : "outline"}
                    className={`flex-1 ${tradingMode === "auto" ? 'bg-purple-600 hover:bg-purple-700' : 'border-gray-700 text-white hover:bg-gray-800'}`}
                    onClick={() => setTradingMode("auto")}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Auto
                  </Button>
                </div>

                {/* Manual Trading Controls */}
                {tradingMode === "manual" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Label className="text-gray-300">Manual Trading</Label>
                      <Button
                        size="sm"
                        variant={isManualTrading ? "default" : "outline"}
                        className={`${isManualTrading ? 'bg-green-600 hover:bg-green-700' : 'border-gray-700 text-white hover:bg-gray-800'}`}
                        onClick={toggleManualTrading}
                      >
                        {isManualTrading ? "ON" : "OFF"}
                      </Button>
                    </div>

                    <div>
                      <Label className="text-gray-300">Asset Pair</Label>
                      <select
                        value={selectedSymbol}
                        onChange={(e) => setSelectedSymbol(e.target.value)}
                        className="w-full p-2 border border-gray-700 rounded-md bg-gray-900 text-white mt-1"
                      >
                        {symbols.map((symbol) => (
                          <option key={symbol.symbol} value={symbol.symbol}>
                            {symbol.name} ({symbol.symbol})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label className="text-gray-300">Duration</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="number"
                          min="1"
                          value={selectedDuration}
                          onChange={(e) => setSelectedDuration(Number(e.target.value))}
                          className="border-gray-700 bg-gray-900 text-white"
                        />
                        <select
                          value={durationUnit}
                          onChange={(e) => setDurationUnit(e.target.value as "m" | "s")}
                          className="border border-gray-700 rounded-md bg-gray-900 text-white px-3"
                        >
                          <option value="s">sec</option>
                          <option value="m">min</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-300">Stake Amount</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="number"
                          min="1"
                          step="0.1"
                          value={stakeAmount}
                          onChange={(e) => setStakeAmount(Number(e.target.value))}
                          className="border-gray-700 bg-gray-900 text-white"
                        />
                        <span className="flex items-center px-3 border border-gray-700 rounded-md bg-gray-900 text-white">
                          USD
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => executeManualTrade("CALL")}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        CALL
                      </Button>
                      <Button
                        onClick={() => executeManualTrade("PUT")}
                        className="flex-1 bg-red-600 hover:bg-red-700"
                      >
                        <TrendingDown className="w-4 h-4 mr-2" />
                        PUT
                      </Button>
                    </div>
                  </div>
                )}

                {/* Auto Trading Controls */}
                {tradingMode === "auto" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Label className="text-gray-300">Auto Trading</Label>
                      <Button
                        size="sm"
                        variant={isAutoTrading ? "default" : "outline"}
                        className={`${isAutoTrading ? 'bg-green-600 hover:bg-green-700' : 'border-gray-700 text-white hover:bg-gray-800'}`}
                        onClick={toggleAutoTrading}
                      >
                        {isAutoTrading ? "ON" : "OFF"}
                      </Button>
                    </div>

                    <div>
                      <Label className="text-gray-300">Strategy</Label>
                      <select className="w-full p-2 border border-gray-700 rounded-md bg-gray-900 text-white mt-1">
                        <option>Martingale</option>
                        <option>Oscar's Grind</option>
                        <option>D'Alembert</option>
                        <option>Fibonacci</option>
                      </select>
                    </div>

                    <div>
                      <Label className="text-gray-300">Max Trades/Hour</Label>
                      <Input
                        type="number"
                        min="1"
                        max="60"
                        defaultValue="10"
                        className="border-gray-700 bg-gray-900 text-white mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-gray-300">Risk per Trade (%)</Label>
                      <Input
                        type="number"
                        min="0.1"
                        max="10"
                        step="0.1"
                        defaultValue="2"
                        className="border-gray-700 bg-gray-900 text-white mt-1"
                      />
                    </div>

                    <Button
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Auto Trading
                    </Button>
                  </div>
                )}
              </div>

              {/* Chart Placeholder */}
              <div className="lg:col-span-2">
                <Label className="text-gray-300">Market Chart</Label>
                <div className="h-80 bg-gray-900/50 rounded-lg border border-gray-700 flex flex-col items-center justify-center p-4 mt-1">
                  <Globe className="w-16 h-16 text-gray-600 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">Deriv Chart Integration</h3>
                  <p className="text-gray-500 text-center">
                    Real-time market data and trading charts from Deriv will be displayed here
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Badge variant="secondary" className="bg-gray-800 text-gray-300">EUR/USD</Badge>
                    <Badge variant="secondary" className="bg-gray-800 text-gray-300">GBP/USD</Badge>
                    <Badge variant="secondary" className="bg-gray-800 text-gray-300">BTC/USD</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Trades */}
        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Activity className="w-5 h-5 text-green-400" />
              Recent Trades
            </CardTitle>
            <CardDescription className="text-gray-400">
              Your latest trading activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="pb-3 text-left text-gray-400">Asset</th>
                    <th className="pb-3 text-left text-gray-400">Type</th>
                    <th className="pb-3 text-left text-gray-400">Amount</th>
                    <th className="pb-3 text-left text-gray-400">Profit/Loss</th>
                    <th className="pb-3 text-left text-gray-400">Status</th>
                    <th className="pb-3 text-left text-gray-400">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {tradeHistory.map((trade) => (
                    <tr key={trade.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                      <td className="py-3">{trade.symbol}</td>
                      <td className="py-3">
                        <Badge variant={trade.type === "CALL" ? "default" : "secondary"}>
                          {trade.type}
                        </Badge>
                      </td>
                      <td className="py-3">${trade.amount}</td>
                      <td className={`py-3 font-medium ${trade.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(2)}
                      </td>
                      <td className="py-3">
                        <Badge variant={trade.status === "WIN" ? "default" : "destructive"}>
                          {trade.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-gray-400 text-sm">{trade.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Add-ons */}
        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Package className="w-5 h-5 text-purple-400" />
              Trading Add-ons
            </CardTitle>
            <CardDescription className="text-gray-400">
              Enhance your trading experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-900/30 rounded-lg">
                    <Cpu className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="font-medium">Advanced Bot</h3>
                </div>
                <p className="text-sm text-gray-400 mb-3">
                  AI-powered trading algorithms with enhanced prediction
                </p>
                <Button size="sm" variant="outline" className="w-full border-gray-700 text-white hover:bg-gray-800">
                  Activate
                </Button>
              </div>

              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-900/30 rounded-lg">
                    <Target className="w-5 h-5 text-green-400" />
                  </div>
                  <h3 className="font-medium">Risk Manager</h3>
                </div>
                <p className="text-sm text-gray-400 mb-3">
                  Advanced risk management tools to protect your capital
                </p>
                <Button size="sm" variant="outline" className="w-full border-gray-700 text-white hover:bg-gray-800">
                  Activate
                </Button>
              </div>

              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-900/30 rounded-lg">
                    <Settings className="w-5 h-5 text-purple-400" />
                  </div>
                  <h3 className="font-medium">Custom Signals</h3>
                </div>
                <p className="text-sm text-gray-400 mb-3">
                  Personalized trading signals based on your strategy
                </p>
                <Button size="sm" variant="outline" className="w-full border-gray-700 text-white hover:bg-gray-800">
                  Activate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}