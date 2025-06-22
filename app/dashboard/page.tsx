"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Navbar } from "@/components/navbar"
import { DashboardContent } from "@/components/dashboard-content"
import { Loader2 } from "lucide-react"

// Mock data for development when Supabase is not configured
const mockCVs = [
  {
    id: "1",
    title: "Mitt första CV",
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
]

const mockExports: any[] = []

export default function DashboardPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [cvs, setCvs] = useState(mockCVs)
  const [exports, setExports] = useState(mockExports)
  const [dataLoading, setDataLoading] = useState(true)

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login?redirectTo=/dashboard")
    }
  }, [user, loading, router])

  // Fetch user data when authenticated
  useEffect(() => {
    if (user && !loading) {
      fetchUserData()
    }
  }, [user, loading])

  // Handle payment notifications
  useEffect(() => {
    const payment = searchParams.get('payment')
    const type = searchParams.get('type')
    
    if (payment === 'success' && type === 'one-time-cv') {
      // Visa framgångsrik betalningsnotifikation
      const event = new CustomEvent('show-toast', {
        detail: { 
          message: 'Betalning genomförd! Du kan nu skapa ett extra CV.', 
          type: 'success' 
        }
      })
      window.dispatchEvent(event)
      
      // Ta bort URL parametrar
      router.replace('/dashboard')
    } else if (payment === 'cancelled') {
      // Visa avbruten betalningsnotifikation
      const event = new CustomEvent('show-toast', {
        detail: { 
          message: 'Betalning avbruten.', 
          type: 'info' 
        }
      })
      window.dispatchEvent(event)
      
      // Ta bort URL parametrar
      router.replace('/dashboard')
    }
  }, [searchParams, router])

  const fetchUserData = async () => {
    try {
      const { supabase } = await import("@/lib/supabase")

      // Fetch user's CVs
      const { data: userCVs } = await supabase
        .from("cvs")
        .select("*")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false })

      // Fetch recent exports
      const { data: userExports } = await supabase
        .from("export_history")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5)

      setCvs(userCVs || mockCVs)
      setExports(userExports || mockExports)
    } catch (error) {
      console.error("Error fetching user data:", error)
      // Use mock data on error
      setCvs(mockCVs)
      setExports(mockExports)
    } finally {
      setDataLoading(false)
    }
  }

  // Show loading spinner while auth is loading
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Laddar dashboard...</p>
        </div>
      </div>
    )
  }

  // Don't render if user is not authenticated (redirect is in progress)
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <DashboardContent 
        cvs={cvs} 
        exports={exports} 
        profile={profile || {
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Användare',
          subscription_tier: 'free',
          subscription_status: 'active',
        }} 
      />
    </div>
  )
}
