import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Eye, Download, Star, Briefcase, GraduationCap, Code, Heart, Palette, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { getCVTemplates, filterTemplatesByIndustry, searchTemplates, CVTemplateWithStats } from "@/lib/cv-templates"
import { 
  ClassicProfessionalPreview, 
  ModernMinimalistPreview, 
  CreativeDesignerPreview, 
  TechExpertPreview,
  CVTemplatePreview 
} from "@/components/cv-template-preview"

const industries = ["Alla", "IT & Tech", "Design & Media", "Finans & Juridik", "Hälsa & Vård", "Utbildning & Forskning", "Startup & Entreprenörskap"]

// Hjälpfunktion för att få rätt ikon baserat på kategori
function getIconForTemplate(name: string, category: string) {
  if (name.toLowerCase().includes('tech') || name.toLowerCase().includes('teknisk')) return Code
  if (category === 'creative' || name.toLowerCase().includes('kreativ')) return Palette
  if (name.toLowerCase().includes('akademisk')) return GraduationCap
  if (name.toLowerCase().includes('vård')) return Heart
  if (name.toLowerCase().includes('startup')) return Star
  return Briefcase
}

// Hjälpfunktion för att få rätt förhandsvisningskomponent
function getPreviewComponent(name: string, styles: any) {
  if (name.includes('Klassisk Professionell')) return ClassicProfessionalPreview
  if (name.includes('Modern Minimalist')) return ModernMinimalistPreview
  if (name.includes('Kreativ Designer')) return CreativeDesignerPreview
  if (name.includes('Teknisk Expert')) return TechExpertPreview
  return ({ className }: { className?: string }) => (
    <CVTemplatePreview name={name} styles={styles} className={className} />
  )
}

import { CVTemplatesClient } from "@/components/cv-templates-client"

export default async function ExampleCVPage() {
  // Hämta mallar från databasen
  console.log('📄 ExampleCVPage: Fetching templates...')
  const templates = await getCVTemplates()
  console.log('📄 ExampleCVPage: Got templates:', templates.length)
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-16">
        <CVTemplatesClient templates={templates} industries={industries} />
      </main>

      <Footer />
    </div>
  )
} 