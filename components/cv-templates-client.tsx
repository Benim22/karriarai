'use client'

import { useState, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Eye, Download, Star, Briefcase, GraduationCap, Code, Heart, Palette, Search } from "lucide-react"
import Link from "next/link"
import { CVTemplateWithStats, filterTemplatesByIndustry, searchTemplates } from "@/lib/cv-templates"
import { 
  ClassicProfessionalPreview, 
  ModernMinimalistPreview, 
  CreativeDesignerPreview, 
  TechExpertPreview,
  CVTemplatePreview 
} from "@/components/cv-template-preview"
import { CVTemplatePreviewModal } from "@/components/cv-template-preview-modal"
import { useRouter } from 'next/navigation'

interface CVTemplatesClientProps {
  templates: CVTemplateWithStats[]
  industries: string[]
}

// Hjälpfunktion för att få rätt ikon baserat på kategori
function getIconForTemplate(name: string, category: string) {
  if (name.toLowerCase().includes('tech') || name.toLowerCase().includes('teknisk')) return Code
  if (category === 'creative' || name.toLowerCase().includes('kreativ')) return Palette
  if (name.toLowerCase().includes('akademisk')) return GraduationCap
  if (name.toLowerCase().includes('vård')) return Heart
  if (name.toLowerCase().includes('startup')) return Star
  if (name.toLowerCase().includes('executive') || name.toLowerCase().includes('premium')) return Briefcase
  return Briefcase
}

// Hjälpfunktion för att få rätt förhandsvisningskomponent
function getPreviewComponent(name: string, styles: any) {
  if (name.includes('Klassisk Professionell')) return ClassicProfessionalPreview
  if (name.includes('Modern Minimalist')) return ModernMinimalistPreview
  if (name.includes('Kreativ Designer')) return CreativeDesignerPreview
  if (name.includes('Teknisk Expert')) return TechExpertPreview
  // Använd den generiska komponenten för alla mallar, inklusive de nya
  return ({ className }: { className?: string }) => (
    <CVTemplatePreview styles={styles} className={className} />
  )
}

export function CVTemplatesClient({ templates, industries }: CVTemplatesClientProps) {
  console.log('🎨 CVTemplatesClient received templates:', templates.length)
  
  const [selectedIndustry, setSelectedIndustry] = useState('Alla')
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  // Filtrera och sök mallar
  const filteredTemplates = useMemo(() => {
    let result = filterTemplatesByIndustry(templates, selectedIndustry)
    result = searchTemplates(result, searchQuery)
    return result
  }, [templates, selectedIndustry, searchQuery])

  const handleUseTemplate = (templateId: string) => {
    // Navigera till CV-builder med vald mall
    router.push(`/cv-builder?template=${templateId}`)
  }

  return (
    <>
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          CV-exempel och mallar
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Få inspiration från våra professionellt designade CV-mallar som hjälper dig att sticka ut från mängden
        </p>
      </div>

      {/* Sökfält */}
      <div className="max-w-md mx-auto mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Sök efter mallar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 justify-center mb-12">
        {industries.map((industry) => (
          <Button
            key={industry}
            variant={industry === selectedIndustry ? "default" : "outline"}
            size="sm"
            className="rounded-full cursor-pointer"
            onClick={() => setSelectedIndustry(industry)}
          >
            {industry}
          </Button>
        ))}
      </div>

      {/* Resultat antal */}
      <div className="text-center mb-8">
        <p className="text-muted-foreground">
          Visar {filteredTemplates.length} av {templates.length} mallar
        </p>
      </div>

      {/* CV Templates Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {filteredTemplates.map((template) => {
          const Icon = getIconForTemplate(template.name, template.category)
          const PreviewComponent = getPreviewComponent(template.name, template.styles)
          
          return (
            <Card key={template.id} className="group hover:shadow-lg transition-all duration-300">
              <div className="relative overflow-hidden rounded-t-lg">
                {/* CV Preview */}
                <div className="w-full h-64 bg-gray-50 flex items-center justify-center">
                  <div className="w-48 h-60 scale-75 origin-center">
                    <PreviewComponent className="w-full h-full" />
                  </div>
                </div>
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-2">
                  <CVTemplatePreviewModal 
                    template={template} 
                    allTemplates={filteredTemplates}
                  >
                    <Button 
                      size="sm" 
                      variant="secondary"
                      className="cursor-pointer"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Förhandsgranska
                    </Button>
                  </CVTemplatePreviewModal>
                  
                  <Button 
                    size="sm"
                    onClick={() => handleUseTemplate(template.id)}
                    className="cursor-pointer"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Använd mall
                  </Button>
                </div>

                {/* Premium Badge */}
                {template.isPremium && (
                  <Badge className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-orange-500">
                    Premium
                  </Badge>
                )}
              </div>

              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{template.rating?.toFixed(1)}</span>
                  </div>
                </div>
                <CardDescription>
                  {getDescriptionForTemplate(template.name, template.category)}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1 mb-3">
                  {template.tags?.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{template.industry}</span>
                  <span>{template.downloads?.toLocaleString()} nedladdningar</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Inga resultat */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-16">
          <div className="text-muted-foreground mb-4">
            <Search className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">Inga mallar hittades</h3>
            <p>Prova att ändra din sökning eller välj en annan bransch</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => {
              setSearchQuery('')
              setSelectedIndustry('Alla')
            }}
          >
            Rensa filter
          </Button>
        </div>
      )}

      {/* CTA Section */}
      <div className="text-center bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-950/20 dark:to-emerald-950/20 rounded-2xl p-12">
        <h2 className="text-3xl font-bold mb-4">
          Redo att skapa ditt perfekta CV?
        </h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Välj från våra professionella mallar och låt vår AI hjälpa dig att optimera ditt CV för den position du söker
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild className="cursor-pointer">
            <Link href="/auth/register">
              Kom igång gratis
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="cursor-pointer">
            <Link href="/priser">
              Se alla funktioner
            </Link>
          </Button>
        </div>
      </div>
    </>
  )
}

// Hjälpfunktion för beskrivningar
function getDescriptionForTemplate(name: string, category: string): string {
  const descriptions = {
    'Klassisk Professionell': 'Tidlös design perfekt för traditionella branscher',
    'Modern Minimalist': 'Ren och minimalistisk design för moderna yrken',
    'Kreativ Designer': 'Färgglad och kreativ design för kreativa yrken',
    'Teknisk Expert': 'Professionell design optimerad för tech-branschen',
    'Executive Premium': 'Elegant design för ledande positioner',
    'Startup Innovatör': 'Modern design för entreprenörer och innovatörer'
  }
  
  return descriptions[name as keyof typeof descriptions] || 
         `Professionell ${category} design för din karriär`
} 