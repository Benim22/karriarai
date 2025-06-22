"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CreditCard, Crown, Zap, Check, ArrowRight } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import Link from "next/link"

interface CVPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPayOneTime: () => void
  onUpgradeSubscription: () => void
}

export function CVPaymentDialog({ 
  open, 
  onOpenChange, 
  onPayOneTime, 
  onUpgradeSubscription 
}: CVPaymentDialogProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleOneTimePayment = async () => {
    setLoading(true)
    try {
      // Skapa Stripe checkout session för 19kr CV-kredit
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'one-time-cv',
          email: user?.email,
          quantity: 1
        }),
      })

      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      } else {
        throw new Error('Failed to create checkout session')
      }
    } catch (error) {
      console.error('Error creating payment:', error)
      // Visa felmeddelande
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Välj betalningsalternativ
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground">
              Du har nått din CV-gräns. Välj hur du vill fortsätta:
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Engångsbetalning */}
            <Card className="relative hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-3 p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full w-fit">
                  <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-xl">Engångsbetalning</CardTitle>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  19 kr
                </div>
                <p className="text-sm text-muted-foreground">
                  För ett extra CV
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>1 extra CV-kredit</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Ingen återkommande avgift</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Använd när du vill</span>
                  </div>
                </div>
                
                <Button 
                  onClick={handleOneTimePayment}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Betala 19 kr
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Prenumeration */}
            <Card className="relative hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20">
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-blue-600">
                REKOMMENDERAS
              </Badge>
              <CardHeader className="text-center pb-4 pt-6">
                <div className="mx-auto mb-3 p-3 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-full w-fit">
                  <Crown className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-xl">Pro Prenumeration</CardTitle>
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  99 kr/mån
                </div>
                <p className="text-sm text-muted-foreground">
                  Obegränsade CV:n + mer
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Obegränsade CV:n</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Prioriterat support</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Personlig karriärvägledning</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Premium CV-mallar</span>
                  </div>
                </div>
                
                <Button 
                  asChild
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  size="lg"
                >
                  <Link href="/priser">
                    <Crown className="h-4 w-4 mr-2" />
                    Uppgradera till Pro
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <Separator />

          <div className="text-center text-sm text-muted-foreground">
            <p>
              Behöver du hjälp med att välja? <Link href="/kontakt" className="text-primary hover:underline">Kontakta oss</Link>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 