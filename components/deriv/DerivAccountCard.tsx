"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  RefreshCw, 
  Wallet, 
  ExternalLink, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Target,
  Award
} from "lucide-react"

interface DerivAccountInfo {
  balance: number
  currency: string
  loginid: string
  email: string
}

interface TradingStats {
  totalTrades: number
  winningTrades: number
  losingTrades: number
  totalProfit: number
  winRate: number
}

export default function DerivAccountCard() {
  const [accountInfo, setAccountInfo] = useState<DerivAccountInfo | null>(null)
  const [stats, setStats] = useState<TradingStats>({
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    totalProfit: 0,
    winRate: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDeriv, setIsDeriv] = useState(false)

  const fetchDerivBalance = async () => {
    try {
      setIsRefreshing(true)
      setError(null)

      // Get user session
      const userSession = localStorage.getItem('user_session')
      if (!userSession) {
        setError('Not logged in')
        setIsLoading(false)
        return
      }

      const session = JSON.parse(userSession)
      
      // Check if user is a Deriv user
      if (!session.isDeriv && !session.is_deriv_user) {
        setIsDeriv(false)
        setIsLoading(false)
        return
      }

      setIsDeriv(true)

      // Call API to get Deriv balance
      const response = await fetch('/api/deriv/balance', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success && data.balance) {
        setAccountInfo({
          balance: data.balance.balance,
          currency: data.balance.currency,
          loginid: data.balance.loginid,
          email: session.username,
        })

        // Load trading stats from localStorage
        const savedStats = localStorage.getItem(`deriv_stats_${session.id}`)
        if (savedStats) {
          setStats(JSON.parse(savedStats))
        }
      } else {
        setError(data.error || 'Failed to fetch balance')
      }
    } catch (err) {
      console.error('Error fetching Deriv balance:', err)
      setError('Failed to connect to Deriv')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDerivBalance()
    
    // Refresh balance every 30 seconds
    const interval = setInterval(fetchDerivBalance, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // Don't show anything if not a Deriv user
  if (!isDeriv && !isLoading) {
    return null
  }

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-[#ff444f]/10 to-[#ff444f]/5 border-[#ff444f]/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5 text-[#ff444f]" />
            Deriv Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-gradient-to-br from-gray-500/10 to-gray-500/5 border-gray-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5 text-gray-500" />
            Deriv Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={fetchDerivBalance}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Connection
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!accountInfo) {
    return null
  }

  return (
    <Card className="bg-gradient-to-br from-[#ff444f]/10 to-[#ff444f]/5 border-[#ff444f]/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5 text-[#ff444f]" />
            Deriv Account
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchDerivBalance}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Balance Section */}
        <div className="p-4 rounded-lg bg-background/50 border">
          <p className="text-xs text-muted-foreground mb-1">Current Balance</p>
          <div className="flex items-baseline gap-2 mb-2">
            <DollarSign className="h-6 w-6 text-[#ff444f]" />
            <p className="text-3xl font-bold text-[#ff444f]">
              {accountInfo.balance.toFixed(2)}
            </p>
            <p className="text-lg text-muted-foreground">{accountInfo.currency}</p>
          </div>
          
          {stats.totalProfit !== 0 && (
            <div className={`flex items-center gap-1 text-sm ${
              stats.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {stats.totalProfit >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="font-medium">
                {stats.totalProfit >= 0 ? '+' : ''}{stats.totalProfit.toFixed(2)} {accountInfo.currency}
              </span>
              <span className="text-muted-foreground text-xs ml-1">
                (Session P/L)
              </span>
            </div>
          )}
        </div>

        {/* Trading Stats */}
        {stats.totalTrades > 0 && (
          <div className="p-4 rounded-lg bg-background/50 border space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium flex items-center gap-2">
                <Award className="h-4 w-4 text-[#ff444f]" />
                Trading Performance
              </p>
              <Badge className={
                stats.winRate >= 70 
                  ? "bg-green-500/10 text-green-500 border-green-500/20"
                  : stats.winRate >= 50
                  ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                  : "bg-red-500/10 text-red-500 border-red-500/20"
              }>
                {stats.winRate.toFixed(0)}% Win Rate
              </Badge>
            </div>

            {/* Win Rate Progress */}
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Win Rate</span>
                <span>{stats.winningTrades}/{stats.totalTrades} Trades</span>
              </div>
              <Progress value={stats.winRate} className="h-2" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded bg-background/30">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold">{stats.totalTrades}</p>
              </div>
              <div className="p-2 rounded bg-green-500/5">
                <p className="text-xs text-green-500">Wins</p>
                <p className="text-lg font-bold text-green-500">{stats.winningTrades}</p>
              </div>
              <div className="p-2 rounded bg-red-500/5">
                <p className="text-xs text-red-500">Losses</p>
                <p className="text-lg font-bold text-red-500">{stats.losingTrades}</p>
              </div>
            </div>
          </div>
        )}

        {/* Account Info */}
        <div className="pt-3 border-t border-border space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Account ID:</span>
            <span className="font-mono text-xs">{accountInfo.loginid}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Email:</span>
            <span className="truncate ml-2 max-w-[180px] text-xs">{accountInfo.email}</span>
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center justify-between pt-2">
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            Connected
          </Badge>
          <Button
            variant="link"
            size="sm"
            className="text-[#ff444f] p-0 h-auto hover:underline"
            onClick={() => window.open('https://app.deriv.com', '_blank')}
          >
            Open Deriv
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
