import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Target, Users, Lightbulb, Award, Heart, Zap, Globe, Shield } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

const values = [
  {
    icon: Target,
    title: "Målinriktat",
    description: "Vi hjälper dig att nå dina karriärmål med precision och fokus"
  },
  {
    icon: Users,
    title: "Användarcentrerat",
    description: "Allt vi gör är designat med användaren i fokus för bästa möjliga upplevelse"
  },
  {
    icon: Lightbulb,
    title: "Innovation",
    description: "Vi använder den senaste AI-teknologin för att revolutionera jobbsökning"
  },
  {
    icon: Shield,
    title: "Integritet",
    description: "Din data är säker hos oss - vi respekterar din integritet fullt ut"
  }
]

const team = [
  {
    name: "Anna Andersson",
    role: "VD & Grundare",
    image: "/placeholder-user.jpg",
    description: "15 års erfarenhet inom HR och rekrytering. Tidigare på Spotify och King."
  },
  {
    name: "Erik Eriksson",
    role: "CTO",
    image: "/placeholder-user.jpg",
    description: "AI-expert med bakgrund från Google och KTH. Specialist på maskininlärning."
  },
  {
    name: "Maria Johansson",
    role: "Produktchef",
    image: "/placeholder-user.jpg",
    description: "UX-designer med passion för att skapa användarvänliga produkter."
  },
  {
    name: "Johan Svensson",
    role: "Säljchef",
    image: "/placeholder-user.jpg",
    description: "B2B-försäljningsexpert som hjälper företag att hitta rätt talanger."
  }
]

const stats = [
  { number: "50,000+", label: "Nöjda användare" },
  { number: "200,000+", label: "CV skapade" },
  { number: "85%", label: "Framgångsgrad" },
  { number: "24/7", label: "Support" }
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Vi revolutionerar hur människor hittar jobb
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            KarriärAI grundades 2023 med visionen att demokratisera tillgången till professionell karriärrådgivning. 
            Vi kombinerar artificiell intelligens med djup förståelse för den svenska arbetsmarknaden.
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                {stat.number}
              </div>
              <div className="text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Mission Section */}
        <div className="mb-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">Vår mission</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Vi tror att alla förtjänar tillgång till professionell karriärrådgivning och verktyg som hjälper dem att lyckas. 
              Genom att kombinera AI-teknologi med mänsklig expertis, gör vi det möjligt för alla att skapa imponerande CV:n 
              och hitta jobb som matchar deras kompetens och ambitioner.
            </p>
            <div className="bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-950/20 dark:to-emerald-950/20 rounded-2xl p-8">
              <p className="text-xl font-medium">
                "Att hjälpa människor att nå sin fulla potential på arbetsmarknaden är inte bara vårt uppdrag - det är vår passion."
              </p>
              <p className="text-muted-foreground mt-4">- Anna Andersson, VD & Grundare</p>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Våra värderingar</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <Card key={index} className="text-center">
                  <CardHeader>
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Möt vårt team</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="mx-auto mb-4">
                    <Image
                      src={member.image}
                      alt={member.name}
                      width={100}
                      height={100}
                      className="rounded-full"
                    />
                  </div>
                  <CardTitle className="text-lg">{member.name}</CardTitle>
                  <Badge variant="secondary">{member.role}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{member.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Technology Section */}
        <div className="mb-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">Vår teknologi</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Vi använder banbrytande AI-teknologi för att analysera jobbmarknaden, optimera CV:n och matcha kandidater 
              med rätt möjligheter. Vår plattform är byggd med säkerhet och integritet i fokus.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center p-6 rounded-lg bg-muted/50">
                <Zap className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold mb-2">AI-optimering</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Avancerade algoritmer som optimerar ditt CV för ATS-system
                </p>
              </div>
              <div className="flex flex-col items-center p-6 rounded-lg bg-muted/50">
                <Globe className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold mb-2">Marknadsanalys</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Realtidsanalys av den svenska arbetsmarknaden
                </p>
              </div>
              <div className="flex flex-col items-center p-6 rounded-lg bg-muted/50">
                <Shield className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold mb-2">Säker data</h3>
                <p className="text-sm text-muted-foreground text-center">
                  GDPR-kompatibel med högsta säkerhetsstandard
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-950/20 dark:to-emerald-950/20 rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-4">
            Redo att ta nästa steg i din karriär?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Gå med i tusentals andra som redan har transformerat sina karriärer med KarriärAI
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/auth/register">
                Kom igång idag
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/kontakt">
                Kontakta oss
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
} 