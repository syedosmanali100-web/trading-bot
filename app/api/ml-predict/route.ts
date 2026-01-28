import { NextResponse } from 'next/server';

// ML Prediction API endpoint
export async function POST(request: Request) {
  try {
    const { features, symbol, timeframe } = await request.json();

    // In production, this would call your Python ML models
    // For now, we'll simulate the predictions
    
    // Simulate model predictions (replace with actual model calls)
    const directionProb = Math.random() * 0.4 + 0.5; // 0.5-0.9
    const volatilityProb = Math.random() * 0.3 + 0.6; // 0.6-0.9
    const noTradeProb = Math.random() * 0.4; // 0-0.4

    // Calculate signal strength
    const signalStrength = calculateSignalStrength(
      directionProb,
      volatilityProb,
      noTradeProb
    );

    // Generate recommendation
    const recommendation = generateRecommendation(
      directionProb,
      volatilityProb,
      noTradeProb
    );

    return NextResponse.json({
      success: true,
      predictions: {
        direction: {
          probability: directionProb,
          label: directionProb > 0.5 ? 'LONG' : 'SHORT',
          confidence: Math.abs(directionProb - 0.5) * 2
        },
        volatility: {
          probability: volatilityProb,
          label: volatilityProb > 0.5 ? 'HIGH' : 'LOW',
          expansion: volatilityProb > 0.7
        },
        noTrade: {
          probability: noTradeProb,
          shouldTrade: noTradeProb < 0.7,
          reason: noTradeProb > 0.7 ? 'Poor market conditions' : 'Good conditions'
        }
      },
      signal: {
        strength: signalStrength,
        recommendation: recommendation,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('ML Prediction error:', error);
    return NextResponse.json(
      { success: false, error: 'Prediction failed' },
      { status: 500 }
    );
  }
}

function calculateSignalStrength(
  directionProb: number,
  volatilityProb: number,
  noTradeProb: number
): number {
  // Strong signal requires:
  // - High direction confidence
  // - High volatility (for clear moves)
  // - Low no-trade probability
  
  const directionStrength = Math.abs(directionProb - 0.5) * 2; // 0-1
  const volatilityBonus = volatilityProb > 0.7 ? 0.2 : 0;
  const noTradePenalty = noTradeProb > 0.5 ? -0.3 : 0;
  
  const strength = Math.max(0, Math.min(1, 
    directionStrength + volatilityBonus + noTradePenalty
  ));
  
  return Math.round(strength * 100) / 100;
}

function generateRecommendation(
  directionProb: number,
  volatilityProb: number,
  noTradeProb: number
): string {
  // No trade if conditions are poor
  if (noTradeProb > 0.7) {
    return 'NO_TRADE';
  }
  
  // Strong signals
  if (directionProb > 0.7 && volatilityProb > 0.6) {
    return 'STRONG_LONG';
  }
  if (directionProb < 0.3 && volatilityProb > 0.6) {
    return 'STRONG_SHORT';
  }
  
  // Weak signals
  if (directionProb > 0.6) {
    return 'WEAK_LONG';
  }
  if (directionProb < 0.4) {
    return 'WEAK_SHORT';
  }
  
  return 'NO_TRADE';
}
