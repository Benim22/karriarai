import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ConfigStatus } from "@/components/config-status"
import Link from "next/link"
import { FileText, Sparkles, Download, Users, Star, CheckCircle, ArrowRight, Zap, Shield, Clock, Eye } from "lucide-react"
import { 
  ClassicProfessionalPreview, 
  ModernMinimalistPreview, 
  CreativeDesignerPreview 
} from "@/components/cv-template-preview"
import { CVTemplatePreviewModal } from "@/components/cv-template-preview-modal"

export default function HomePage() {
  // Check if Supabase is configured
  const isConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <ConfigStatus />
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-blue-950/20 dark:via-background dark:to-emerald-950/20" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-driven CV-byggare
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6">
              Skapa professionella{" "}
              <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                CV med AI-stöd
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Bygg imponerande CV på minuter med våra AI-optimerade mallar. Få jobbförslag som matchar din profil och
              exportera i flera format.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="text-lg px-8">
                <Link href="/auth/register">
                  Kom igång gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg px-8">
                <Link href="/exempel-cv">Se exempel</Link>
              </Button>
            </div>
            <div className="mt-8 flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                Gratis att börja
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                Ingen kreditkort krävs
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                AI-optimerat
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Allt du behöver för att skapa det perfekta CV:t</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Från AI-optimerade mallar till jobbmatchning - vi har alla verktyg du behöver
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>AI-optimerade mallar</CardTitle>
                <CardDescription>
                  Välj mellan professionella mallar som är optimerade för ATS-system och rekryterare
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-emerald-600" />
                </div>
                <CardTitle>Dra & släpp-editor</CardTitle>
                <CardDescription>
                  Enkelt att använda med dra och släpp-funktionalitet för att anpassa ditt CV
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center mb-4">
                  <Download className="h-6 w-6 text-amber-600" />
                </div>
                <CardTitle>Flera exportformat</CardTitle>
                <CardDescription>Exportera ditt CV som PNG, JPG eller Word-dokument med hög kvalitet</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Jobbmatchning</CardTitle>
                <CardDescription>
                  Få jobbförslag från Arbetsförmedlingen som matchar din profil och erfarenhet
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-rose-600" />
                </div>
                <CardTitle>Snabb & enkel</CardTitle>
                <CardDescription>
                  Skapa ett professionellt CV på bara några minuter med våra smarta verktyg
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-teal-100 dark:bg-teal-900/20 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-teal-600" />
                </div>
                <CardTitle>Säker & privat</CardTitle>
                <CardDescription>Din data är säker hos oss med kryptering och GDPR-efterlevnad</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Templates Preview */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Professionella mallar för alla branscher</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Välj mellan traditionella, moderna och kreativa mallar som passar din bransch
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
              {
                name: "Klassisk Professionell",
                category: "Traditionell",
                PreviewComponent: ClassicProfessionalPreview,
                description: "Perfekt för traditionella branscher som finans, juridik och consulting",
              },
              {
                name: "Modern Minimalist",
                category: "Modern",
                PreviewComponent: ModernMinimalistPreview,
                description: "Ren design för tech, startup och kreativa roller",
              },
              {
                name: "Kreativ Designer",
                category: "Kreativ",
                PreviewComponent: CreativeDesignerPreview,
                description: "Uttrycksfull mall för designers, marknadsförare och konstnärer",
                isPremium: true,
              },
            ].map((template, index) => {
              // Skapa en mock CVTemplateWithStats för modalen
              const mockTemplate = {
                id: (index + 1).toString(),
                name: template.name,
                category: template.category.toLowerCase() as 'traditional' | 'modern' | 'creative',
                previewImage: '/placeholder.jpg',
                isPremium: template.isPremium || false,
                styles: {
                  fontFamily: "Inter",
                  fontSize: "14px",
                  primaryColor: "#1f2937",
                  secondaryColor: "#6b7280",
                  accentColor: "#3b82f6",
                  backgroundColor: "#ffffff",
                  headerStyle: "modern" as const,
                  sectionSpacing: "medium" as const
                },
                downloads: Math.floor(Math.random() * 3000) + 1000,
                rating: 4.5 + Math.random() * 0.5,
                tags: ["Professionell", "Modern"],
                industry: "Alla branscher"
              }
              
              return (
                <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow group">
                  <div className="aspect-[3/4] bg-gray-50 relative flex items-center justify-center">
                    <div className="w-48 h-60 scale-75 origin-center">
                      <template.PreviewComponent className="w-full h-full" />
                    </div>
                    {template.isPremium && (
                      <Badge className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-orange-500">
                        Premium
                      </Badge>
                    )}
                    
                    {/* Hover overlay med modal */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-2">
                      <CVTemplatePreviewModal template={mockTemplate}>
                        <Button size="sm" variant="secondary" className="cursor-pointer">
                          <Eye className="h-4 w-4 mr-2" />
                          Förhandsgranska
                        </Button>
                      </CVTemplatePreviewModal>
                      
                      <Button size="sm" asChild className="cursor-pointer">
                        <Link href="/exempel-cv">
                          Se alla mallar
                        </Link>
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{template.name}</h3>
                      <Badge variant="secondary">{template.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="text-center">
            <Button size="lg" variant="outline" asChild>
              <Link href="/exempel-cv">
                Se alla mallar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Tusentals användare litar på KarriärAI</h2>
            <div className="flex items-center justify-center gap-8 text-2xl font-bold">
              <div className="text-center">
                <div className="text-blue-600">10,000+</div>
                <div className="text-sm text-muted-foreground font-normal">CV skapade</div>
              </div>
              <div className="text-center">
                <div className="text-emerald-600">95%</div>
                <div className="text-sm text-muted-foreground font-normal">Nöjda användare</div>
              </div>
              <div className="text-center">
                <div className="text-amber-600">4.8/5</div>
                <div className="text-sm text-muted-foreground font-normal">Genomsnittligt betyg</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Anna Lindström",
                role: "Marknadsförare",
                content:
                  "KarriärAI hjälpte mig skapa ett professionellt CV på bara 15 minuter. Fick jobb inom en vecka!",
                rating: 5,
              },
              {
                name: "Erik Johansson",
                role: "Utvecklare",
                content: "Fantastiska mallar och så enkelt att använda. AI-funktionerna sparade mig massor av tid.",
                rating: 5,
              },
              {
                name: "Maria Andersson",
                role: "Projektledare",
                content: "Jobbmatchningen är genial! Fick flera relevanta förslag som matchade min profil perfekt.",
                rating: 5,
              },
            ].map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Redo att skapa ditt drömjobb-CV?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Gå med i tusentals jobbsökare som redan använder KarriärAI för att få sitt drömjobb
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="text-lg px-8">
                <Link href="/auth/register">
                  Skapa ditt CV nu
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg px-8">
                <Link href="/priser">Se priser</Link>
              </Button>
            </div>
            <div className="mt-6 flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Klart på 5 minuter
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                100% säkert
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
