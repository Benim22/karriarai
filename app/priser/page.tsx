import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Check, Star, Zap, Crown } from "lucide-react"
import Link from "next/link"

const plans = [
  {
    name: "Gratis",
    price: "0",
    description: "Perfekt för att komma igång",
    features: [
      "1 CV-mall",
      "Grundläggande redigering",
      "PDF-export",
      "Grundläggande jobbmatchning",
      "E-postsupport"
    ],
    icon: Star,
    popular: false,
    cta: "Kom igång gratis"
  },
  {
    name: "Pro",
    price: "99",
    description: "För seriösa jobbsökare",
    features: [
      "Obegränsat antal CV",
      "15+ professionella mallar",
      "AI-optimering av innehåll",
      "Avancerad jobbmatchning",
      "Personlig karriärrådgivning",
      "Prioritetssupport",
      "Exportera till Word & PDF"
    ],
    icon: Zap,
    popular: true,
    cta: "Starta Pro-utvärdering"
  },
  {
    name: "Enterprise",
    price: "299",
    description: "För företag och rekryterare",
    features: [
      "Allt i Pro",
      "Teamhantering",
      "Bulk CV-analys",
      "Anpassade mallar",
      "API-åtkomst",
      "Dedikerad kontoansvarig",
      "SLA-garanti",
      "Anpassad integration"
    ],
    icon: Crown,
    popular: false,
    cta: "Kontakta försäljning"
  }
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Välj rätt plan för dig
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Få tillgång till kraftfulla AI-verktyg för att skapa det perfekta CV:t och hitta ditt drömjobb
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon
            return (
              <Card key={plan.name} className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                    Mest populär
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-base">{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price} kr</span>
                    <span className="text-muted-foreground">/månad</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className="w-full mt-6" 
                    variant={plan.popular ? "default" : "outline"}
                    asChild
                  >
                    <Link href={plan.name === "Enterprise" ? "/kontakt" : "/auth/register"}>
                      {plan.cta}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Vanliga frågor</h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-2">Kan jag avbryta när som helst?</h3>
              <p className="text-muted-foreground">
                Ja, du kan avbryta din prenumeration när som helst utan bindningstid. Din åtkomst fortsätter till slutet av den betalda perioden.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Finns det en gratis provperiod?</h3>
              <p className="text-muted-foreground">
                Pro-planen kommer med 14 dagars gratis provperiod. Du kan avbryta innan provperioden slutar utan kostnad.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Vad händer med mina CV när jag avbryter?</h3>
              <p className="text-muted-foreground">
                Dina CV sparas säkert i 90 dagar efter avbrytandet. Du kan exportera dem eller återaktivera ditt konto under denna period.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
} 