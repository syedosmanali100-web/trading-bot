"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, BarChart3, Activity } from "lucide-react"
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"

interface PriceData {
  time: string
  price: number
  epoch: number
}

interface DerivPriceChartProps {
  symbol: string
  isDeriv?: boolean
}

export default function DerivPriceChart({ symbol, isDeriv = false }: DerivPriceChartProps) {
  const [priceData, setPriceData] = useState<PriceData[]>([])
  const [currentPrice, setCurrentPrice] = useState(0)
  const [priceChange, setPriceChange] = useState(0)
  const [chartType, setChartType] = useState<"line" | "area">("area")
  const [timeframe, setTimeframe] = useState<"1m" | "5m" | "15m" | "1h">("1m")
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!isDeriv) return

    // Connect to Deriv WebSocket
    const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=124906')
    wsRef.current = ws

    ws.onopen = () => {
      console.log('Chart WebSocket connected')
      
      // Subscribe to tick stream
      ws.send(JSON.stringify({
        ticks_history: symbol,
        adjust_start_time: 1,
        count: 100,
        end: "latest",
        start: 1,
        style: "ticks"
      }))

      // Subscribe to live ticks
      ws.send(JSON.stringify({
        ticks: symbol,
        subscribe: 1
      }))
    }

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data)
      
      // Handle historical data
      if (data.history) {
        const historicalData: PriceData[] = data.history.times.map((time: number, index: number) => ({
          time: new Date(time * 1000).toLocaleTimeString(),
          price: parseFloat(data.history.prices[index]),
          epoch: time
        }))
        setPriceData(historicalData)
        if (historicalData.length > 0) {
          const lastPrice = historicalData[historicalData.length - 1].price
          setCurrentPrice(lastPrice)
          
          // Calculate price change
          if (historicalData.length > 1) {
            const firstPrice = historicalData[0].price
            const change = ((lastPrice - firstPrice) / firstPrice) * 100
            setPriceChange(change)
          }
        }
      }

      // Handle live tick updates
      if (data.tick) {
        const newPrice: PriceData = {
          time: new Date(data.tick.epoch * 1000).toLocaleTimeString(),
          price: data.tick.quote,
          epoch: data.tick.epoch
        }

        setPriceData(prev => {
          const updated = [...prev, newPrice]
          // Keep only last 100 data points
          return updated.slice(-100)
        })

        // Update current price and change
        setCurrentPrice(data.tick.quote)
        if (priceData.length > 0) {
          const firstPrice = priceData[0].price
          const change = ((data.tick.quote - firstPrice) / firstPrice) * 100
          setPriceChange(change)
        }
      }
    }

    ws.onerror = (error) => {
      console.error('Chart WebSocket error:', error)
    }

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
  }, [symbol, isDeriv])

  if (!isDeriv) {
    return (
      <Card className="bg-gradient-to-br from-gray-500/10 to-gray-500/5 border-gray-500/20">
        <CardHeader>
          <CardTitle className="text-lg">Price Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center">
            Connect Deriv account to view real-time charts
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-[#ff444f]/10 to-[#ff444f]/5 border-[#ff444f]/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#ff444f]" />
              {symbol}
            </CardTitle>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-2xl font-bold text-[#ff444f]">
                {currentPrice.toFixed(5)}
              </p>
              <Badge className={
                priceChange >= 0
                  ? "bg-green-500/10 text-green-500 border-green-500/20"
                  : "bg-red-500/10 text-red-500 border-red-500/20"
              }>
                {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(2)}%
              </Badge>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Select value={chartType} onValueChange={(v) => setChartType(v as "line" | "area")}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">
                  <div className="flex items-center gap-2">
                    <LineChart className="h-4 w-4" />
                    Line
                  </div>
                </SelectItem>
                <SelectItem value="area">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Area
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "line" ? (
              <RechartsLineChart data={priceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="time" 
                  stroke="#666"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => {
                    // Show only every 10th tick
                    return ''
                  }}
                />
                <YAxis 
                  stroke="#666"
                  domain={['dataMin - 0.0001', 'dataMax + 0.0001']}
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => value.toFixed(5)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    padding: '8px'
                  }}
                  labelStyle={{ color: '#999' }}
                  formatter={(value: any) => [value.toFixed(5), 'Price']}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#ff444f"
                  strokeWidth={2}
                  dot={false}
                  animationDuration={300}
                />
              </RechartsLineChart>
            ) : (
              <AreaChart data={priceData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff444f" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ff444f" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="time" 
                  stroke="#666"
                  style={{ fontSize: '12px' }}
                  tickFormatter={() => ''}
                />
                <YAxis 
                  stroke="#666"
                  domain={['dataMin - 0.0001', 'dataMax + 0.0001']}
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => value.toFixed(5)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    padding: '8px'
                  }}
                  labelStyle={{ color: '#999' }}
                  formatter={(value: any) => [value.toFixed(5), 'Price']}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#ff444f"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPrice)"
                  animationDuration={300}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Real-time indicator */}
        <div className="mt-3 flex items-center justify-center">
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            Live Data
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
