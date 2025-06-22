"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  MessageCircle,
  Star,
  Zap,
  Crown,
  HelpCircle,
  Briefcase,
  Users,
  MessageSquare
} from "lucide-react"
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
            Vi hjälper dig gärna med dina frågor om KarriarAI
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Support Tiers */}
          <div className="lg:col-span-1 space-y-6">
            <h2 className="text-2xl font-bold mb-6">Support-nivåer</h2>
            
            {/* Free Support */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Grundsupport
                </CardTitle>
                <CardDescription>För gratisanvändare</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Svarstid: 48-72 timmar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">E-postsupport</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">FAQ och hjälpcenter</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pro Support */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  Prioritetssupport
                  <Badge className="bg-blue-600">Pro</Badge>
                </CardTitle>
                <CardDescription>För Pro-användare</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Svarstid: 4-8 timmar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Prioriterad e-postsupport</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Livechatt vardagar 9-17</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Telefonsupport vid akuta ärenden</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enterprise Support */}
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-purple-600" />
                  Dedikerad support
                  <Badge className="bg-purple-600">Enterprise</Badge>
                </CardTitle>
                <CardDescription>För Enterprise-kunder</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Svarstid: 1-2 timmar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-purple-600" />
                    <span className="text-sm">Dedikerad kontoansvarig</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-purple-600" />
                    <span className="text-sm">24/7 telefonsupport</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-purple-600" />
                    <span className="text-sm">SLA-garanti 99.9%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Kontaktinformation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">E-post</p>
                    <p className="text-sm text-muted-foreground">support@karriarai.se</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Telefon</p>
                    <p className="text-sm text-muted-foreground">08-123 456 78</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Adress</p>
                    <p className="text-sm text-muted-foreground">
                      Storgatan 123<br />
                      111 22 Stockholm
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Skicka ett meddelande</CardTitle>
                <CardDescription>
                  Fyll i formuläret så återkommer vi till dig så snart som möjligt
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Namn</Label>
                      <Input id="name" placeholder="Ditt namn" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-post</Label>
                      <Input id="email" type="email" placeholder="din@email.se" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subject">Ämne</Label>
                    <Input id="subject" placeholder="Vad gäller ditt meddelande?" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioritet</Label>
                    <select className="w-full p-2 border border-input rounded-md">
                      <option value="low">Låg - Allmän fråga</option>
                      <option value="normal">Normal - Support</option>
                      <option value="high">Hög - Akut problem (Pro/Enterprise)</option>
                      <option value="urgent">Brådskande - Kritiskt (Enterprise)</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Meddelande</Label>
                    <Textarea 
                      id="message" 
                      placeholder="Beskriv ditt ärende så detaljerat som möjligt..."
                      rows={6}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full">
                    Skicka meddelande
                  </Button>
                </form>
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