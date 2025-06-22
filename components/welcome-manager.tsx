"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { WelcomeDialog } from "@/components/welcome-dialog"
import { useAuth } from "@/components/auth-provider"

export function WelcomeManager() {
  const [showWelcome, setShowWelcome] = useState(false)
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Kontrollera om användaren kommer från email-bekräftelse
    const checkForWelcome = () => {
      // Kolla URL-parametrar för email-bekräftelse
      const type = searchParams.get('type')
      const accessToken = searchParams.get('access_token')
      const refreshToken = searchParams.get('refresh_token')
      const tokenHash = searchParams.get('token_hash')
      
      // Kolla localStorage för tidigare välkomstvisning
      const hasSeenWelcome = localStorage.getItem('karriarai_welcome_shown')
      
      console.log('Welcome check:', { 
        user: !!user, 
        profile: !!profile, 
        loading, 
        hasSeenWelcome, 
        type, 
        accessToken: !!accessToken,
        refreshToken: !!refreshToken,
        tokenHash: !!tokenHash,
        onboardingCompleted: profile?.onboarding_completed
      })
      
      // Visa välkomsthälsning om:
      // 1. Användaren är inloggad och har profil
      // 2. Användaren inte har sett välkomsthälsningen innan
      // 3. Antingen kommer från email-bekräftelse ELLER är ny användare
      if (user && profile && !loading && !hasSeenWelcome) {
        
        // Scenario 1: Kommer från email-bekräftelse
        const fromEmailConfirmation = (
          type === 'signup' || 
          type === 'recovery' || 
          type === 'email_change' ||
          (accessToken && refreshToken) ||
          tokenHash
        )
        
        // Scenario 2: Ny användare (onboarding inte slutförd)
        const isNewUser = profile.onboarding_completed === false
        
        // Scenario 3: Nyligen skapat konto (mindre än 10 minuter)
        const accountAge = Date.now() - new Date(user.created_at).getTime()
        const tenMinutes = 10 * 60 * 1000
        const recentlyCreated = accountAge < tenMinutes
        
        if (fromEmailConfirmation || (isNewUser && recentlyCreated)) {
          console.log('Showing welcome dialog:', { fromEmailConfirmation, isNewUser, recentlyCreated })
          
          // Vänta lite för att låta sidan ladda klart
          setTimeout(() => {
            setShowWelcome(true)
            // Markera att välkomsthälsningen har visats
            localStorage.setItem('karriarai_welcome_shown', 'true')
            
            // Rensa URL-parametrar om de finns
            if (fromEmailConfirmation) {
              const url = new URL(window.location.href)
              url.searchParams.delete('type')
              url.searchParams.delete('access_token')
              url.searchParams.delete('refresh_token')
              url.searchParams.delete('token_hash')
              url.searchParams.delete('error')
              url.searchParams.delete('error_code')
              url.searchParams.delete('error_description')
              router.replace(url.pathname, { scroll: false })
            }
          }, 1000)
        }
      }
    }

    checkForWelcome()
  }, [user, profile, loading, searchParams, router])

  const handleWelcomeClose = async () => {
    setShowWelcome(false)
    
    // Markera onboarding som slutförd
    if (profile && !profile.onboarding_completed) {
      try {
        const { supabase } = await import("@/lib/supabase")
        await supabase
          .from('karriar_profiles')
          .update({ onboarding_completed: true })
          .eq('id', user?.id)
      } catch (error) {
        console.error('Error updating onboarding status:', error)
      }
    }
  }

  // Visa bara om användaren är inloggad och har en profil
  if (!user || !profile || loading) {
    return null
  }

  return (
    <WelcomeDialog 
      open={showWelcome} 
      onOpenChange={handleWelcomeClose}
    />
  )
} 