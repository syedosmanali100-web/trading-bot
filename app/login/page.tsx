"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Loader2, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface User {
  id: string
  username: string
  password: string
  is_admin: boolean
  is_active: boolean
  subscription_end: string
  created_at: string
}

const USERS_KEY = 'app_users_db'

const getUsers = (): User[] => {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(USERS_KEY)
  return data ? JSON.parse(data) : []
}

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Get all users from localStorage
      const allUsers = getUsers()
      
      // Debug: Log for troubleshooting
      console.log('Total users in storage:', allUsers.length)
      console.log('Attempting login with:', username)
      
      // Trim whitespace from inputs
      const trimmedUsername = username.trim()
      const trimmedPassword = password.trim()
      
      // Find user with matching credentials (case-insensitive email)
      const userData = allUsers.find(u => 
        u.username.toLowerCase() === trimmedUsername.toLowerCase() && 
        u.password === trimmedPassword
      )

      if (!userData) {
        console.log('Login failed - user not found')
        console.log('Available users:', allUsers.map(u => u.username))
        toast.error("Invalid username or password")
        setIsLoading(false)
        return
      }

      // Check if subscription is active
      if (!userData.is_active) {
        toast.error("Your subscription is not active. Please contact admin.")
        setIsLoading(false)
        return
      }

      // Check if subscription has expired
      const subscriptionEnd = new Date(userData.subscription_end)
      const now = new Date()
      if (subscriptionEnd < now) {
        toast.error("Your subscription has expired. Please contact admin.")
        setIsLoading(false)
        return
      }

      // Store user session
      localStorage.setItem('user_session', JSON.stringify({
        id: userData.id,
        username: userData.username,
        is_admin: userData.is_admin,
        subscription_end: userData.subscription_end
      }))

      toast.success("Login successful!")
      
      if (userData.is_admin) {
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
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
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
                  disabled={isLoading}
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
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
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
                disabled={isLoading}
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
          <p className="mt-1">Secure and encrypted connection</p>
          <div className="mt-3 flex items-center justify-center gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <button className="text-primary hover:underline">Terms & Conditions</button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold gradient-text">Terms & Conditions</DialogTitle>
                  <DialogDescription>Last Updated: January 2025</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <section>
                    <h3 className="text-lg font-bold text-foreground mb-2">1. Acceptance of Terms</h3>
                    <p>
                      By accessing and using Nexus Trading Signals ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service. The Service is owned and operated by Nexus Trading Signals ("we", "us", or "our"). These Terms and Conditions govern your use of our trading signal platform, including any content, functionality, and services offered on or through our platform.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-foreground mb-2">2. Risk Disclosure & Trading Disclaimer</h3>
                    <p className="mb-2">
                      <strong className="text-yellow-400">IMPORTANT NOTICE:</strong> Trading in financial markets, including forex, stocks, commodities, and cryptocurrencies, involves substantial risk of loss and is not suitable for all investors. The high degree of leverage can work against you as well as for you. Before deciding to trade, you should carefully consider your investment objectives, level of experience, and risk appetite.
                    </p>
                    <p className="mb-2">
                      <strong className="text-red-400">NO GUARANTEE OF PROFITS:</strong> The trading signals provided by Nexus Trading Signals are for informational and educational purposes only. They do not constitute financial advice, investment advice, trading advice, or any other sort of advice. We do not guarantee the accuracy, completeness, or timeliness of any signals or information provided.
                    </p>
                    <p className="mb-2">
                      <strong className="text-red-400">PAST PERFORMANCE IS NOT INDICATIVE OF FUTURE RESULTS:</strong> Any historical returns, expected returns, or probability projections are hypothetical in nature and may not reflect actual future performance. All trading signals are based on technical analysis and market conditions that can change rapidly.
                    </p>
                    <p>
                      <strong className="text-red-400">YOU ARE SOLELY RESPONSIBLE:</strong> You acknowledge that you are solely responsible for your own trading and investment decisions. We shall not be liable for any losses, damages, or claims arising from your use of our signals or platform. You should never invest money that you cannot afford to lose.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-foreground mb-2">3. Service Description</h3>
                    <p>
                      Nexus Trading Signals provides AI-powered trading signals based on technical analysis, candlestick patterns, and market indicators. Our service includes real-time signal generation, historical pattern analysis, confidence ratings, and market trend predictions. The signals are generated using proprietary algorithms and artificial intelligence models trained on historical market data.
                    </p>
                    <p className="mt-2">
                      We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time without prior notice. We may also impose limits on certain features or restrict your access to parts or all of the Service without notice or liability.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-foreground mb-2">4. User Accounts & Subscriptions</h3>
                    <p className="mb-2">
                      To access our services, you must create an account with valid credentials provided by our administrators. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                    </p>
                    <p className="mb-2">
                      <strong>Subscription Terms:</strong> Your subscription grants you access to our trading signals for the duration specified in your subscription plan. Subscriptions are non-transferable and non-refundable. Upon expiration of your subscription, your access to the Service will be automatically terminated unless renewed.
                    </p>
                    <p>
                      <strong>Account Termination:</strong> We reserve the right to suspend or terminate your account at any time for violation of these Terms, fraudulent activity, or any other reason we deem appropriate. You may not create multiple accounts or share your account credentials with others.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-foreground mb-2">5. Intellectual Property Rights</h3>
                    <p>
                      All content, features, and functionality of the Service, including but not limited to text, graphics, logos, icons, images, audio clips, video clips, data compilations, software, and the compilation thereof (collectively, the "Content"), are the exclusive property of Nexus Trading Signals and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
                    </p>
                    <p className="mt-2">
                      You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any of the material on our Service without our prior written consent. The trading algorithms, AI models, and signal generation methodologies are proprietary and confidential.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-foreground mb-2">6. Prohibited Uses</h3>
                    <p className="mb-2">You agree not to use the Service:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
                      <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                      <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
                      <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                      <li>To submit false or misleading information</li>
                      <li>To upload or transmit viruses or any other type of malicious code</li>
                      <li>To collect or track the personal information of others</li>
                      <li>To spam, phish, pharm, pretext, spider, crawl, or scrape</li>
                      <li>To reverse engineer, decompile, or attempt to extract the source code of our algorithms</li>
                      <li>To interfere with or circumvent the security features of the Service</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-foreground mb-2">7. Limitation of Liability</h3>
                    <p className="mb-2">
                      <strong className="text-red-400">TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:</strong> In no event shall Nexus Trading Signals, its directors, employees, partners, agents, suppliers, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Your access to or use of or inability to access or use the Service</li>
                      <li>Any conduct or content of any third party on the Service</li>
                      <li>Any trading losses incurred based on signals provided by the Service</li>
                      <li>Unauthorized access, use, or alteration of your transmissions or content</li>
                      <li>Statements or conduct of any third party on the Service</li>
                      <li>Any other matter relating to the Service</li>
                    </ul>
                    <p className="mt-2">
                      Our total liability to you for all claims arising from or related to the Service shall not exceed the amount you paid us in the twelve (12) months prior to the claim.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-foreground mb-2">8. Indemnification</h3>
                    <p>
                      You agree to defend, indemnify, and hold harmless Nexus Trading Signals and its licensee and licensors, and their employees, contractors, agents, officers, and directors, from and against any and all claims, damages, obligations, losses, liabilities, costs or debt, and expenses (including but not limited to attorney's fees), resulting from or arising out of: (a) your use and access of the Service; (b) your violation of any term of these Terms; (c) your violation of any third party right, including without limitation any copyright, property, or privacy right; or (d) any trading losses you incur.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-foreground mb-2">9. Data Privacy & Security</h3>
                    <p>
                      We take the security of your personal information seriously. All data transmitted through our platform is encrypted using industry-standard SSL/TLS protocols. We collect and store only the information necessary to provide our services, including your email address, subscription details, and trading activity logs.
                    </p>
                    <p className="mt-2">
                      We do not sell, trade, or rent your personal information to third parties. Your trading history and signal data are stored securely and are accessible only to you. We may use aggregated, anonymized data for improving our algorithms and services.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-foreground mb-2">10. No Financial Advice</h3>
                    <p>
                      <strong className="text-yellow-400">IMPORTANT:</strong> Nexus Trading Signals is not a registered investment advisor, broker-dealer, or financial planner. The information provided through our Service is for educational and informational purposes only and should not be construed as financial, investment, or trading advice.
                    </p>
                    <p className="mt-2">
                      You should consult with a licensed financial advisor before making any investment decisions. We do not provide personalized investment advice or recommendations tailored to your specific financial situation. All trading decisions are made at your own risk.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-foreground mb-2">11. Third-Party Services</h3>
                    <p>
                      Our Service may contain links to third-party websites, services, or resources (such as TradingView charts). We are not responsible for the content, accuracy, or opinions expressed in such websites or services. The inclusion of any link does not imply endorsement by us. Use of any such linked website or service is at your own risk.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-foreground mb-2">12. Modifications to Terms</h3>
                    <p>
                      We reserve the right to modify or replace these Terms at any time at our sole discretion. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-foreground mb-2">13. Governing Law & Dispute Resolution</h3>
                    <p>
                      These Terms shall be governed and construed in accordance with the laws of the jurisdiction in which Nexus Trading Signals operates, without regard to its conflict of law provisions. Any disputes arising from these Terms or your use of the Service shall be resolved through binding arbitration, except where prohibited by law.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-foreground mb-2">14. Severability</h3>
                    <p>
                      If any provision of these Terms is held to be unenforceable or invalid, such provision will be changed and interpreted to accomplish the objectives of such provision to the greatest extent possible under applicable law, and the remaining provisions will continue in full force and effect.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-foreground mb-2">15. Contact Information</h3>
                    <p>
                      If you have any questions about these Terms, please contact us through the admin panel or your designated account manager. We will respond to all inquiries within 48 business hours.
                    </p>
                  </section>

                  <section className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mt-6">
                    <h3 className="text-lg font-bold text-red-400 mb-2">⚠️ FINAL WARNING</h3>
                    <p className="text-red-300">
                      By using Nexus Trading Signals, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. You further acknowledge that trading involves significant risk and that you may lose all of your invested capital. You accept full responsibility for your trading decisions and agree that Nexus Trading Signals shall not be held liable for any losses you may incur.
                    </p>
                  </section>
                </div>
              </DialogContent>
            </Dialog>
            <span className="text-muted-foreground">•</span>
            <Dialog>
              <DialogTrigger asChild>
                <button className="text-primary hover:underline">Privacy Policy</button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold gradient-text">Privacy Policy</DialogTitle>
                  <DialogDescription>Last Updated: January 2025</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <section>
                    <h3 className="text-lg font-bold text-foreground mb-2">1. Introduction</h3>
                    <p>
                      Nexus Trading Signals ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our trading signal platform. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the platform.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-foreground mb-2">2. Information We Collect</h3>
                    <p className="mb-2"><strong>Personal Information:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-4 mb-3">
                      <li>Email address (used as username/user ID)</li>
                      <li>Account credentials (encrypted passwords)</li>
                      <li>Subscription information and payment history</li>
                      <li>Account creation date and last login timestamps</li>
                    </ul>
                    <p className="mb-2"><strong>Trading Activity Data:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-4 mb-3">
                      <li>Signal generation history and timestamps</li>
                      <li>Currency pairs and timeframes selected</li>
                      <li>Signal confidence levels and outcomes</li>
                      <li>Trading preferences and settings</li>
                    </ul>
                    <p className="mb-2"><strong>Technical Information:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Browser type and version</li>
                      <li>Device information and operating system</li>
                      <li>IP address and geographic location</li>
                      <li>Session duration and interaction patterns</li>
                      <li>Cookies and local storage data</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-foreground mb-2">3. How We Use Your Information</h3>
                    <p className="mb-2">We use the information we collect to:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Provide, operate, and maintain our trading signal platform</li>
                      <li>Authenticate your identity and manage your account</li>
                      <li>Process your subscription and manage billing</li>
                      <li>Generate personalized trading signals based on your preferences</li>
                      <li>Improve our AI algorithms and signal accuracy</li>
                      <li>Send you technical notices, updates, and security alerts</li>
                      <li>Respond to your comments, questions, and customer service requests</li>
                      <li>Monitor and analyze usage patterns to improve user experience</li>
                      <li>Detect, prevent, and address technical issues and security threats</li>
                      <li>Comply with legal obligations and enforce our Terms and Conditions</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-foreground mb-2">4. Data Storage & Security</h3>
                    <p className="mb-2">
                      <strong>Local Storage:</strong> Your trading signals and preferences are stored locally in your browser's localStorage. This data remains on your device and is not transmitted to our servers unless explicitly required for service functionality.
                    </p>
                    <p className="mb-2">
                      <strong>Encryption:</strong> All sensitive data, including passwords and personal information, is encrypted using industry-standard encryption protocols (AES-256). Data transmitted between your device and our servers is protected using SSL/TLS encryption.
                    </p>
                    <p className="mb-2">
                      <strong>Access Controls:</strong> We implement strict access controls to ensure that only authorized personnel can access your personal information. Our administrators undergo regular security training and are bound by confidentiality agreements.
                    </p>
                    <p>
                      <strong>Data Retention:</strong> We retain your personal information for as long as your account is active or as needed to provide you services. If you wish to delete your account, please contact our support team. Note that we may retain certain information as required by law or for legitimate business purposes.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-foreground mb-2">5. Information Sharing & Disclosure</h3>
                    <p className="mb-2">
                      <strong>We Do Not Sell Your Data:</strong> We do not sell, trade, or rent your personal information to third parties for marketing purposes.
                    </p>
                    <p className="mb-2">
                      <strong>Service Providers:</strong> We may share your information with third-party service providers who perform services on our behalf, such as payment processing, data analysis, email delivery, and hosting services. These providers are contractually obligated to protect your information and use it only for the purposes we specify.
                    </p>
                    <p className="mb-2">
                      <strong>Legal Requirements:</strong> We may disclose your information if required to do so by law or in response to valid requests by public authorities (e.g., court orders, subpoenas, or government agencies).
                    </p>
                    <p>
                      <strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity. We will notify you via email or prominent notice on our platform before your information becomes subject to a different privacy policy.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-foreground mb-2">6. Cookies & Tracking Technologies</h3>
                    <p className="mb-2">
                      We use cookies and similar tracking technologies to track activity on our platform and store certain information. Cookies are files with a small amount of data that are sent to your browser from a website and stored on your device.
                    </p>
                    <p className="mb-2"><strong>Types of Cookies We Use:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li><strong>Essential Cookies:</strong> Required for the platform to function properly (authentication, session management)</li>
                      <li><strong>Preference Cookies:</strong> Remember your settings and preferences (theme, language, trading pairs)</li>
                      <li><strong>Analytics Cookies:</strong> Help us understand how users interact with our platform</li>
                      <li><strong>Security Cookies:</strong> Detect and prevent security threats and fraudulent activity</li>
                    </ul>
                    <p className="mt-2">
                      You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our platform.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-foreground mb-2">7. Your Privacy Rights</h3>
                    <p className="mb-2">Depending on your location, you may have the following rights:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li><strong>Right to Access:</strong> Request a copy of the personal information we hold about you</li>
                      <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete information</li>
                      <li><strong>Right to Erasure:</strong> Request deletion of your personal information (subject to legal obligations)</li>
                      <li><strong>Right to Restrict Processing:</strong> Request limitation on how we use your information</li>
                      <li><strong>Right to Data Portability:</strong> Request transfer of your data to another service provider</li>
                      <li><strong>Right to Object:</strong> Object to our processing of your personal information</li>
                      <li><strong>Right to Withdraw Consent:</strong> Withdraw consent for data processing at any time</li>
                    </ul>
                    <p className="mt-2">
                      To exercise any of these rights, please contact us through your account manager or admin panel. We will respond to your request within 30 days.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-foreground mb-2">8. Children's Privacy</h3>
                    <p>
                      Our platform is not intended for individuals under the age of 18. We do not knowingly collect personal information from children under 18. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately. If we discover that a child under 18 has provided us with personal information, we will delete such information from our systems.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-foreground mb-2">9. International Data Transfers</h3>
                    <p>
                      Your information may be transferred to and maintained on computers located outside of your state, province, country, or other governmental jurisdiction where data protection laws may differ. By using our platform, you consent to the transfer of your information to our facilities and to the third parties with whom we share it as described in this policy.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-foreground mb-2">10. Third-Party Links</h3>
                    <p>
                      Our platform may contain links to third-party websites (such as TradingView). We are not responsible for the privacy practices of these external sites. We encourage you to read the privacy policies of every website you visit. This Privacy Policy applies only to information collected by our platform.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-foreground mb-2">11. Data Breach Notification</h3>
                    <p>
                      In the event of a data breach that affects your personal information, we will notify you within 72 hours of becoming aware of the breach. The notification will include the nature of the breach, the types of information affected, the measures we have taken to address the breach, and steps you can take to protect yourself.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-foreground mb-2">12. Changes to This Privacy Policy</h3>
                    <p>
                      We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-foreground mb-2">13. Contact Us</h3>
                    <p>
                      If you have any questions about this Privacy Policy, please contact us through your admin panel or designated account manager. We are committed to resolving any privacy concerns you may have.
                    </p>
                  </section>

                  <section className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-6">
                    <h3 className="text-lg font-bold text-blue-400 mb-2">🔒 Your Privacy Matters</h3>
                    <p className="text-blue-300">
                      At Nexus Trading Signals, we are committed to protecting your privacy and ensuring the security of your personal information. We employ industry-leading security measures and follow best practices to safeguard your data. Your trust is important to us, and we continuously work to maintain the highest standards of data protection.
                    </p>
                  </section>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  )
}
