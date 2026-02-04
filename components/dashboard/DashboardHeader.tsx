/**
 * Dashboard Header Component
 * Displays user info, connection status, and navigation
 */

'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, Users, LogOut, Wifi, WifiOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface DashboardHeaderProps {
  username: string
  isAdmin: boolean
  isDerivConnected: boolean
  derivAccountId?: string
  onLogout: () => void
}

export function DashboardHeader({
  username,
  isAdmin,
  isDerivConnected,
  derivAccountId,
  onLogout,
}: DashboardHeaderProps) {
  const router = useRouter()

  const handleLogout = () => {
    onLogout()
    toast.success('Logged out successfully')
    router.push('/login')
  }

  const handleProfileClick = () => {
    router.push('/profile')
  }

  const handleAdminClick = () => {
    router.push('/admin')
  }

  // Extract display name from email
  const displayName = username.includes('@') 
    ? username.split('@')[0] 
    : username

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
      {/* Left Section: Title and User Info */}
      <div className="flex-1">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Trading Dashboard
        </h1>
        <div className="flex items-center gap-3 mt-2">
          <p className="text-gray-400">
            Welcome back, <span className="text-white font-medium">{displayName}</span>
          </p>
          
          {/* Deriv Connection Status */}
          <DerivConnectionBadge 
            isConnected={isDerivConnected} 
            accountId={derivAccountId} 
          />
        </div>
      </div>

      {/* Right Section: Navigation Buttons */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="outline"
          onClick={handleProfileClick}
          className="gap-2 border-gray-700 text-white hover:bg-gray-800"
        >
          <Shield className="w-4 h-4" />
          <span className="hidden sm:inline">Profile</span>
        </Button>

        {isAdmin && (
          <Button
            variant="outline"
            onClick={handleAdminClick}
            className="gap-2 border-purple-500 text-purple-400 hover:bg-purple-900/30"
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Admin</span>
          </Button>
        )}

        <Button
          variant="outline"
          onClick={handleLogout}
          className="gap-2 border-red-500 text-red-400 hover:bg-red-900/30"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </div>
  )
}

interface DerivConnectionBadgeProps {
  isConnected: boolean
  accountId?: string
}

function DerivConnectionBadge({ isConnected, accountId }: DerivConnectionBadgeProps) {
  if (!isConnected) {
    return (
      <Badge 
        variant="outline" 
        className="gap-1.5 border-red-500/50 text-red-400 bg-red-900/20"
      >
        <WifiOff className="w-3 h-3" />
        <span className="text-xs">Disconnected</span>
      </Badge>
    )
  }

  return (
    <Badge 
      variant="outline" 
      className="gap-1.5 border-green-500/50 text-green-400 bg-green-900/20"
    >
      <Wifi className="w-3 h-3" />
      <span className="text-xs">
        Connected {accountId && `• ${accountId.slice(0, 8)}`}
      </span>
    </Badge>
  )
}
