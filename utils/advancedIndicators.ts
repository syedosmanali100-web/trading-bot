interface MarketCandle {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  symbol: string
}

export const calculateAdvancedIndicators = (candles: MarketCandle[]) => {
  if (!candles || candles.length < 14) {
    return {
      rsi: 50,
      macd: 0,
      macdSignal: 0,
      macdHistogram: 0,
      bollingerUpper: 0,
      bollingerLower: 0,
      bollingerMiddle: 0,
      momentum: 0,
      stochastic: 50,
      williams: -50,
    }
  }

  const closes = candles.map((c) => c.close)
  const highs = candles.map((c) => c.high)
  const lows = candles.map((c) => c.low)

  // RSI Calculation
  const rsi = calculateRSI(closes, 14)

  // MACD Calculation
  const { macd, signal, histogram } = calculateMACD(closes)

  // Bollinger Bands
  const { upper, middle, lower } = calculateBollingerBands(closes, 20, 2)

  // Momentum
  const momentum = calculateMomentum(closes, 10)

  // Stochastic
  const stochastic = calculateStochastic(highs, lows, closes, 14)

  // Williams %R
  const williams = calculateWilliams(highs, lows, closes, 14)

  return {
    rsi,
    macd,
    macdSignal: signal,
    macdHistogram: histogram,
    bollingerUpper: upper,
    bollingerLower: lower,
    bollingerMiddle: middle,
    momentum,
    stochastic,
    williams,
  }
}

const calculateRSI = (prices: number[], period: number): number => {
  if (prices.length < period + 1) return 50

  let gains = 0
  let losses = 0

  for (let i = 1; i <= period; i++) {
    const change = prices[prices.length - i] - prices[prices.length - i - 1]
    if (change > 0) gains += change
    else losses -= change
  }

  const avgGain = gains / period
  const avgLoss = losses / period

  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

const calculateMACD = (prices: number[]) => {
  if (prices.length < 26) {
    return { macd: 0, signal: 0, histogram: 0 }
  }

  const ema12 = calculateEMA(prices, 12)
  const ema26 = calculateEMA(prices, 26)
  const macd = ema12 - ema26

  // For simplicity, using a basic signal line calculation
  const signal = macd * 0.9 // Simplified signal line

  return {
    macd,
    signal,
    histogram: macd - signal,
  }
}

const calculateEMA = (prices: number[], period: number): number => {
  if (prices.length < period) return prices[prices.length - 1]

  const multiplier = 2 / (period + 1)
  let ema = prices[prices.length - period]

  for (let i = prices.length - period + 1; i < prices.length; i++) {
    ema = prices[i] * multiplier + ema * (1 - multiplier)
  }

  return ema
}

const calculateBollingerBands = (prices: number[], period: number, stdDev: number) => {
  if (prices.length < period) {
    const price = prices[prices.length - 1]
    return { upper: price, middle: price, lower: price }
  }

  const recentPrices = prices.slice(-period)
  const middle = recentPrices.reduce((sum, price) => sum + price, 0) / period

  const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - middle, 2), 0) / period
  const standardDeviation = Math.sqrt(variance)

  return {
    upper: middle + standardDeviation * stdDev,
    middle,
    lower: middle - standardDeviation * stdDev,
  }
}

const calculateMomentum = (prices: number[], period: number): number => {
  if (prices.length < period + 1) return 0
  return prices[prices.length - 1] - prices[prices.length - period - 1]
}

const calculateStochastic = (highs: number[], lows: number[], closes: number[], period: number): number => {
  if (highs.length < period) return 50

  const recentHighs = highs.slice(-period)
  const recentLows = lows.slice(-period)
  const currentClose = closes[closes.length - 1]

  const highestHigh = Math.max(...recentHighs)
  const lowestLow = Math.min(...recentLows)

  if (highestHigh === lowestLow) return 50

  return ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100
}

const calculateWilliams = (highs: number[], lows: number[], closes: number[], period: number): number => {
  if (highs.length < period) return -50

  const recentHighs = highs.slice(-period)
  const recentLows = lows.slice(-period)
  const currentClose = closes[closes.length - 1]

  const highestHigh = Math.max(...recentHighs)
  const lowestLow = Math.min(...recentLows)

  if (highestHigh === lowestLow) return -50

  return ((highestHigh - currentClose) / (highestHigh - lowestLow)) * -100
}
