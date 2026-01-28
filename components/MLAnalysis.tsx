"use client";

import { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertTriangle, Shield, Target, DollarSign } from 'lucide-react';

interface MLPrediction {
  direction: {
    probability: number;
    label: string;
    confidence: number;
  };
  volatility: {
    probability: number;
    label: string;
    expansion: boolean;
  };
  noTrade: {
    probability: number;
    shouldTrade: boolean;
    reason: string;
  };
}

interface RiskRecommendation {
  positionSize: number;
  stopLoss: number;
  takeProfit: number;
  riskAmount: number;
  riskRewardRatio: number;
  maxLoss: number;
  potentialProfit: number;
}

export default function MLAnalysis() {
  const [prediction, setPrediction] = useState<MLPrediction | null>(null);
  const [riskData, setRiskData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [accountBalance, setAccountBalance] = useState(1000);
  const [atr, setATR] = useState(15);

  const runMLAnalysis = async () => {
    setLoading(true);
    
    try {
      // Get ML predictions
      const mlResponse = await fetch('/api/ml-predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          features: {}, // In production, pass actual features
          symbol: 'BTCUSD',
          timeframe: '1h'
        })
      });
      
      const mlData = await mlResponse.json();
      
      if (mlData.success) {
        setPrediction(mlData.predictions);
        
        // Get risk analysis
        const riskResponse = await fetch('/api/risk-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            signal: mlData.signal,
            accountBalance,
            symbol: 'BTCUSD',
            atr,
            openPositions: 0
          })
        });
        
        const riskResult = await riskResponse.json();
        if (riskResult.success) {
          setRiskData(riskResult);
        }
      }
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">AI Trading Assistant</h2>
            <p className="text-purple-100">Machine Learning Powered Analysis</p>
          </div>
        </div>
        
        {/* Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm mb-2">Account Balance ($)</label>
            <input
              type="number"
              value={accountBalance}
              onChange={(e) => setAccountBalance(Number(e.target.value))}
              className="w-full px-4 py-2 rounded bg-white/20 border border-white/30 text-white"
              min="100"
              step="100"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">Current ATR</label>
            <input
              type="number"
              value={atr}
              onChange={(e) => setATR(Number(e.target.value))}
              className="w-full px-4 py-2 rounded bg-white/20 border border-white/30 text-white"
              min="1"
              step="1"
            />
          </div>
        </div>
        
        <button
          onClick={runMLAnalysis}
          disabled={loading}
          className="mt-4 w-full bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : '🤖 Run AI Analysis'}
        </button>
      </div>

      {/* ML Predictions */}
      {prediction && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Direction Prediction */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-blue-200">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <h3 className="font-bold text-lg">Direction</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Prediction:</span>
                <span className={`font-bold text-lg ${
                  prediction.direction.label === 'LONG' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {prediction.direction.label}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Confidence:</span>
                <span className="font-semibold">
                  {(prediction.direction.confidence * 100).toFixed(1)}%
                </span>
              </div>
              
              {/* Probability Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span>SHORT</span>
                  <span>LONG</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-red-500 to-green-500 h-3 rounded-full transition-all"
                    style={{ width: `${prediction.direction.probability * 100}%` }}
                  />
                </div>
                <div className="text-center text-sm mt-1 font-semibold">
                  {(prediction.direction.probability * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Volatility Prediction */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-orange-200">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              <h3 className="font-bold text-lg">Volatility</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Expected:</span>
                <span className={`font-bold text-lg ${
                  prediction.volatility.expansion ? 'text-orange-600' : 'text-blue-600'
                }`}>
                  {prediction.volatility.label}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Expansion:</span>
                <span className="font-semibold">
                  {prediction.volatility.expansion ? 'Yes (30%+)' : 'No'}
                </span>
              </div>
              
              {/* Probability Bar */}
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-orange-500 h-3 rounded-full transition-all"
                    style={{ width: `${prediction.volatility.probability * 100}%` }}
                  />
                </div>
                <div className="text-center text-sm mt-1 font-semibold">
                  {(prediction.volatility.probability * 100).toFixed(1)}%
                </div>
              </div>
              
              {prediction.volatility.expansion && (
                <div className="mt-2 p-2 bg-orange-50 rounded text-sm text-orange-700">
                  ⚡ High volatility expected - adjust position size
                </div>
              )}
            </div>
          </div>

          {/* No-Trade Filter */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-purple-200">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-6 h-6 text-purple-600" />
              <h3 className="font-bold text-lg">Trade Filter</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status:</span>
                <span className={`font-bold text-lg ${
                  prediction.noTrade.shouldTrade ? 'text-green-600' : 'text-red-600'
                }`}>
                  {prediction.noTrade.shouldTrade ? 'TRADE OK' : 'NO TRADE'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Risk Level:</span>
                <span className="font-semibold">
                  {(prediction.noTrade.probability * 100).toFixed(1)}%
                </span>
              </div>
              
              {/* Probability Bar */}
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      prediction.noTrade.probability > 0.7 ? 'bg-red-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${prediction.noTrade.probability * 100}%` }}
                  />
                </div>
                <div className="text-center text-sm mt-1 font-semibold">
                  {prediction.noTrade.probability > 0.7 ? 'Poor Conditions' : 'Good Conditions'}
                </div>
              </div>
              
              <div className="mt-2 p-2 bg-purple-50 rounded text-sm text-purple-700">
                {prediction.noTrade.reason}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Risk Management */}
      {riskData && riskData.allowed && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <Target className="w-6 h-6 text-green-600" />
            <h3 className="font-bold text-xl">Risk Management Plan</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Position Size */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Position Size</div>
              <div className="text-2xl font-bold text-blue-600">
                ${riskData.recommendation.positionSize.toFixed(2)}
              </div>
            </div>
            
            {/* Stop Loss */}
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Stop Loss</div>
              <div className="text-2xl font-bold text-red-600">
                {riskData.recommendation.stopLoss.toFixed(2)} pips
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Max Loss: ${riskData.recommendation.maxLoss.toFixed(2)}
              </div>
            </div>
            
            {/* Take Profit */}
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Take Profit</div>
              <div className="text-2xl font-bold text-green-600">
                {riskData.recommendation.takeProfit.toFixed(2)} pips
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Potential: ${riskData.recommendation.potentialProfit.toFixed(2)}
              </div>
            </div>
            
            {/* Risk/Reward */}
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Risk/Reward</div>
              <div className="text-2xl font-bold text-purple-600">
                1:{riskData.recommendation.riskRewardRatio.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {riskData.recommendation.riskRewardRatio >= 2 ? '✓ Good ratio' : '⚠️ Low ratio'}
              </div>
            </div>
          </div>
          
          {/* Warnings */}
          {riskData.warnings && riskData.warnings.length > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Warnings:</h4>
              <ul className="space-y-1">
                {riskData.warnings.map((warning: string, idx: number) => (
                  <li key={idx} className="text-sm text-yellow-700">{warning}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Action Button */}
          <div className="mt-6 flex gap-4">
            <button className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition">
              ✓ Execute Trade
            </button>
            <button className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition">
              ✗ Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* No Trade Allowed */}
      {riskData && !riskData.allowed && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div>
              <h3 className="font-bold text-xl text-red-600">Trade Not Allowed</h3>
              <p className="text-red-700">Risk management checks failed</p>
            </div>
          </div>
          
          {riskData.warnings && riskData.warnings.length > 0 && (
            <ul className="space-y-2">
              {riskData.warnings.map((warning: string, idx: number) => (
                <li key={idx} className="text-red-700">{warning}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
