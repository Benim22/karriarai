"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { WelcomeDialog } from "@/components/welcome-dialog"
import { Sparkles } from "lucide-react"

export function TestWelcomeButton() {
  const [showWelcome, setShowWelcome] = useState(false)

  const handleTestWelcome = () => {
    // Rensa localStorage för att kunna visa välkomsten igen
    localStorage.removeItem('karriarai_welcome_shown')
    setShowWelcome(true)
  }

  return (
    <>
      <Button 
        variant="outline" 
        onClick={handleTestWelcome}
        className="gap-2"
      >
        <Sparkles className="h-4 w-4" />
        Testa Välkomstpopup
      </Button>
      
      <WelcomeDialog 
        open={showWelcome} 
        onOpenChange={setShowWelcome}
      />
    </>
  )
} 