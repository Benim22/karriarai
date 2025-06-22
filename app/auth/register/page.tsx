"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/components/auth-provider"
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react"

export default function RegisterPage() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (password !== confirmPassword) {
      setError("Lösenorden matchar inte")
      setLoading(false)
      return
    }

    if (!acceptTerms) {
      setError("Du måste acceptera användarvillkoren")
      setLoading(false)
      return
    }

    try {
      await signUp(email, password, fullName)
      setSuccess(true)
    } catch (error: any) {
      setError(error.message || "Ett fel uppstod vid registrering")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-blue-950/20 dark:via-background dark:to-emerald-950/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Kontot skapat!</h2>
            <p className="text-muted-foreground mb-6">
              Vi har skickat en bekräftelselänk till {email}. Klicka på länken för att aktivera ditt konto.
            </p>
            <Button asChild className="w-full">
              <Link href="/auth/login">Gå till inloggning</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
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
            <CardTitle className="text-2xl">Skapa ditt konto</CardTitle>
            <CardDescription>Kom igång med KarriärAI idag - helt gratis</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName">Fullständigt namn</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Anna Andersson"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-postadress</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="anna@example.se"
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
                  placeholder="Minst 8 tecken"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Bekräfta lösenord</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Upprepa lösenord"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                />
                <Label htmlFor="terms" className="text-sm">
                  Jag accepterar{" "}
                  <Link href="/användarvillkor" className="text-primary hover:underline">
                    användarvillkoren
                  </Link>{" "}
                  och{" "}
                  <Link href="/integritetspolicy" className="text-primary hover:underline">
                    integritetspolicyn
                  </Link>
                </Label>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Skapa konto
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Har du redan ett konto?{" "}
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
