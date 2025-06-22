"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Sparkles, 
  FileText, 
  Zap, 
  Users, 
  ArrowRight, 
  CheckCircle,
  Gift
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"

interface WelcomeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WelcomeDialog({ open, onOpenChange }: WelcomeDialogProps) {
  const { profile } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)

  const welcomeSteps = [
    {
      title: "Välkommen till KarriärAI! 🎉",
      subtitle: `Hej ${profile?.full_name || 'där'}! Vi är så glada att du har gått med oss.`,
      content: (
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full flex items-center justify-center mb-4">
            <Image 
              src="/logo.png" 
              alt="KarriärAI Logo" 
              width={50} 
              height={50}
              className="h-12 w-auto"
            />
          </div>
          <p className="text-muted-foreground">
            Du har nu tillgång till AI-driven CV-byggare och karriärverktyg som hjälper dig att hitta ditt drömjobb.
          </p>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-2 justify-center">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="text-green-800 dark:text-green-200 font-medium">
                Ditt konto är nu aktiverat!
              </span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Vad kan du göra nu?",
      subtitle: "Här är några saker du kan börja med direkt:",
      content: (
        <div className="space-y-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold">Skapa ditt första CV</h4>
                  <p className="text-sm text-muted-foreground">
                    Använd vår AI-drivna CV-byggare för att skapa ett professionellt CV på minuter.
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    <Gift className="h-3 w-3 mr-1" />
                    1 gratis CV inkluderat
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                  <Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-semibold">Utforska AI-funktioner</h4>
                  <p className="text-sm text-muted-foreground">
                    Få AI-hjälp med att förbättra din text och optimera ditt CV för ATS-system.
                  </p>
                  <Badge variant="outline" className="mt-2">
                    Uppgradera för full tillgång
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="font-semibold">Hitta jobb</h4>
                  <p className="text-sm text-muted-foreground">
                    Bläddra igenom tusentals jobbannonser och få matchningar baserat på ditt CV.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }
  ]

  const handleNext = () => {
    if (currentStep < welcomeSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onOpenChange(false)
    }
  }

  const handleSkip = () => {
    onOpenChange(false)
  }

  const handleGetStarted = () => {
    onOpenChange(false)
    // Redirect to CV builder
    window.location.href = '/dashboard'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            {welcomeSteps[currentStep].title}
          </DialogTitle>
          <p className="text-muted-foreground">
            {welcomeSteps[currentStep].subtitle}
          </p>
        </DialogHeader>

        <div className="py-6">
          {welcomeSteps[currentStep].content}
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-4">
          {welcomeSteps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentStep ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex justify-between">
          <Button variant="ghost" onClick={handleSkip}>
            Hoppa över
          </Button>
          
          <div className="flex gap-2">
            {currentStep === welcomeSteps.length - 1 ? (
              <Button onClick={handleGetStarted} className="gap-2">
                Kom igång
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleNext} className="gap-2">
                Nästa
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 