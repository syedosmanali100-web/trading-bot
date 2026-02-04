"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Loader2, Eye, EyeOff, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"

function LoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDerivLoading, setIsDerivLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check for OAuth errors
  useEffect(() => {
    const error = searchParams.get('error')
    if (error) {
      switch(error) {
        case 'auth_failed':
          toast.error('Deriv authentication failed. Please try again.')
          break
        case 'no_accounts':
          toast.error('No Deriv accounts found. Please create a Deriv account first.')
          break
        case 'invalid_token':
          toast.error('Invalid Deriv token. Please try again.')
          break
        case 'server_error':
          toast.error('Server error occurred. Please try again later.')
          break
      }
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim()
        })
      })

      const data = await response.json()

      if (!data.success) {
        toast.error(data.error || "Login failed")
        setIsLoading(false)
        return
      }

      localStorage.setItem('user_session', JSON.stringify(data.user))
      toast.success("Login successful!")
      
      if (data.user.is_admin) {
        router.push('/admin')
      } else {
        router.push('/')
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDerivLogin = () => {
    setIsDerivLoading(true)
    
    // Generate state for CSRF protection
    const state = Math.random().toString(36).substring(7)
    localStorage.setItem('deriv_oauth_state', state)
    
    // Redirect to Deriv OAuth
    const derivOAuthUrl = `https://oauth.deriv.com/oauth2/authorize?` +
      `app_id=124906&` +
      `l=EN&` +
      `brand=deriv&` +
      `redirect_uri=${encodeURIComponent(window.location.origin + '/api/auth/deriv/callback')}&` +
      `state=${state}`
    
    window.location.href = derivOAuthUrl
  }

  const handleDerivSignup = () => {
    // Open Deriv signup with your referral link
    const referralLink = 'https://deriv.com/signup/?affiliate_token=YOUR_AFFILIATE_TOKEN'
    window.open(referralLink, '_blank')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Brand */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-4 bg-primary/10 rounded-2xl">
              <Shield className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold gradient-text">NEXUS TRADING</h1>
          <p className="text-muted-foreground">Professional Trading Signals Platform</p>
        </div>

        {/* Login Card */}
        <Card className="glass premium-card border-primary/20">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>Sign in to access your trading dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Deriv OAuth Login */}
            <Button
              type="button"
              variant="outline"
              className="w-full border-2 border-[#ff444f] hover:bg-[#ff444f]/10 text-[#ff444f] font-semibold h-12"
              onClick={handleDerivLogin}
              disabled={isDerivLoading}
            >
              {isDerivLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Connecting to Deriv...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                  </svg>
                  Continue with Deriv
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or login with email
                </span>
              </div>
            </div>

            {/* Email/Password Login */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Email/Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your email address"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="bg-secondary border-border"
                  disabled={isLoading || isDerivLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-secondary border-border pr-10"
                    disabled={isLoading || isDerivLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading || isDerivLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isLoading || isDerivLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Deriv Signup CTA */}
            <div className="mt-4 p-4 bg-[#ff444f]/10 border border-[#ff444f]/30 rounded-lg">
              <p className="text-sm text-center text-muted-foreground mb-2">
                Don't have a Deriv account yet?
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full border-[#ff444f] text-[#ff444f] hover:bg-[#ff444f]/10"
                onClick={handleDerivSignup}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Create Free Deriv Account
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">
                Get 1 year free bot access when you sign up!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Admin Link */}
        <div className="text-center">
          <Button
            variant="link"
            className="text-xs text-muted-foreground hover:text-primary"
            onClick={() => router.push('/admin')}
          >
            Admin Access
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>© 2024 Nexus Trading Signals. All rights reserved.</p>
          <p className="mt-1">Secure and encrypted connection 🔒</p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
