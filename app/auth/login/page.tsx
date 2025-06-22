"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/components/auth-provider"
import { Loader2, ArrowLeft } from "lucide-react"

function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { signIn, user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  // Redirect if user is already logged in
  useEffect(() => {
    if (user && !authLoading) {
      console.log("User is logged in, redirecting to:", redirectTo)
      setLoading(false)
      // Small delay to ensure state is settled, then redirect
      setTimeout(() => {
        router.replace(redirectTo)
      }, 100)
    }
  }, [user, authLoading, redirectTo, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      console.log("Starting sign in process...")
      await signIn(email, password)
      console.log("Sign in successful, auth state should update soon...")
      // Don't set loading to false here - let useEffect handle redirect
    } catch (error: any) {
      console.error("Sign in error:", error)
      setError(error.message || "Ett fel uppstod vid inloggning")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-blue-950/20 dark:via-background dark:to-emerald-950/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tillbaka till startsidan
          </Link>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 flex items-center justify-center mb-4">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <CardTitle className="text-2xl">Välkommen tillbaka</CardTitle>
            <CardDescription>Logga in på ditt KarriärAI-konto</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">E-postadress</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="din@email.se"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Lösenord</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Ditt lösenord"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Loggar in..." : "Logga in"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <Link href="/auth/forgot-password" className="text-primary hover:underline">
                Glömt lösenord?
              </Link>
            </div>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              Har du inget konto?{" "}
              <Link href="/auth/register" className="text-primary hover:underline">
                Registrera dig
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-blue-950/20 dark:via-background dark:to-emerald-950/20 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Laddar...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
