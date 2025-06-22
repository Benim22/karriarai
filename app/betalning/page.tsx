"use client"

import { useState, useEffect, Suspense } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, Zap, Crown, Building, Star, ArrowRight, CreditCard, AlertCircle, Sparkles } from "lucide-react"
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
import { useAuth } from '@/components/auth-provider'

function BetalningPageContent() {
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { user, profile, loading: authLoading } = useAuth()

  // Get user email from auth or URL params as fallback
  const userEmail = user?.email || searchParams.get('email') || ''

  // Get plan from URL params
  useEffect(() => {
    const plan = searchParams.get('plan')
    
    if (plan) {
      setSelectedPlan(plan)
    }
    
    // Wait for auth to load
    if (!authLoading) {
      setIsLoading(false)
    }
  }, [searchParams, authLoading])

  const subscriptionPlans = getSubscriptionPlans()
  const oneTimePurchases = getOneTimePurchases()

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laddar betalningsalternativ...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="py-16 px-4 border-b bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto text-center max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            Slutför ditt köp
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Välj den plan som passar dig bäst och kom igång direkt
          </p>
          
          {!user && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-5 max-w-md mx-auto mb-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Du behöver logga in för att slutföra köpet
                </p>
              </div>
              <Button asChild className="w-full" size="lg">
                <Link href="/auth/login">Logga in</Link>
              </Button>
            </div>
          )}
          
          {user && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-5 max-w-md mx-auto mb-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Inloggad som: <strong>{userEmail}</strong>
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Payment Options */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <Tabs 
            defaultValue={selectedPlan.includes('monthly') ? 'monthly' : selectedPlan.includes('lifetime') ? 'lifetime' : selectedPlan.includes('extra') || selectedPlan.includes('export') ? 'onetime' : 'monthly'} 
            className="w-full"
          >
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-12 p-1 bg-muted/80 backdrop-blur-sm">
              <TabsTrigger value="monthly">Månadsvis</TabsTrigger>
              <TabsTrigger value="lifetime">Livstid</TabsTrigger>
              <TabsTrigger value="onetime">Engångsköp</TabsTrigger>
            </TabsList>

            {/* Monthly Plans */}
            <TabsContent value="monthly" className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Pro Monthly */}
                <Card className={`relative overflow-hidden transition-all duration-200 ${selectedPlan === 'pro_monthly' ? 'border-primary shadow-lg scale-[1.02]' : 'hover:shadow-md hover:border-primary/50'}`}>
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <CardTitle>Pro Monthly</CardTitle>
                      {selectedPlan === 'pro_monthly' && (
                        <Badge variant="secondary" className="ml-auto">Vald</Badge>
                      )}
                    </div>
                    <div className="flex items-baseline mb-1">
                      <span className="text-3xl font-bold">99 kr</span>
                      <span className="text-lg font-normal text-muted-foreground ml-1">/mån</span>
                    </div>
                    <CardDescription>För professionella användare</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-2">
                    <div className="space-y-3">
                      {PRICING_PLANS.pro_monthly.features.map((feature) => (
                        <div key={feature} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <ProMonthlyButton 
                      email={userEmail} 
                      className="w-full mt-4"
                      disabled={!user}
                    />
                  </CardContent>
                </Card>

                {/* Enterprise Monthly */}
                <Card className={`relative overflow-hidden transition-all duration-200 ${selectedPlan === 'enterprise_monthly' ? 'border-primary shadow-lg scale-[1.02]' : 'hover:shadow-md hover:border-primary/50'}`}>
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-400 to-purple-600"></div>
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                        <Building className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <CardTitle>Enterprise Monthly</CardTitle>
                      {selectedPlan === 'enterprise_monthly' && (
                        <Badge variant="secondary" className="ml-auto">Vald</Badge>
                      )}
                    </div>
                    <div className="flex items-baseline mb-1">
                      <span className="text-3xl font-bold">299 kr</span>
                      <span className="text-lg font-normal text-muted-foreground ml-1">/mån</span>
                    </div>
                    <CardDescription>För team och organisationer</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-2">
                    <div className="space-y-3">
                      {PRICING_PLANS.enterprise_monthly.features.map((feature) => (
                        <div key={feature} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <EnterpriseMonthlyButton 
                      email={userEmail} 
                      className="w-full mt-4"
                      disabled={!user}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Lifetime Plans */}
            <TabsContent value="lifetime" className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Pro Lifetime */}
                <Card className={`relative overflow-hidden transition-all duration-200 ${selectedPlan === 'pro_lifetime' ? 'border-primary shadow-lg scale-[1.02]' : 'hover:shadow-md hover:border-primary/50'}`}>
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-400 to-purple-600"></div>
                  <Badge className="absolute -top-2 right-4 bg-gradient-to-r from-blue-600 to-purple-600 shadow-md">
                    BÄST VÄRDE
                  </Badge>
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2.5 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full">
                        <Crown className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <CardTitle>Pro Livstid</CardTitle>
                      {selectedPlan === 'pro_lifetime' && (
                        <Badge variant="secondary" className="ml-auto">Vald</Badge>
                      )}
                    </div>
                    <div className="flex items-baseline mb-1">
                      <span className="text-3xl font-bold">1,990 kr</span>
                      <span className="text-sm font-normal text-muted-foreground ml-2">engångsbetalning</span>
                    </div>
                    <CardDescription>Betala en gång, använd för alltid</CardDescription>
                    <div className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4" />
                      Spara 1,000+ kr jämfört med månadsbetalning
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-2">
                    <div className="space-y-3">
                      {PRICING_PLANS.pro_lifetime.features.map((feature) => (
                        <div key={feature} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <ProLifetimeButton 
                      email={userEmail} 
                      className="w-full mt-4"
                      disabled={!user}
                    />
                  </CardContent>
                </Card>

                {/* Enterprise Lifetime */}
                <Card className={`relative overflow-hidden transition-all duration-200 ${selectedPlan === 'enterprise_lifetime' ? 'border-primary shadow-lg scale-[1.02]' : 'hover:shadow-md hover:border-primary/50'}`}>
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-400 to-pink-600"></div>
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2.5 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full">
                        <Building className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <CardTitle>Enterprise Livstid</CardTitle>
                      {selectedPlan === 'enterprise_lifetime' && (
                        <Badge variant="secondary" className="ml-auto">Vald</Badge>
                      )}
                    </div>
                    <div className="flex items-baseline mb-1">
                      <span className="text-3xl font-bold">4,990 kr</span>
                      <span className="text-sm font-normal text-muted-foreground ml-2">engångsbetalning</span>
                    </div>
                    <CardDescription>Komplett företagslösning för alltid</CardDescription>
                    <div className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4" />
                      Spara 3,000+ kr jämfört med månadsbetalning
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-2">
                    <div className="space-y-3">
                      {PRICING_PLANS.enterprise_lifetime.features.map((feature) => (
                        <div key={feature} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <EnterpriseLifetimeButton 
                      email={userEmail} 
                      className="w-full mt-4"
                      disabled={!user}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* One-time Purchases */}
            <TabsContent value="onetime" className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Extra CV */}
                <Card className={`relative overflow-hidden transition-all duration-200 ${selectedPlan === 'extra_cv' ? 'border-primary shadow-lg scale-[1.02]' : 'hover:shadow-md hover:border-primary/50'}`}>
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-green-400 to-green-600"></div>
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2.5 bg-green-100 dark:bg-green-900/30 rounded-full">
                        <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <CardTitle>Extra CV</CardTitle>
                      {selectedPlan === 'extra_cv' && (
                        <Badge variant="secondary" className="ml-auto">Vald</Badge>
                      )}
                    </div>
                    <div className="flex items-baseline mb-1">
                      <span className="text-3xl font-bold">19 kr</span>
                      <span className="text-sm font-normal text-muted-foreground ml-2">engångskostnad</span>
                    </div>
                    <CardDescription>Skapa ett extra CV utöver din gratiskvot</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-2">
                    <div className="space-y-3">
                      {PRICING_PLANS.extra_cv.features.map((feature) => (
                        <div key={feature} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <ExtraCVButton 
                      email={userEmail} 
                      className="w-full mt-4"
                      disabled={!user}
                    />
                  </CardContent>
                </Card>

                {/* Single Export */}
                <Card className={`relative overflow-hidden transition-all duration-200 ${selectedPlan === 'single_export' ? 'border-primary shadow-lg scale-[1.02]' : 'hover:shadow-md hover:border-primary/50'}`}>
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-400 to-orange-600"></div>
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2.5 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                        <ArrowRight className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <CardTitle>Enskild Export</CardTitle>
                      {selectedPlan === 'single_export' && (
                        <Badge variant="secondary" className="ml-auto">Vald</Badge>
                      )}
                    </div>
                    <div className="flex items-baseline mb-1">
                      <span className="text-3xl font-bold">9 kr</span>
                      <span className="text-sm font-normal text-muted-foreground ml-2">per export</span>
                    </div>
                    <CardDescription>Exportera ditt CV som PDF</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-2">
                    <div className="space-y-3">
                      {PRICING_PLANS.single_export.features.map((feature) => (
                        <div key={feature} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <SingleExportButton 
                      email={userEmail} 
                      className="w-full mt-4"
                      disabled={!user}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Payment Unavailable Notice */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <PaymentUnavailableNotice />
        </div>
      </section>

      {/* FAQ or Support Section */}
      <section className="py-12 px-4 bg-muted/30 border-t">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-semibold mb-4">Har du frågor?</h2>
          <p className="text-muted-foreground mb-6">
            Kontakta oss om du har frågor om våra betalningsalternativ eller behöver hjälp med ditt köp.
          </p>
          <Button variant="outline" asChild>
            <Link href="/kontakt">Kontakta support</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

export default function BetalningPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laddar betalningsalternativ...</p>
        </div>
      </div>
    }>
      <BetalningPageContent />
    </Suspense>
  )
} 