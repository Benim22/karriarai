"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft, Mail } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })
      
      if (error) throw error
      setSuccess(true)
    } catch (error: any) {
      setError(error.message || "Ett fel uppstod vid återställning av lösenord")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-blue-950/20 dark:via-background dark:to-emerald-950/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">E-post skickat!</h2>
            <p className="text-muted-foreground mb-6">
              Vi har skickat instruktioner för återställning av lösenord till {email}. 
              Kontrollera din inkorg och följ länken för att skapa ett nytt lösenord.
            </p>
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/auth/login">Tillbaka till inloggning</Link>
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setSuccess(false)}>
                Skicka till annan e-post
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-blue-950/20 dark:via-background dark:to-emerald-950/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link href="/auth/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tillbaka till inloggning
          </Link>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 flex items-center justify-center mb-4">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <CardTitle className="text-2xl">Återställ lösenord</CardTitle>
            <CardDescription>
              Ange din e-postadress så skickar vi dig instruktioner för att återställa ditt lösenord
            </CardDescription>
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

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Skicka återställningslänk
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Kom du ihåg ditt lösenord?{" "}
              <Link href="/auth/login" className="text-primary hover:underline">
                Logga in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 