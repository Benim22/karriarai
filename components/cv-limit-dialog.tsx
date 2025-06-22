'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, CreditCard, Crown, FileText, Star } from "lucide-react"
import Link from "next/link"
import { useRouter } from 'next/navigation'

interface CVLimitDialogProps {
  isOpen: boolean
  onClose: () => void
  currentCVCount: number
  userEmail?: string
}

export function CVLimitDialog({ isOpen, onClose, currentCVCount, userEmail }: CVLimitDialogProps) {
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const router = useRouter()

  const handleOneTimePayment = async () => {
    setIsProcessingPayment(true)
    try {
      // Skapa Stripe checkout session för engångsbetalning
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'one-time-cv',
          email: userEmail,
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
      console.error('Error creating checkout session:', error)
      // Visa felmeddelande
      const event = new CustomEvent('show-toast', {
        detail: { message: 'Kunde inte starta betalning. Försök igen.', type: 'error' }
      })
      window.dispatchEvent(event)
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const handleUpgradePlan = () => {
    onClose()
    router.push('/priser')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            CV-gräns nådd
          </DialogTitle>
          <DialogDescription>
            Du har redan skapat {currentCVCount} CV med din gratis plan. Välj hur du vill fortsätta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Nuvarande status */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">Gratis plan</Badge>
              <span className="text-sm text-muted-foreground">
                {currentCVCount}/1 CV använt
              </span>
            </div>
            <p className="text-sm text-orange-800">
              För att skapa fler CV kan du antingen köpa ett extra CV för 19 kr eller uppgradera till en betald plan.
            </p>
          </div>

          {/* Alternativ */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Engångsbetalning */}
            <Card className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Extra CV</CardTitle>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Engångsköp
                  </Badge>
                </div>
                <CardDescription>
                  Köp ett extra CV för engångsanvändning
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">19 kr</div>
                  <div className="text-sm text-muted-foreground">En gång</div>
                </div>
                
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    1 extra CV
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Alla mallar tillgängliga
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    AI-förbättringar
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Obegränsade redigeringar
                  </li>
                </ul>

                <Button 
                  className="w-full" 
                  onClick={handleOneTimePayment}
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Bearbetar...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Köp för 19 kr
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Uppgradera plan */}
            <Card className="relative border-primary">
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  <Star className="mr-1 h-3 w-3" />
                  Rekommenderat
                </Badge>
              </div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Mini Plan</CardTitle>
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    <Crown className="mr-1 h-3 w-3" />
                    Uppgradera
                  </Badge>
                </div>
                <CardDescription>
                  Obegränsade CV och fler funktioner
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">49 kr</div>
                  <div className="text-sm text-muted-foreground">Per månad</div>
                </div>
                
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Obegränsade CV
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Alla premium-mallar
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Obegränsade AI-förbättringar
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    PDF-export
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Jobbmatchning
                  </li>
                </ul>

                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={handleUpgradePlan}
                >
                  <Crown className="mr-2 h-4 w-4" />
                  Se alla planer
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Jämförelse */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Vilket alternativ passar dig?</h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-blue-600">Välj engångsköp om:</p>
                <ul className="mt-1 space-y-1 text-muted-foreground">
                  <li>• Du bara behöver ett extra CV just nu</li>
                  <li>• Du vill testa funktionerna först</li>
                  <li>• Du söker jobb sporadiskt</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-primary">Välj Mini Plan om:</p>
                <ul className="mt-1 space-y-1 text-muted-foreground">
                  <li>• Du söker jobb aktivt</li>
                  <li>• Du vill ha flera CV för olika roller</li>
                  <li>• Du vill ha tillgång till alla funktioner</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={onClose} className="w-full sm:w-auto">
            Avbryt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 