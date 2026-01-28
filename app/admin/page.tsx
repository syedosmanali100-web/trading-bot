"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Shield, UserPlus, Copy, Check, Trash2, LogOut, Calendar, Users, Download, Upload } from "lucide-react"
import { toast } from "sonner"

interface User {
  id: string
  username: string
  password: string
  is_admin: boolean
  is_active: boolean
  subscription_end: string
  created_at: string
}

// Local storage helper functions
const USERS_KEY = 'app_users_db'

const getUsers = (): User[] => {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(USERS_KEY)
  return data ? JSON.parse(data) : []
}

const saveUsers = (users: User[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [subscriptionDays, setSubscriptionDays] = useState("30")
  const [newUserEmail, setNewUserEmail] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const router = useRouter()

  const ADMIN_PASSWORD = "admin123"

  useEffect(() => {
    const session = localStorage.getItem('admin_session')
    if (session) {
      setIsAuthenticated(true)
      loadUsers()
    } else {
      setIsLoading(false)
    }
  }, [])

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (adminPassword === ADMIN_PASSWORD) {
      localStorage.setItem('admin_session', 'true')
      setIsAuthenticated(true)
      toast.success("Admin access granted")
      loadUsers()
    } else {
      toast.error("Invalid admin password")
    }
  }

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      
      if (data.success) {
        setUsers(data.users)
      } else {
        toast.error("Failed to load users")
      }
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error("Failed to load users")
    } finally {
      setIsLoading(false)
    }
  }

  const generateRandomString = (length: number) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  const createNewUser = async () => {
    if (!newUserEmail.trim()) {
      toast.error("Please enter a valid email address")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newUserEmail)) {
      toast.error("Please enter a valid email format")
      return
    }

    setIsCreatingUser(true)
    try {
      const username = newUserEmail
      const password = generateRandomString(12)
      const subscriptionEnd = new Date()
      subscriptionEnd.setDate(subscriptionEnd.getDate() + parseInt(subscriptionDays))

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: generateUUID(),
          username,
          password,
          is_admin: false,
          is_active: true,
          subscription_end: subscriptionEnd.toISOString()
        })
      })

      const data = await response.json()

      if (!data.success) {
        toast.error(data.error || "Failed to create user")
        setIsCreatingUser(false)
        return
      }

      toast.success("User created successfully!")
      
      // Copy credentials to clipboard
      const credentials = `Email/Username: ${username}\nPassword: ${password}`
      navigator.clipboard.writeText(credentials)
      toast.success("Credentials copied to clipboard!")

      // Reset form and close dialog
      setNewUserEmail("")
      setIsCreateDialogOpen(false)
      loadUsers()
    } catch (error) {
      console.error('Error creating user:', error)
      toast.error("Failed to create user")
    } finally {
      setIsCreatingUser(false)
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return

    try {
      const response = await fetch(`/api/users?id=${userId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast.success("User deleted successfully")
        loadUsers()
      } else {
        toast.error("Failed to delete user")
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error("Failed to delete user")
    }
  }

  const toggleUserStatus = async (userId: string) => {
    try {
      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`User ${data.user.is_active ? 'activated' : 'deactivated'} successfully`)
        loadUsers()
      } else {
        toast.error("Failed to update user status")
      }
    } catch (error) {
      console.error('Error updating user status:', error)
      toast.error("Failed to update user status")
    }
  }

  const copyCredentials = (username: string, password: string, userId: string) => {
    const credentials = `Email/Username: ${username}\nPassword: ${password}`
    navigator.clipboard.writeText(credentials)
    setCopiedId(userId)
    toast.success("Credentials copied to clipboard!")
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_session')
    setIsAuthenticated(false)
    toast.success("Logged out successfully")
  }

  const exportUsers = () => {
    const dataStr = JSON.stringify(users, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `users_backup_${new Date().toISOString().split('T')[0]}.json`
    link.click()
    toast.success("Users exported successfully!")
  }

  const importUsers = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const importedUsers = JSON.parse(e.target?.result as string)
        if (!Array.isArray(importedUsers)) {
          toast.error("Invalid file format")
          return
        }

        let successCount = 0
        let errorCount = 0

        for (const user of importedUsers) {
          try {
            const response = await fetch('/api/users', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(user)
            })

            const data = await response.json()
            if (data.success) {
              successCount++
            } else {
              errorCount++
            }
          } catch (error) {
            errorCount++
          }
        }

        loadUsers()
        toast.success(`Imported ${successCount} users successfully! ${errorCount > 0 ? `${errorCount} failed.` : ''}`)
      } catch (error) {
        console.error('Import error:', error)
        toast.error("Failed to import users")
      }
    }
    reader.readAsText(file)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="p-4 bg-primary/10 rounded-2xl">
                <Shield className="w-12 h-12 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold gradient-text">ADMIN ACCESS</h1>
            <p className="text-muted-foreground">Enter admin password to continue</p>
          </div>

          <Card className="glass premium-card border-primary/20">
            <CardHeader>
              <CardTitle>Admin Authentication</CardTitle>
              <CardDescription>Secure access to user management</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Admin Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="Enter admin password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    className="bg-secondary border-border"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Access Admin Panel
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="text-center">
            <Button
              variant="link"
              className="text-xs text-muted-foreground hover:text-primary"
              onClick={() => router.push('/login')}
            >
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <div className="p-2 sm:p-3 bg-primary/10 rounded-xl">
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text">ADMIN PANEL</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">User Management & Subscription</p>
              <p className="text-xs text-primary mt-1">☁️ {users.length} users in cloud database</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={exportUsers}
              className="border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-10"
              size="sm"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Export
            </Button>
            <label htmlFor="import-users" className="flex-1 sm:flex-none">
              <Button
                variant="outline"
                className="border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground w-full text-xs sm:text-sm h-8 sm:h-10"
                onClick={() => document.getElementById('import-users')?.click()}
                size="sm"
              >
                <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Import
              </Button>
              <input
                id="import-users"
                type="file"
                accept=".json"
                onChange={importUsers}
                className="hidden"
              />
            </label>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-10"
              size="sm"
            >
              <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
          <Card className="glass premium-card">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Users</p>
                  <h3 className="text-2xl sm:text-3xl font-bold text-primary">{users.length}</h3>
                </div>
                <Users className="w-8 h-8 sm:w-12 sm:h-12 text-primary/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass premium-card">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Active Subscriptions</p>
                  <h3 className="text-2xl sm:text-3xl font-bold text-emerald-400">
                    {users.filter(u => u.is_active).length}
                  </h3>
                </div>
                <Check className="w-8 h-8 sm:w-12 sm:h-12 text-emerald-400/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass premium-card">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Inactive Users</p>
                  <h3 className="text-2xl sm:text-3xl font-bold text-red-400">
                    {users.filter(u => !u.is_active).length}
                  </h3>
                </div>
                <Trash2 className="w-8 h-8 sm:w-12 sm:h-12 text-red-400/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Management */}
        <Card className="glass premium-card">
          <CardHeader className="px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg sm:text-2xl">User Management</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Create, manage, and monitor user subscriptions</CardDescription>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10">
                    <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Create New User
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border w-[95vw] max-w-md mx-auto">
                  <DialogHeader>
                    <DialogTitle className="text-base sm:text-lg">Create New User</DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">
                      Enter user's email address to create account with auto-generated password
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 sm:space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="user-email" className="text-xs sm:text-sm">User Email Address</Label>
                      <Input
                        id="user-email"
                        type="email"
                        placeholder="user@example.com"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        className="bg-secondary border-border text-sm h-9 sm:h-10"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        This email will be used as the username/userid for login
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subscription-days" className="text-xs sm:text-sm">Subscription Duration (Days)</Label>
                      <Input
                        id="subscription-days"
                        type="number"
                        min="1"
                        value={subscriptionDays}
                        onChange={(e) => setSubscriptionDays(e.target.value)}
                        className="bg-secondary border-border text-sm h-9 sm:h-10"
                      />
                    </div>
                    <Button
                      onClick={createNewUser}
                      disabled={isCreatingUser || !newUserEmail.trim()}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs sm:text-sm h-9 sm:h-10"
                    >
                      {isCreatingUser ? "Creating User..." : "Create User & Generate Password"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No users created yet. Create your first user to get started.
              </div>
            ) : (
              <div className="overflow-x-auto -mx-2 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden rounded-md border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-secondary/50">
                          <TableHead className="text-xs sm:text-sm px-2 sm:px-4">Email</TableHead>
                          <TableHead className="text-xs sm:text-sm px-2 sm:px-4">Password</TableHead>
                          <TableHead className="text-xs sm:text-sm px-2 sm:px-4">Status</TableHead>
                          <TableHead className="text-xs sm:text-sm px-2 sm:px-4 hidden sm:table-cell">Subscription</TableHead>
                          <TableHead className="text-right text-xs sm:text-sm px-2 sm:px-4">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium text-xs sm:text-sm px-2 sm:px-4 max-w-[120px] sm:max-w-none truncate">{user.username}</TableCell>
                            <TableCell className="font-mono text-xs px-2 sm:px-4">{user.password}</TableCell>
                            <TableCell className="px-2 sm:px-4">
                              <Badge
                                variant={user.is_active ? "default" : "secondary"}
                                className={`text-xs ${user.is_active ? "bg-emerald-500/20 text-emerald-400" : ""}`}
                              >
                                {user.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs px-2 sm:px-4 hidden sm:table-cell">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(user.subscription_end).toLocaleDateString()}
                              </div>
                            </TableCell>
                            <TableCell className="text-right px-2 sm:px-4">
                              <div className="flex items-center justify-end gap-1 sm:gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyCredentials(user.username, user.password, user.id)}
                                  className="border-primary/30 h-7 w-7 sm:h-8 sm:w-8 p-0"
                                >
                                  {copiedId === user.id ? (
                                    <Check className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => toggleUserStatus(user.id)}
                                  className={`${user.is_active ? "border-yellow-500/30" : "border-emerald-500/30"} h-7 sm:h-8 px-2 text-xs hidden sm:inline-flex`}
                                >
                                  {user.is_active ? "Deactivate" : "Activate"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteUser(user.id)}
                                  className="border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground h-7 w-7 sm:h-8 sm:w-8 p-0"
                                >
                                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
