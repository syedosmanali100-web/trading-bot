/**
 * Analytics Section Component
 * Displays profit/loss chart, win rate trend, and top assets
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AnalyticsData } from '@/types/dashboard'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Award, Calendar } from 'lucide-react'

interface AnalyticsSectionProps {
  data: AnalyticsData
  timePeriod: 'day' | 'week' | 'month'
  onTimePeriodChange: (period: 'day' | 'week' | 'month') => void
}

export function AnalyticsSection({
  data,
  timePeriod,
  onTimePeriodChange,
}: AnalyticsSectionProps) {
  return (
    <div className="space-y-6">
      {/* Time Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Calendar className="w-6 h-6 text-blue-400" />
          Analytics
        </h2>
        <Tabs value={timePeriod} onValueChange={(v) => onTimePeriodChange(v as any)}>
          <TabsList className="bg-gray-800 border border-gray-700">
            <TabsTrigger value="day" className="data-[state=active]:bg-blue-600">
              Day
            </TabsTrigger>
            <TabsTrigger value="week" className="data-[state=active]:bg-blue-600">
              Week
            </TabsTrigger>
            <TabsTrigger value="month" className="data-[state=active]:bg-blue-600">
              Month
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profit/Loss Chart */}
        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Profit/Loss Trend
            </CardTitle>
            <CardDescription className="text-gray-400">
              Daily performance over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.daily_pnl}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    return `${date.getMonth() + 1}/${date.getDate()}`
                  }}
                />
                <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Profit/Loss']}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ fill: '#10B981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Win Rate Trend Chart */}
        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-400" />
              Win Rate Trend
            </CardTitle>
            <CardDescription className="text-gray-400">
              Success rate over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.win_rate_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    return `${date.getMonth() + 1}/${date.getDate()}`
                  }}
                />
                <YAxis
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Win Rate']}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#A855F7"
                  strokeWidth={2}
                  dot={{ fill: '#A855F7', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Assets */}
      <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Top Performing Assets
          </CardTitle>
          <CardDescription className="text-gray-400">
            Best assets by profit
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.top_assets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No trading data available yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.top_assets.map((asset, index) => (
                <div
                  key={asset.asset}
                  className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-white">{asset.asset}</div>
                      <div className="text-sm text-gray-400">{asset.trades} trades</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-semibold ${
                        asset.profit >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {asset.profit >= 0 ? '+' : ''}${asset.profit.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-400">profit</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
