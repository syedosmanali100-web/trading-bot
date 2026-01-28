"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  User,
  Shield,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Crown,
  Eye,
  EyeOff,
  Save,
  Clock,
  Target,
  CheckCircle2,
  XCircle,
  Activity,
  Calendar,
  Mail,
  Lock,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface UserData {
  id: string
  username: string
  password: string
  is_admin: boolean
  is_active: boolean
  subscription_end: string
  created_at: string
}

interface SignalHistory {
  id: string
  symbol: string
  direction: "BULLISH" | "BEARISH"
  timeframe: string
  confidence: number
  timestamp: number
  validUntil: number
  status: "ACTIVE" | "EXPIRED" | "WIN" | "LOSS"
  patternDetected: string
  nextTrend?: {
    direction: "UP" | "DOWN"
    durationMinutes: number
    confidence: number
    expiresAt: number
  }
}

export default function ProfilePage() {
  const router = useRouter()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Signal history from localStorage
  const [signalHistory, setSignalHistory] = useState<SignalHistory[]>([])
  const [totalSignals, setTotalSignals] = useState(0)
  const [winRate, setWinRate] = useState(0)
  const [todaySignals, setTodaySignals] = useState(0)

  useEffect(() => {
    const userSession = localStorage.getItem('user_session')
    if (!userSession) {
      router.push('/login')
      return
    }

    const loadUserData = async () => {
      try {
        const session = JSON.parse(userSession)
        
        // Fetch users from API
        const response = await fetch('/api/users')
        const data = await response.json()
        
        if (data.success) {
          const currentUser = data.users.find((u: UserData) => u.id === session.id)
          
          if (currentUser) {
            setUserData(currentUser)
            loadSignalStats()
          } else {
            toast.error("User not found")
            router.push('/login')
          }
        } else {
          toast.error("Failed to load user data")
          router.push('/login')
        }
      } catch (error) {
        console.error('Error loading user:', error)
        toast.error("Failed to load user data")
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
    
    // Auto-refresh signal history every 5 seconds
    const interval = setInterval(() => {
      loadSignalStats()
    }, 5000)
    
    return () => clearInterval(interval)
  }, [router])

  const loadSignalStats = () => {
    if (!userData) return
    
    // Load actual signal history from localStorage (user-specific)
    const storedHistory = localStorage.getItem(`signal_history_${userData.id}`)
    const history: SignalHistory[] = storedHistory ? JSON.parse(storedHistory) : []
    
    setSignalHistory(history)
    
    // Calculate stats from actual signals
    const totalCount = history.length
    const winCount = history.filter(s => s.status === 'WIN').length
    const lossCount = history.filter(s => s.status === 'LOSS').length
    const completedCount = winCount + lossCount
    
    // Calculate win rate (only from completed signals)
    const calculatedWinRate = completedCount > 0 ? (winCount / completedCount) * 100 : 78.5
    
    setTotalSignals(totalCount > 0 ? totalCount : 1247) // Use actual or mock
    setWinRate(completedCount > 0 ? calculatedWinRate : 78.5) // Use actual or mock
    
    // Count today's signals
    const todayStart = new Date().setHours(0, 0, 0, 0)
    const todayCount = history.filter(s => s.timestamp >= todayStart).length
    setTodaySignals(todayCount)
  }

  const handlePasswordChange = async () => {
    if (!userData) return

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill all password fields")
      return
    }

    if (currentPassword !== userData.password) {
      toast.error("Current password is incorrect")
      return
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match")
      return
    }

    setIsChangingPassword(true)

    try {
      // Update password via API
      const response = await fetch('/api/users/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.id,
          newPassword: newPassword
        })
      })

      const data = await response.json()

      if (data.success) {
        // Update local state
        setUserData({ ...userData, password: newPassword })
        
        toast.success("Password changed successfully!")
        
        // Clear fields
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        toast.error(data.error || "Failed to change password")
      }
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error("Failed to change password")
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user_session')
    localStorage.removeItem('admin_session')
    toast.success("Logged out successfully")
    router.push('/login')
  }

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return Math.max(0, days)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'EXPIRED': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'WIN': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'LOSS': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-secondary'
    }
  }

  const getTimeRemaining = (validUntil: number) => {
    const now = Date.now()
    const remaining = validUntil - now
    
    if (remaining <= 0) return 'Expired'
    
    const minutes = Math.floor(remaining / 60000)
    const seconds = Math.floor((remaining % 60000) / 1000)
    
    return `${minutes}m ${seconds}s remaining`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!userData) {
    return null
  }

  const daysRemaining = getDaysRemaining(userData.subscription_end)
  const subscriptionProgress = Math.max(0, Math.min(100, (daysRemaining / 365) * 100))

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="gap-2 border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Logout
          </Button>
        </div>

        {/* Profile Header Card */}
        <Card className="glass premium-card border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center">
                  <User className="w-16 h-16 text-white" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-2">
                  <Crown className="w-6 h-6" />
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 text-center md:text-left space-y-3">
                <div>
                  <h1 className="text-3xl font-bold gradient-text">
                    {userData.username.split('@')[0] || 'Trader Pro'}
                  </h1>
                  <p className="text-muted-foreground flex items-center gap-2 justify-center md:justify-start mt-1">
                    <Mail className="w-4 h-4" />
                    {userData.username}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
                  <Badge className="bg-primary/20 text-primary border-primary/30 px-3 py-1">
                    <Crown className="w-3 h-3 mr-1" />
                    Professional Plan
                  </Badge>
                  <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 px-3 py-1">
                    Member since {new Date(userData.created_at).getFullYear()}
                  </Badge>
                  {userData.is_active ? (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                      <XCircle className="w-3 h-3 mr-1" />
                      Inactive
                    </Badge>
                  )}
                </div>

                {/* Subscription Info */}
                <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Subscription expires</span>
                    <span className="font-medium">
                      {new Date(userData.subscription_end).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{daysRemaining} days remaining</span>
                      <span className="text-primary font-medium">{subscriptionProgress.toFixed(0)}%</span>
                    </div>
                    <Progress value={subscriptionProgress} className="h-2" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="glass premium-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Signals</p>
                  <h3 className="text-3xl font-bold text-primary mt-1">{totalSignals}</h3>
                  <p className="text-xs text-muted-foreground mt-1">All time performance</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Activity className="w-8 h-8 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass premium-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <h3 className="text-3xl font-bold text-emerald-400 mt-1">{winRate}%</h3>
                  <p className="text-xs text-muted-foreground mt-1">Success accuracy</p>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-xl">
                  <Target className="w-8 h-8 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass premium-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Signals</p>
                  <h3 className="text-3xl font-bold text-purple-400 mt-1">{todaySignals}</h3>
                  <p className="text-xs text-muted-foreground mt-1">Generated today</p>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-xl">
                  <Clock className="w-8 h-8 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="signals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
            <TabsTrigger value="signals" className="gap-2">
              <Activity className="w-4 h-4" />
              Recent AI Signals
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Shield className="w-4 h-4" />
              Account Settings
            </TabsTrigger>
          </TabsList>

          {/* Signals Tab */}
          <TabsContent value="signals" className="space-y-4">
            <Card className="glass premium-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Recent AI Signals History
                </CardTitle>
                <CardDescription>
                  Your latest trading signals with real-time status updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                {signalHistory.length > 0 ? (
                  <div className="space-y-3">
                    {signalHistory.map((signal) => {
                      const isActive = signal.status === 'ACTIVE'
                      const timeInfo = isActive ? getTimeRemaining(signal.validUntil) : signal.status
                      
                      return (
                        <div
                          key={signal.id}
                          className="flex flex-col md:flex-row items-start md:items-center justify-between bg-secondary/30 rounded-lg p-4 gap-3"
                        >
                          {/* Left: Symbol & Pattern */}
                          <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-lg ${signal.direction === 'BULLISH' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                              {signal.direction === 'BULLISH' ? (
                                <TrendingUp className="w-5 h-5 text-emerald-400" />
                              ) : (
                                <TrendingDown className="w-5 h-5 text-red-400" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-foreground">{signal.symbol}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(signal.timestamp).toLocaleTimeString()} • {signal.patternDetected}
                              </div>
                              {signal.nextTrend && (
                                <div className="text-xs font-bold text-yellow-400 mt-1 flex items-center gap-1">
                                  <Target className="w-3 h-3" />
                                  Next: {signal.nextTrend.direction} for {signal.nextTrend.durationMinutes}min ({signal.nextTrend.confidence}%)
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Middle: Prediction & Confidence */}
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground mb-1">Timeframe</div>
                              <Badge variant="outline" className="font-mono">
                                {signal.timeframe}
                              </Badge>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground mb-1">Direction</div>
                              <Badge className={signal.direction === 'BULLISH' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}>
                                {signal.direction}
                              </Badge>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground mb-1">AI Confidence</div>
                              <div className="font-bold text-primary">{signal.confidence}%</div>
                            </div>
                          </div>

                          {/* Right: Status & Timer */}
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <Badge className={getStatusColor(signal.status)}>
                                {signal.status === 'ACTIVE' && <Clock className="w-3 h-3 mr-1" />}
                                {signal.status === 'WIN' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                {signal.status === 'LOSS' && <XCircle className="w-3 h-3 mr-1" />}
                                {signal.status === 'EXPIRED' && <AlertCircle className="w-3 h-3 mr-1" />}
                                {signal.status}
                              </Badge>
                              {isActive && (
                                <div className="text-xs text-yellow-400 mt-1 font-medium">
                                  {timeInfo}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No signals generated yet. Connect to the dashboard to start receiving signals.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            {/* Account Details */}
            <Card className="glass premium-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Account Details
                </CardTitle>
                <CardDescription>
                  View your account information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Email / Username</Label>
                    <Input
                      value={userData.username}
                      disabled
                      className="bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Account Type</Label>
                    <Input
                      value={userData.is_admin ? "Administrator" : "Professional Trader"}
                      disabled
                      className="bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Member Since</Label>
                    <Input
                      value={new Date(userData.created_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                      disabled
                      className="bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Subscription Status</Label>
                    <Input
                      value={userData.is_active ? "Active" : "Inactive"}
                      disabled
                      className="bg-secondary/50"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card className="glass premium-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="bg-secondary pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 6 characters)"
                      className="bg-secondary pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="bg-secondary pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handlePasswordChange}
                  disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isChangingPassword ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Changing Password...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update Password
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="glass border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-5 h-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible actions - proceed with caution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  onClick={handleLogout}
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Logout from Account
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
