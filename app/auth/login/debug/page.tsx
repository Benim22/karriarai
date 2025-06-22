"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginDebugPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const { signIn, user, loading: authLoading } = useAuth()
  const router = useRouter()

  const addDebug = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugInfo(prev => [...prev, `${timestamp}: ${message}`])
    console.log(`DEBUG: ${message}`)
  }

  useEffect(() => {
    addDebug(`Auth loading: ${authLoading}, User: ${user ? user.email : 'null'}`)
    
    if (user && !authLoading) {
      addDebug("User is logged in, attempting redirect...")
      setLoading(false)
      
      // Try multiple redirect methods
      setTimeout(() => {
        addDebug("Executing router.push('/dashboard')")
        router.push('/dashboard')
      }, 100)
      
      setTimeout(() => {
        addDebug("Fallback: window.location.href redirect")
        window.location.href = '/dashboard'
      }, 2000)
    }
  }, [user, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    addDebug("Starting sign in process...")

    try {
      addDebug("Calling signIn function...")
      await signIn(email, password)
      addDebug("signIn function completed successfully")
    } catch (error: any) {
      addDebug(`Sign in error: ${error.message}`)
      setError(error.message || "Ett fel uppstod vid inloggning")
      setLoading(false)
    }
  }

  const handleManualRedirect = () => {
    addDebug("Manual redirect button clicked")
    router.push('/dashboard')
  }

  const handleForceRedirect = () => {
    addDebug("Force redirect button clicked")
    window.location.href = '/dashboard'
  }

  const handleCheckAuth = () => {
    addDebug(`Current auth state - Loading: ${authLoading}, User: ${user ? user.email : 'null'}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Login Debug</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button type="submit" disabled={loading}>
                {loading ? "Loggar in..." : "Logga in"}
              </Button>
            </form>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handleManualRedirect} variant="outline" size="sm">
                Manual Redirect
              </Button>
              <Button onClick={handleForceRedirect} variant="outline" size="sm">
                Force Redirect
              </Button>
              <Button onClick={handleCheckAuth} variant="outline" size="sm">
                Check Auth State
              </Button>
              <Button onClick={() => setDebugInfo([])} variant="outline" size="sm">
                Clear Log
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Current Auth State:</h3>
              <div className="text-sm space-y-1">
                <p>Auth Loading: <span className="font-mono">{authLoading ? 'true' : 'false'}</span></p>
                <p>User: <span className="font-mono">{user ? user.email : 'null'}</span></p>
                <p>User ID: <span className="font-mono">{user ? user.id : 'null'}</span></p>
                <p>Current URL: <span className="font-mono">{typeof window !== 'undefined' ? window.location.pathname : 'unknown'}</span></p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Debug Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-64 overflow-y-auto bg-gray-50 p-2 rounded">
              {debugInfo.length === 0 ? (
                <div className="text-gray-500 text-sm">No debug info yet...</div>
              ) : (
                debugInfo.map((info, index) => (
                  <div key={index} className="text-xs font-mono">
                    {info}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 