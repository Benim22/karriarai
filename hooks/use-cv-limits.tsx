'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'

interface CVLimits {
  cvs: number
  exports: number
}

interface UseCVLimitsReturn {
  canCreateCV: boolean
  currentCVCount: number
  limits: CVLimits
  showLimitDialog: boolean
  setShowLimitDialog: (show: boolean) => void
  checkCVLimit: (currentCount: number) => boolean
  handleCreateCV: (templateId?: string) => void
}

export function useCVLimits(userProfile?: any, currentCVs: any[] = []): UseCVLimitsReturn {
  const [showLimitDialog, setShowLimitDialog] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  const getSubscriptionLimits = useCallback((): CVLimits => {
    switch (userProfile?.subscription_tier) {
      case "free":
        return { cvs: 1, exports: 0 }
      case "mini":
        return { cvs: -1, exports: -1 }
      case "pro":
        return { cvs: -1, exports: -1 }
      case "premium":
        return { cvs: -1, exports: -1 }
      default:
        return { cvs: 1, exports: 0 }
    }
  }, [userProfile?.subscription_tier])

  const limits = getSubscriptionLimits()
  const currentCVCount = currentCVs.length
  const extraCredits = userProfile?.extra_cv_credits || 0
  
  // Beräkna om användaren kan skapa CV (inklusive extra credits)
  const canCreateCV = limits.cvs === -1 || currentCVCount < (limits.cvs + extraCredits)

  const checkCVLimit = useCallback((currentCount: number): boolean => {
    const totalAllowed = limits.cvs === -1 ? -1 : limits.cvs + extraCredits
    const hasReachedLimit = totalAllowed !== -1 && currentCount >= totalAllowed
    if (hasReachedLimit) {
      setShowLimitDialog(true)
      return false
    }
    return true
  }, [limits.cvs, extraCredits])

  const handleCreateCV = useCallback((templateId?: string) => {
    if (!user) {
      router.push('/auth/login?redirectTo=/cv-builder')
      return
    }

    // Kontrollera begränsning
    if (!checkCVLimit(currentCVCount)) {
      return // Dialogen visas automatiskt
    }

    // Navigera till CV-builder
    const url = templateId ? `/cv-builder?template=${templateId}` : '/cv-builder'
    router.push(url)
  }, [user, router, checkCVLimit, currentCVCount])

  return {
    canCreateCV,
    currentCVCount,
    limits,
    showLimitDialog,
    setShowLimitDialog,
    checkCVLimit,
    handleCreateCV
  }
} 