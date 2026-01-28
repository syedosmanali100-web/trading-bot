import { NextResponse } from 'next/server';

// Risk Management API endpoint
export async function POST(request: Request) {
  try {
    const {
      signal,
      accountBalance,
      symbol,
      atr,
      openPositions = 0
    } = await request.json();

    // Risk parameters
    const MAX_RISK_PER_TRADE = 0.02; // 2% per trade
    const MAX_DAILY_RISK = 0.06; // 6% daily
    const MAX_OPEN_POSITIONS = 3;
    const MIN_ACCOUNT_BALANCE = 100;
    const MAX_POSITION_SIZE_PERCENT = 0.1; // 10% of account

    // Perform risk checks
    const riskChecks = {
      accountBalance: checkAccountBalance(accountBalance, MIN_ACCOUNT_BALANCE),
      maxPositions: checkMaxPositions(openPositions, MAX_OPEN_POSITIONS),
      riskPerTrade: calculateRiskPerTrade(accountBalance, MAX_RISK_PER_TRADE),
      positionSize: calculatePositionSize(
        accountBalance,
        atr,
        MAX_RISK_PER_TRADE,
        MAX_POSITION_SIZE_PERCENT
      ),
      stopLoss: calculateStopLoss(atr),
      takeProfit: calculateTakeProfit(atr, signal.recommendation)
    };

    // Determine if trade is allowed
    const allowed = riskChecks.accountBalance.passed &&
                   riskChecks.maxPositions.passed &&
                   riskChecks.positionSize.amount > 0;

    // Calculate risk/reward ratio
    const riskRewardRatio = riskChecks.takeProfit.distance / riskChecks.stopLoss.distance;

    return NextResponse.json({
      success: true,
      allowed,
      checks: riskChecks,
      recommendation: {
        positionSize: riskChecks.positionSize.amount,
        stopLoss: riskChecks.stopLoss.distance,
        takeProfit: riskChecks.takeProfit.distance,
        riskAmount: riskChecks.riskPerTrade.amount,
        riskRewardRatio: Math.round(riskRewardRatio * 100) / 100,
        maxLoss: riskChecks.riskPerTrade.amount,
        potentialProfit: riskChecks.riskPerTrade.amount * riskRewardRatio
      },
      warnings: generateWarnings(riskChecks, accountBalance, openPositions)
    });
  } catch (error) {
    console.error('Risk check error:', error);
    return NextResponse.json(
      { success: false, error: 'Risk check failed' },
      { status: 500 }
    );
  }
}

function checkAccountBalance(balance: number, minBalance: number) {
  return {
    passed: balance >= minBalance,
    current: balance,
    minimum: minBalance,
    message: balance >= minBalance
      ? 'Account balance sufficient'
      : `Minimum balance required: $${minBalance}`
  };
}

function checkMaxPositions(current: number, max: number) {
  return {
    passed: current < max,
    current,
    maximum: max,
    message: current < max
      ? `${max - current} positions available`
      : 'Maximum positions reached'
  };
}

function calculateRiskPerTrade(balance: number, riskPercent: number) {
  const amount = balance * riskPercent;
  return {
    amount: Math.round(amount * 100) / 100,
    percent: riskPercent * 100,
    message: `Risk ${riskPercent * 100}% of account ($${amount.toFixed(2)})`
  };
}

function calculatePositionSize(
  balance: number,
  atr: number,
  riskPercent: number,
  maxSizePercent: number
) {
  // Position size based on ATR and risk
  const riskAmount = balance * riskPercent;
  const stopLossDistance = atr * 2; // 2x ATR stop loss
  
  // Calculate position size
  let positionSize = riskAmount / stopLossDistance;
  
  // Cap at max position size
  const maxSize = balance * maxSizePercent;
  positionSize = Math.min(positionSize, maxSize);
  
  // Round to 2 decimals
  positionSize = Math.round(positionSize * 100) / 100;
  
  return {
    amount: positionSize,
    maxAllowed: maxSize,
    basedOnRisk: riskAmount / stopLossDistance,
    message: `Position size: $${positionSize.toFixed(2)}`
  };
}

function calculateStopLoss(atr: number) {
  // Stop loss at 2x ATR
  const distance = atr * 2;
  return {
    distance: Math.round(distance * 100) / 100,
    atrMultiple: 2,
    message: `Stop loss: ${distance.toFixed(2)} (2x ATR)`
  };
}

function calculateTakeProfit(atr: number, recommendation: string) {
  // Take profit based on signal strength
  let multiple = 3; // Default 3x ATR
  
  if (recommendation.includes('STRONG')) {
    multiple = 4; // 4x ATR for strong signals
  } else if (recommendation.includes('WEAK')) {
    multiple = 2; // 2x ATR for weak signals
  }
  
  const distance = atr * multiple;
  return {
    distance: Math.round(distance * 100) / 100,
    atrMultiple: multiple,
    message: `Take profit: ${distance.toFixed(2)} (${multiple}x ATR)`
  };
}

function generateWarnings(
  checks: any,
  balance: number,
  openPositions: number
): string[] {
  const warnings: string[] = [];
  
  if (!checks.accountBalance.passed) {
    warnings.push('⚠️ Account balance too low');
  }
  
  if (!checks.maxPositions.passed) {
    warnings.push('⚠️ Maximum positions reached');
  }
  
  if (balance < 500) {
    warnings.push('⚠️ Low account balance - consider smaller positions');
  }
  
  if (openPositions >= 2) {
    warnings.push('⚠️ Multiple open positions - monitor closely');
  }
  
  if (checks.positionSize.amount < 10) {
    warnings.push('⚠️ Position size very small - may not be profitable');
  }
  
  return warnings;
}
