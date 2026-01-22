export const calculateRSI = (candles: any[], period = 14): number => {
  if (!candles || candles.length < 2) {
    return 50 // Return a neutral value if not enough data
  }

  // If we don't have enough candles for the full period, use what we have
  const actualPeriod = Math.min(period, candles.length - 1)

  let gains = 0
  let losses = 0

  // Calculate initial gains and losses
  for (let i = 1; i <= actualPeriod; i++) {
    const current = candles[i]
    const previous = candles[i - 1]

    if (!current || !previous || typeof current.close !== "number" || typeof previous.close !== "number") {
      continue
    }

    const change = current.close - previous.close
    if (change > 0) {
      gains += change
    } else {
      losses += Math.abs(change)
    }
  }

  if (actualPeriod === 0) {
    return 50
  }

  const avgGain = gains / actualPeriod
  const avgLoss = losses / actualPeriod

  if (avgLoss === 0) {
    return avgGain > 0 ? 100 : 50
  }

  const rs = avgGain / avgLoss
  const rsi = 100 - 100 / (1 + rs)

  return Math.max(0, Math.min(100, rsi)) // Ensure RSI is between 0 and 100
}
