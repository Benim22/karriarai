import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Calendar, User, ArrowRight, Search, TrendingUp, BookOpen, Target, Users } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

const blogPosts = [
  {
    id: 1,
    title: "10 tips för att skriva ett vinnande CV 2024",
    excerpt: "Lär dig de viktigaste strategierna för att få ditt CV att sticka ut från mängden och imponera på rekryterare.",
    category: "CV-tips",
    author: "Anna Andersson",
    date: "2024-01-15",
    readTime: "5 min läsning",
    image: "/placeholder.jpg",
    featured: true,
    tags: ["CV", "Jobbsökning", "Tips"]
  },
  {
    id: 2,
    title: "AI och framtidens arbetsmarknad",
    excerpt: "Hur artificiell intelligens förändrar rekryteringsprocessen och vad det betyder för jobbsökare.",
    category: "Trender",
    author: "Erik Eriksson",
    date: "2024-01-12",
    readTime: "7 min läsning",
    image: "/placeholder.jpg",
    featured: false,
    tags: ["AI", "Framtid", "Arbetsmarknad"]
  },
  {
    id: 3,
    title: "Så förbereder du dig för videointervjuer",
    excerpt: "Praktiska tips för att lyckas med videointervjuer och göra ett starkt intryck digitalt.",
    category: "Intervjutips",
    author: "Maria Johansson",
    date: "2024-01-10",
    readTime: "4 min läsning",
    image: "/placeholder.jpg",
    featured: false,
    tags: ["Intervju", "Digital", "Tips"]
  },
  {
    id: 4,
    title: "Nätverkande för introverta - en guide",
    excerpt: "Effektiva strategier för att bygga professionella nätverk även om du är introvert.",
    category: "Karriärutveckling",
    author: "Johan Svensson",
    date: "2024-01-08",
    readTime: "6 min läsning",
    image: "/placeholder.jpg",
    featured: false,
    tags: ["Nätverk", "Karriär", "Personlighet"]
  },
  {
    id: 5,
    title: "Löneförhandling - så får du det du förtjänar",
    excerpt: "Steg-för-steg guide till framgångsrik löneförhandling och hur du förbereder dig optimalt.",
    category: "Karriärutveckling",
    author: "Anna Andersson",
    date: "2024-01-05",
    readTime: "8 min läsning",
    image: "/placeholder.jpg",
    featured: false,
    tags: ["Lön", "Förhandling", "Karriär"]
  },
  {
    id: 6,
    title: "Branschanalys: IT-jobb i Sverige 2024",
    excerpt: "Djupgående analys av IT-arbetsmarknaden, mest efterfrågade kompetenser och lönetrender.",
    category: "Branschanalys",
    author: "Erik Eriksson",
    date: "2024-01-03",
    readTime: "10 min läsning",
    image: "/placeholder.jpg",
    featured: false,
    tags: ["IT", "Analys", "Löner"]
  }
]

const categories = ["Alla", "CV-tips", "Intervjutips", "Karriärutveckling", "Trender", "Branschanalys"]

const featuredPost = blogPosts.find(post => post.featured)
const regularPosts = blogPosts.filter(post => !post.featured)

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            KarriärAI Blogg
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Få de senaste tipsen och insikterna för att accelerera din karriär och lyckas på arbetsmarknaden
          </p>
          
          {/* Search */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Sök artiklar..." 
              className="pl-10"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 justify-center mb-12">
          {categories.map((category) => (
            <Button
              key={category}
              variant={category === "Alla" ? "default" : "outline"}
              size="sm"
              className="rounded-full"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Featured Post */}
        {featuredPost && (
          <div className="mb-16">
            <Badge className="mb-4">Utvalda artiklar</Badge>
            <Card className="overflow-hidden">
              <div className="md:flex">
                <div className="md:w-1/2">
                  <Image
                    src={featuredPost.image}
                    alt={featuredPost.title}
                    width={600}
                    height={400}
                    className="w-full h-64 md:h-full object-cover"
                  />
                </div>
                <div className="md:w-1/2 p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="secondary">{featuredPost.category}</Badge>
                    <span className="text-sm text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">{featuredPost.readTime}</span>
                  </div>
                  
                  <h2 className="text-2xl font-bold mb-4">
                    {featuredPost.title}
                  </h2>
                  
                  <p className="text-muted-foreground mb-6">
                    {featuredPost.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{featuredPost.author}</span>
                      <span className="text-sm text-muted-foreground">•</span>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {new Date(featuredPost.date).toLocaleDateString('sv-SE')}
                      </span>
                    </div>
                    
                    <Button asChild>
                      <Link href={`/blogg/${featuredPost.id}`}>
                        Läs mer
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Regular Posts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {regularPosts.map((post) => (
            <Card key={post.id} className="group hover:shadow-lg transition-all duration-300">
              <div className="relative overflow-hidden">
                <Image
                  src={post.image}
                  alt={post.title}
                  width={400}
                  height={250}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <Badge className="absolute top-4 left-4" variant="secondary">
                  {post.category}
                </Badge>
              </div>

              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(post.date).toLocaleDateString('sv-SE')}</span>
                  <span>•</span>
                  <span>{post.readTime}</span>
                </div>
                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                  {post.title}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {post.excerpt}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{post.author}</span>
                  </div>
                  
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/blogg/${post.id}`}>
                      Läs mer
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mb-16">
          <Button variant="outline" size="lg">
            Ladda fler artiklar
          </Button>
        </div>

        {/* Newsletter Signup */}
        <div className="bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-950/20 dark:to-emerald-950/20 rounded-2xl p-12 text-center">
          <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">
            Få våra bästa karriärtips direkt i inboxen
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Prenumerera på vårt nyhetsbrev och få veckovisa tips, branschinsikter och exklusivt innehåll 
            som hjälper dig att ta nästa steg i din karriär
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <Input 
              placeholder="Din e-postadress" 
              className="flex-1"
            />
            <Button>
              Prenumerera
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Ingen spam. Avregistrera dig när som helst.
          </p>
        </div>

        {/* Popular Topics */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-12">Populära ämnen</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 rounded-lg bg-muted/50">
              <Target className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">CV-optimering</h3>
              <p className="text-sm text-muted-foreground">
                Tips för att skapa CV som får dig till intervju
              </p>
            </div>
            <div className="text-center p-6 rounded-lg bg-muted/50">
              <Users className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Intervjuteknik</h3>
              <p className="text-sm text-muted-foreground">
                Strategier för att lyckas i alla typer av intervjuer
              </p>
            </div>
            <div className="text-center p-6 rounded-lg bg-muted/50">
              <TrendingUp className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Karriärutveckling</h3>
              <p className="text-sm text-muted-foreground">
                Långsiktiga strategier för karriärtillväxt
              </p>
            </div>
            <div className="text-center p-6 rounded-lg bg-muted/50">
              <BookOpen className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Branschguider</h3>
              <p className="text-sm text-muted-foreground">
                Djupgående analyser av olika branscher
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
} 