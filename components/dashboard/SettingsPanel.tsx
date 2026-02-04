/**
 * Settings Panel Component
 * Modal overlay with form for Risk Limits, Preferences, and API Config
 */

'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TradingPreferences, RiskLimits } from '@/types/dashboard'
import { Settings, Shield, Sliders, Key, Save, X } from 'lucide-react'
import { toast } from 'sonner'

interface SettingsPanelProps {
  isOpen: boolean
  preferences: TradingPreferences
  riskLimits: RiskLimits
  derivToken?: string
  onSave: (preferences: TradingPreferences, riskLimits: RiskLimits, derivToken?: string) => void
  onClose: () => void
}

export function SettingsPanel({
  isOpen,
  preferences,
  riskLimits,
  derivToken = '',
  onSave,
  onClose,
}: SettingsPanelProps) {
  // Local state for form inputs
  const [localPreferences, setLocalPreferences] = useState<TradingPreferences>(preferences)
  const [localRiskLimits, setLocalRiskLimits] = useState<RiskLimits>(riskLimits)
  const [localDerivToken, setLocalDerivToken] = useState<string>(derivToken)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(localPreferences, localRiskLimits, localDerivToken)
      toast.success('Settings saved successfully')
      onClose()
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    // Reset to original values
    setLocalPreferences(preferences)
    setLocalRiskLimits(riskLimits)
    setLocalDerivToken(derivToken)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2 text-xl">
            <Settings className="w-6 h-6 text-blue-400" />
            Settings
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Configure your trading preferences, risk limits, and API settings
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="risk" className="mt-4">
          <TabsList className="grid w-full grid-cols-3 bg-gray-900 border border-gray-700">
            <TabsTrigger value="risk" className="data-[state=active]:bg-gray-700">
              <Shield className="w-4 h-4 mr-2" />
              Risk Limits
            </TabsTrigger>
            <TabsTrigger value="preferences" className="data-[state=active]:bg-gray-700">
              <Sliders className="w-4 h-4 mr-2" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="api" className="data-[state=active]:bg-gray-700">
              <Key className="w-4 h-4 mr-2" />
              API Config
            </TabsTrigger>
          </TabsList>

          {/* Risk Limits Tab */}
          <TabsContent value="risk" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="daily-loss-limit" className="text-gray-300">
                  Daily Loss Limit ($)
                </Label>
                <Input
                  id="daily-loss-limit"
                  type="number"
                  min={0}
                  value={localRiskLimits.daily_loss_limit}
                  onChange={(e) =>
                    setLocalRiskLimits({
                      ...localRiskLimits,
                      daily_loss_limit: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="bg-gray-900 border-gray-700 text-white"
                />
                <p className="text-xs text-gray-500">
                  Trading will stop when daily losses reach this amount
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="daily-trade-limit" className="text-gray-300">
                  Daily Trade Limit
                </Label>
                <Input
                  id="daily-trade-limit"
                  type="number"
                  min={1}
                  value={localRiskLimits.daily_trade_limit}
                  onChange={(e) =>
                    setLocalRiskLimits({
                      ...localRiskLimits,
                      daily_trade_limit: parseInt(e.target.value) || 1,
                    })
                  }
                  className="bg-gray-900 border-gray-700 text-white"
                />
                <p className="text-xs text-gray-500">
                  Maximum number of trades allowed per day
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-stake" className="text-gray-300">
                  Maximum Stake ($)
                </Label>
                <Input
                  id="max-stake"
                  type="number"
                  min={1}
                  value={localRiskLimits.max_stake}
                  onChange={(e) =>
                    setLocalRiskLimits({
                      ...localRiskLimits,
                      max_stake: parseFloat(e.target.value) || 1,
                    })
                  }
                  className="bg-gray-900 border-gray-700 text-white"
                />
                <p className="text-xs text-gray-500">
                  Maximum amount that can be staked on a single trade
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-stake" className="text-gray-300">
                  Default Stake Amount ($)
                </Label>
                <Input
                  id="default-stake"
                  type="number"
                  min={1}
                  value={localPreferences.default_stake}
                  onChange={(e) =>
                    setLocalPreferences({
                      ...localPreferences,
                      default_stake: parseFloat(e.target.value) || 1,
                    })
                  }
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="default-duration" className="text-gray-300">
                  Default Trade Duration
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="default-duration"
                    type="number"
                    min={1}
                    value={localPreferences.default_duration}
                    onChange={(e) =>
                      setLocalPreferences({
                        ...localPreferences,
                        default_duration: parseInt(e.target.value) || 1,
                      })
                    }
                    className="bg-gray-900 border-gray-700 text-white flex-1"
                  />
                  <select
                    value={localPreferences.default_duration_unit}
                    onChange={(e) =>
                      setLocalPreferences({
                        ...localPreferences,
                        default_duration_unit: e.target.value as 's' | 'm' | 'h',
                      })
                    }
                    className="bg-gray-900 border border-gray-700 text-white rounded-md px-3"
                  >
                    <option value="s">Seconds</option>
                    <option value="m">Minutes</option>
                    <option value="h">Hours</option>
                  </select>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* API Config Tab */}
          <TabsContent value="api" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deriv-token" className="text-gray-300">
                  Deriv API Token
                </Label>
                <Input
                  id="deriv-token"
                  type="password"
                  value={localDerivToken}
                  onChange={(e) => setLocalDerivToken(e.target.value)}
                  placeholder="Enter your Deriv API token"
                  className="bg-gray-900 border-gray-700 text-white"
                />
                <p className="text-xs text-gray-500">
                  Your API token is encrypted and stored securely
                </p>
              </div>

              <div className="p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-400 mb-2">How to get your API token:</h4>
                <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
                  <li>Log in to your Deriv account</li>
                  <li>Go to Settings → API Token</li>
                  <li>Create a new token with trading permissions</li>
                  <li>Copy and paste the token here</li>
                </ol>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
            className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
