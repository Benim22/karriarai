"use client"

import { Suspense } from "react"
import { WelcomeManager } from "@/components/welcome-manager"

function WelcomeManagerSuspense() {
  return (
    <Suspense fallback={null}>
      <WelcomeManager />
    </Suspense>
  )
}

export { WelcomeManagerSuspense as WelcomeWrapper } 