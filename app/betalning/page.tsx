"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, Zap, Crown, Building, Star, ArrowRight, CreditCard, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from 'next/navigation'
import { PRICING_PLANS, getSubscriptionPlans, getOneTimePurchases } from "@/lib/stripe"
import { 
  PaymentButton, 
  ProMonthlyButton, 
  ProLifetimeButton, 
  EnterpriseMonthlyButton,
  EnterpriseLifetimeButton,
  ExtraCVButton,
  SingleExportButton,
  PaymentUnavailableNotice 
} from "@/components/payment-button"
import { useToast } from '@/hooks/use-toast'

export default function BetalningPage() {
  const [userEmail, setUserEmail] = useState<string>('')
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Get plan from URL params
  useEffect(() => {
    const plan = searchParams.get('plan')
    const email = searchParams.get('email')
    
    if (plan) {
      setSelectedPlan(plan)
    }
    if (email) {
      setUserEmail(email)
    }
    setIsLoading(false)
  }, [searchParams])

  const subscriptionPlans = getSubscriptionPlans()
  const oneTimePurchases = getOneTimePurchases()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Laddar betalningsalternativ...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="py-12 px-4 border-b">
        <div className="container mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Slutför ditt köp
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            Välj den plan som passar dig bäst och kom igång direkt
          </p>
          
          {!userEmail && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 max-w-md mx-auto mb-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Du behöver logga in för att slutföra köpet
                </p>
              </div>
              <Button asChild className="mt-3 w-full" size="sm">
                <Link href="/auth/login">Logga in</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Payment Options */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <Tabs defaultValue={selectedPlan.includes('monthly') ? 'monthly' : selectedPlan.includes('lifetime') ? 'lifetime' : selectedPlan.includes('extra') || selectedPlan.includes('export') ? 'onetime' : 'monthly'} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
              <TabsTrigger value="monthly">Månadsvis</TabsTrigger>
              <TabsTrigger value="lifetime">Livstid</TabsTrigger>
              <TabsTrigger value="onetime">Engångsköp</TabsTrigger>
            </TabsList>

            {/* Monthly Plans */}
            <TabsContent value="monthly">
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {/* Pro Monthly */}
                <Card className={`relative ${selectedPlan === 'pro_monthly' ? 'border-primary shadow-lg' : ''}`}>
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                        <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <CardTitle>Pro Monthly</CardTitle>
                      {selectedPlan === 'pro_monthly' && (
                        <Badge variant="secondary">Vald</Badge>
                      )}
                    </div>
                    <div className="text-3xl font-bold">99 kr<span className="text-lg font-normal text-muted-foreground">/mån</span></div>
                    <CardDescription>För professionella användare</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {PRICING_PLANS.pro_monthly.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <ProMonthlyButton 
                      email={userEmail} 
                      className="w-full"
                      disabled={!userEmail}
                    />
                  </CardContent>
                </Card>

                {/* Enterprise Monthly */}
                <Card className={`relative ${selectedPlan === 'enterprise_monthly' ? 'border-primary shadow-lg' : ''}`}>
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                        <Building className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <CardTitle>Enterprise Monthly</CardTitle>
                      {selectedPlan === 'enterprise_monthly' && (
                        <Badge variant="secondary">Vald</Badge>
                      )}
                    </div>
                    <div className="text-3xl font-bold">299 kr<span className="text-lg font-normal text-muted-foreground">/mån</span></div>
                    <CardDescription>För team och organisationer</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {PRICING_PLANS.enterprise_monthly.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <EnterpriseMonthlyButton 
                      email={userEmail} 
                      className="w-full"
                      disabled={!userEmail}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Lifetime Plans */}
            <TabsContent value="lifetime">
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {/* Pro Lifetime */}
                <Card className={`relative ${selectedPlan === 'pro_lifetime' ? 'border-primary shadow-lg' : ''}`}>
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600">
                    BÄST VÄRDE
                  </Badge>
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                        <Crown className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <CardTitle>Pro Livstid</CardTitle>
                      {selectedPlan === 'pro_lifetime' && (
                        <Badge variant="secondary">Vald</Badge>
                      )}
                    </div>
                    <div className="text-3xl font-bold">1,990 kr<span className="text-lg font-normal text-muted-foreground"> engångsbetalning</span></div>
                    <CardDescription>Betala en gång, använd för alltid</CardDescription>
                    <div className="text-sm text-green-600 dark:text-green-400">
                      💰 Spara 1,000+ kr jämfört med månadsbetalning
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {PRICING_PLANS.pro_lifetime.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <ProLifetimeButton 
                      email={userEmail} 
                      className="w-full"
                      disabled={!userEmail}
                    />
                  </CardContent>
                </Card>

                {/* Enterprise Lifetime */}
                <Card className={`relative ${selectedPlan === 'enterprise_lifetime' ? 'border-primary shadow-lg' : ''}`}>
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                        <Building className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <CardTitle>Enterprise Livstid</CardTitle>
                      {selectedPlan === 'enterprise_lifetime' && (
                        <Badge variant="secondary">Vald</Badge>
                      )}
                    </div>
                    <div className="text-3xl font-bold">4,990 kr<span className="text-lg font-normal text-muted-foreground"> engångsbetalning</span></div>
                    <CardDescription>Fullständig lösning för organisationer</CardDescription>
                    <div className="text-sm text-green-600 dark:text-green-400">
                      💰 Spara 2,500+ kr jämfört med månadsbetalning
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {PRICING_PLANS.enterprise_lifetime.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <EnterpriseLifetimeButton 
                      email={userEmail} 
                      className="w-full"
                      disabled={!userEmail}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* One-time Purchases */}
            <TabsContent value="onetime">
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {/* Extra CV Credit */}
                <Card className={`relative ${selectedPlan === 'extra_cv' ? 'border-primary shadow-lg' : ''}`}>
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                        <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <CardTitle>Extra CV</CardTitle>
                      {selectedPlan === 'extra_cv' && (
                        <Badge variant="secondary">Vald</Badge>
                      )}
                    </div>
                    <div className="text-3xl font-bold">19 kr<span className="text-lg font-normal text-muted-foreground"> engångsbetalning</span></div>
                    <CardDescription>Skapa ett extra CV utöver din plan</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {PRICING_PLANS.extra_cv.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <ExtraCVButton 
                      email={userEmail} 
                      className="w-full"
                      disabled={!userEmail}
                    />
                  </CardContent>
                </Card>

                {/* Single Export */}
                <Card className={`relative ${selectedPlan === 'single_export' ? 'border-primary shadow-lg' : ''}`}>
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                        <ArrowRight className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <CardTitle>Engångsexport</CardTitle>
                      {selectedPlan === 'single_export' && (
                        <Badge variant="secondary">Vald</Badge>
                      )}
                    </div>
                    <div className="text-3xl font-bold">9 kr<span className="text-lg font-normal text-muted-foreground"> per export</span></div>
                    <CardDescription>Exportera ditt CV utan prenumeration</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {PRICING_PLANS.single_export.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <SingleExportButton 
                      email={userEmail} 
                      className="w-full"
                      disabled={!userEmail}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Security & Support */}
      <section className="py-12 px-4 bg-muted/50">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full mb-3">
                <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold mb-2">Säker betalning</h3>
              <p className="text-sm text-muted-foreground">
                Alla betalningar hanteras säkert av Stripe med 256-bit SSL-kryptering
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-3">
                <ArrowRight className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold mb-2">Omedelbar åtkomst</h3>
              <p className="text-sm text-muted-foreground">
                Få tillgång till alla funktioner direkt efter slutförd betalning
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full mb-3">
                <Star className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold mb-2">30 dagars garanti</h3>
              <p className="text-sm text-muted-foreground">
                Inte nöjd? Få pengarna tillbaka inom 30 dagar, inga frågor ställs
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 