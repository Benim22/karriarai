"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Mail, Phone, MapPin, Clock, MessageSquare, Users, Briefcase, HelpCircle, Sparkles, Loader2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const contactInfo = [
  {
    icon: Mail,
    title: "E-post",
    details: "hej@karriarai.se",
    description: "Vi svarar inom 24 timmar"
  },
  {
    icon: Phone,
    title: "Telefon",
    details: "+46 8 123 456 78",
    description: "Vardagar 09:00-17:00"
  },
  {
    icon: MapPin,
    title: "Adress",
    details: "Storgatan 1, 111 23 Stockholm",
    description: "Besök efter överenskommelse"
  },
  {
    icon: Clock,
    title: "Öppettider",
    details: "Måndag-Fredag 09:00-17:00",
    description: "Support dygnet runt"
  }
]

const contactReasons = [
  {
    icon: HelpCircle,
    title: "Allmän support",
    description: "Frågor om ditt konto eller teknisk support"
  },
  {
    icon: Briefcase,
    title: "Företagslösningar",
    description: "Intresserad av våra Enterprise-lösningar"
  },
  {
    icon: Users,
    title: "Partnerskap",
    description: "Vill du samarbeta med oss?"
  },
  {
    icon: MessageSquare,
    title: "Media & Press",
    description: "Pressförfrågningar och mediakontakt"
  }
]

export default function ContactPage() {
  const [message, setMessage] = useState("")
  const [aiImproving, setAiImproving] = useState(false)

  const improveMessageWithAI = async () => {
    setAiImproving(true)
    try {
      const response = await fetch('/api/ai/improve-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: message,
          type: 'message',
          context: {}
        }),
      })

      if (!response.ok) {
        throw new Error('AI improvement failed')
      }

      const data = await response.json()
      const improvedMessage = data.improvedText || message
      
      setMessage(improvedMessage)
    } catch (error) {
      console.error('AI improvement failed:', error)
      // Keep original message if AI fails
    } finally {
      setAiImproving(false)
    }
  }
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Kontakta oss
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Vi finns här för att hjälpa dig. Skicka ett meddelande så återkommer vi så snart som möjligt.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Skicka ett meddelande</CardTitle>
                <CardDescription>
                  Fyll i formuläret nedan så kontaktar vi dig inom 24 timmar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Förnamn</Label>
                    <Input id="firstName" placeholder="Ditt förnamn" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Efternamn</Label>
                    <Input id="lastName" placeholder="Ditt efternamn" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-postadress</Label>
                  <Input id="email" type="email" placeholder="din@email.se" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefonnummer (valfritt)</Label>
                  <Input id="phone" type="tel" placeholder="+46 70 123 45 67" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Ämne</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Välj ett ämne" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="support">Allmän support</SelectItem>
                      <SelectItem value="enterprise">Företagslösningar</SelectItem>
                      <SelectItem value="partnership">Partnerskap</SelectItem>
                      <SelectItem value="media">Media & Press</SelectItem>
                      <SelectItem value="other">Övrigt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Meddelande</Label>
                  <div className="relative">
                    <Textarea 
                      id="message" 
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Berätta hur vi kan hjälpa dig..."
                      className="min-h-[120px] pr-12"
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="absolute top-2 right-2 h-8 w-8 p-0"
                            onClick={improveMessageWithAI}
                            disabled={aiImproving}
                          >
                            {aiImproving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4 text-purple-600" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Förbättra meddelande med AI</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    💡 Klicka på <Sparkles className="h-4 w-4 inline text-purple-600" /> för att förbättra ditt meddelande
                  </p>
                </div>

                <Button className="w-full">
                  Skicka meddelande
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Kontaktinformation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {contactInfo.map((info, index) => {
                  const Icon = info.icon
                  return (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{info.title}</h3>
                        <p className="text-sm font-medium text-muted-foreground">{info.details}</p>
                        <p className="text-xs text-muted-foreground">{info.description}</p>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vad kan vi hjälpa till med?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contactReasons.map((reason, index) => {
                  const Icon = reason.icon
                  return (
                    <div key={index} className="flex items-start gap-3">
                      <Icon className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm">{reason.title}</h4>
                        <p className="text-xs text-muted-foreground">{reason.description}</p>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-12">Vanliga frågor</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Hur snabbt får jag svar?</h3>
                <p className="text-muted-foreground">
                  Vi strävar efter att svara på alla förfrågningar inom 24 timmar på vardagar. 
                  Akuta supportärenden hanteras oftast inom några timmar.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Kan jag boka ett möte?</h3>
                <p className="text-muted-foreground">
                  Ja! För Enterprise-kunder och komplexa frågor erbjuder vi möten via video eller telefon. 
                  Ange detta i ditt meddelande så bokar vi in en tid.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Vilka språk stöder ni?</h3>
                <p className="text-muted-foreground">
                  Vi erbjuder support på svenska och engelska. Våra AI-verktyg stöder även flera andra språk 
                  för internationella användare.
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Var finns ni?</h3>
                <p className="text-muted-foreground">
                  Vårt huvudkontor ligger i Stockholm, men vi arbetar med kunder över hela Sverige. 
                  Vi erbjuder även tjänster för nordiska och europeiska marknader.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Erbjuder ni telefonsupport?</h3>
                <p className="text-muted-foreground">
                  Ja, vi har telefonsupport för Pro- och Enterprise-kunder vardagar 09:00-17:00. 
                  Gratis användare kan kontakta oss via e-post eller chattfunktionen.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Kan jag få en demo?</h3>
                <p className="text-muted-foreground">
                  Absolut! Vi erbjuder personliga demonstrationer för företag och organisationer. 
                  Kontakta oss för att boka en skräddarsydd demo av våra lösningar.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-950/20 dark:to-emerald-950/20 rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-4">
            Behöver du hjälp direkt?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Kolla in vårt hjälpcenter för snabba svar på vanliga frågor, eller starta en chatt med vårt supportteam
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="outline">
              Besök hjälpcentret
            </Button>
            <Button size="lg">
              Starta livechatt
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
} 