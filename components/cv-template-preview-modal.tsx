'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Download, X, ArrowLeft, ArrowRight } from "lucide-react"
import { CVTemplateWithStats } from "@/lib/cv-templates"
import { CVTemplatePreview } from "@/components/cv-template-preview"
import { useRouter } from 'next/navigation'

interface CVTemplatePreviewModalProps {
  template: CVTemplateWithStats
  children: React.ReactNode
  allTemplates?: CVTemplateWithStats[]
}

export function CVTemplatePreviewModal({ 
  template, 
  children, 
  allTemplates = [] 
}: CVTemplatePreviewModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentTemplateIndex, setCurrentTemplateIndex] = useState(0)
  const router = useRouter()

  // Hitta nuvarande mall i listan
  const currentTemplate = allTemplates.length > 0 
    ? allTemplates[currentTemplateIndex] 
    : template

  const handleUseTemplate = () => {
    setIsOpen(false)
    router.push(`/cv-builder?template=${currentTemplate.id}`)
  }

  const handlePrevious = () => {
    if (allTemplates.length > 0) {
      setCurrentTemplateIndex((prev) => 
        prev === 0 ? allTemplates.length - 1 : prev - 1
      )
    }
  }

  const handleNext = () => {
    if (allTemplates.length > 0) {
      setCurrentTemplateIndex((prev) => 
        prev === allTemplates.length - 1 ? 0 : prev + 1
      )
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open && allTemplates.length > 0) {
      // Sätt rätt index när modalen öppnas
      const index = allTemplates.findIndex(t => t.id === template.id)
      if (index !== -1) {
        setCurrentTemplateIndex(index)
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      
      <DialogContent className="max-w-6xl w-full h-[90vh] p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-white">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">
                {currentTemplate.name}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="capitalize">
                  {currentTemplate.category}
                </Badge>
                {currentTemplate.isPremium && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500">
                    Premium
                  </Badge>
                )}
                <span className="text-sm text-muted-foreground">
                  {currentTemplate.industry}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Navigation arrows om det finns flera mallar */}
              {allTemplates.length > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    className="cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {currentTemplateIndex + 1} av {allTemplates.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNext}
                    className="cursor-pointer"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              <Button
                onClick={handleUseTemplate}
                className="cursor-pointer"
              >
                <Download className="h-4 w-4 mr-2" />
                Använd mall
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex">
            {/* CV Preview */}
            <div className="flex-1 bg-gray-50 flex items-center justify-center p-8 overflow-auto">
              <div 
                className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full"
                style={{ aspectRatio: '210/297' }}
              >
                <CVTemplatePreview 
                  name={currentTemplate.name} 
                  styles={currentTemplate.styles} 
                  className="w-full h-full transform scale-125 origin-top"
                />
              </div>
            </div>

            {/* Sidebar med information */}
            <div className="w-80 bg-white border-l p-6 overflow-auto">
              <h3 className="font-semibold mb-4">Mall-information</h3>
              
              <div className="space-y-4">
                {/* Grundläggande info */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Grundläggande
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt>Namn:</dt>
                      <dd className="font-medium">{currentTemplate.name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Kategori:</dt>
                      <dd className="font-medium capitalize">{currentTemplate.category}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Bransch:</dt>
                      <dd className="font-medium">{currentTemplate.industry}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Typ:</dt>
                      <dd className="font-medium">
                        {currentTemplate.isPremium ? 'Premium' : 'Gratis'}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Design-egenskaper */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Design
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt>Typsnitt:</dt>
                      <dd className="font-medium">{currentTemplate.styles.fontFamily}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Header-stil:</dt>
                      <dd className="font-medium capitalize">{currentTemplate.styles.headerStyle}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Avstånd:</dt>
                      <dd className="font-medium capitalize">{currentTemplate.styles.sectionSpacing}</dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt>Accentfärg:</dt>
                      <dd className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: currentTemplate.styles.accentColor }}
                        />
                        <span className="font-medium text-xs">
                          {currentTemplate.styles.accentColor}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Statistik */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Popularitet
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt>Betyg:</dt>
                      <dd className="font-medium">
                        {currentTemplate.rating?.toFixed(1)} ⭐
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Nedladdningar:</dt>
                      <dd className="font-medium">
                        {currentTemplate.downloads?.toLocaleString()}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Tags */}
                {currentTemplate.tags && currentTemplate.tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      Egenskaper
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {currentTemplate.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Call to action */}
                <div className="pt-4 border-t">
                  <Button 
                    onClick={handleUseTemplate}
                    className="w-full cursor-pointer"
                    size="lg"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Skapa CV med denna mall
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 