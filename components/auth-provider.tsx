"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import type { UserProfile } from "@/types/user"
import { handleAuthError, signOutSafely, checkSession, clearLocalSession } from "@/lib/auth-helpers"

// Import supabase with error handling
let supabase: any = null
try {
  const { supabase: supabaseClient } = require("@/lib/supabase")
  supabase = supabaseClient
} catch (error) {
  console.error("Supabase configuration error:", error)
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      setError("Supabase is not configured. Please check your environment variables.")
      setLoading(false)
      return
    }

    // Initialize session with better error handling
    const initializeAuth = async () => {
      try {
        const { success, session, error } = await checkSession()
        
        if (!success) {
          console.error("Session check failed:", error)
          setError(handleAuthError(error))
          setLoading(false)
          return
        }
        
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error("Auth initialization failed:", error)
        setError("Kunde inte initiera autentisering")
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      console.log("Auth state change:", event, session?.user?.id)
      
      try {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
          // Make sure loading is set to false after successful login
          setLoading(false)
        } else {
          setProfile(null)
          setError(null) // Clear errors when logged out
          setLoading(false)
        }
      } catch (error) {
        console.error("Error in auth state change:", error)
        setError("Fel vid autentisering: " + (error as Error).message)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const createUserProfile = async (userId: string) => {
    if (!supabase || !user) return

    try {
      const userEmail = user.email || ''
      const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Användare'
      
             const profileData: UserProfile = {
         id: userId,
         email: userEmail,
         full_name: userName,
         subscription_tier: 'free' as const,
         subscription_status: 'inactive' as const,
         role: 'user' as const,
         email_notifications: true,
         marketing_emails: false,
         profile_visibility: 'private' as const,
         job_search_status: 'not_looking' as const,
         remote_work_preference: 'hybrid' as const,
         onboarding_completed: false
       }

      const { error } = await supabase.from("karriar_profiles").insert([profileData])
      
      if (error) {
        console.error("Error creating profile:", error)
        setError("Kunde inte skapa profil: " + error.message)
      } else {
        console.log("Profile created successfully")
        setProfile(profileData)
        setError(null)
      }
    } catch (error) {
      console.error("Error creating profile:", error)
      setError("Ett oväntat fel uppstod vid skapande av profil")
    }
  }

  const fetchProfile = async (userId: string) => {
    if (!supabase) {
      console.warn("Supabase not configured, using user data from auth")
      // Use actual user data from Supabase Auth
      const userEmail = user?.email || ''
      const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Användare'
      
      setProfile({
        id: userId,
        email: userEmail,
        full_name: userName,
        subscription_tier: 'free' as const,
        subscription_status: 'inactive' as const,
        role: 'user' as const,
        email_notifications: true,
        marketing_emails: false,
        profile_visibility: 'private' as const,
        job_search_status: 'not_looking' as const,
        remote_work_preference: 'hybrid' as const,
        onboarding_completed: false
      })
      setLoading(false)
      return
    }

    try {
      console.log("Attempting to fetch profile for user:", userId)
      const { data, error } = await supabase.from("karriar_profiles").select("*").eq("id", userId).single()

      if (error) {
        console.warn("Database error:", error.code, error.message)
        
        // If table doesn't exist or profile not found, create a default profile
        if (error.code === '42P01') {
          console.warn("KarriärAI profiles table doesn't exist. Please run the database setup.")
          setError("Databas inte konfigurerad. Gå till /setup/databas för att konfigurera.")
        } else if (error.code === 'PGRST116') {
          console.warn("Profile not found, attempting to create one")
          await createUserProfile(userId)
          return // createUserProfile will set the profile
        } else {
          console.error("Unexpected database error:", error)
          setError("Databasfel: " + error.message)
          
          // Fallback: set a profile using real user data
          const userEmail = user?.email || ''
          const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Användare'
          
          setProfile({
            id: userId,
            email: userEmail,
            full_name: userName,
            subscription_tier: 'free' as const,
            subscription_status: 'inactive' as const,
            role: 'user' as const,
            email_notifications: true,
            marketing_emails: false,
            profile_visibility: 'private' as const,
            job_search_status: 'not_looking' as const,
            remote_work_preference: 'hybrid' as const,
            onboarding_completed: false
          })
        }
      } else {
        console.log("Profile fetched successfully:", data)
        setProfile(data)
        setError(null)
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      setError("Ett oväntat fel uppstod vid hämtning av profil")
      
      // Set a fallback profile using real user data
      const userEmail = user?.email || ''
      const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Användare'
      
      setProfile({
        id: userId,
        email: userEmail,
        full_name: userName,
        subscription_tier: 'free' as const,
        subscription_status: 'inactive' as const,
        role: 'user' as const,
        email_notifications: true,
        marketing_emails: false,
        profile_visibility: 'private' as const,
        job_search_status: 'not_looking' as const,
        remote_work_preference: 'hybrid' as const,
        onboarding_completed: false
      })
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase is not configured")

    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        throw new Error(handleAuthError(error))
      }
      console.log("Sign in successful, user:", data.user?.email)
      
      // The auth state change listener will handle setting user and profile
      return data
    } catch (error) {
      console.error("Sign in error:", error)
      setLoading(false)
      throw error
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!supabase) throw new Error("Supabase is not configured")

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })
      if (error) {
        throw new Error(handleAuthError(error))
      }
      return data
    } catch (error) {
      console.error("Sign up error:", error)
      throw error
    }
  }

  const signOut = async () => {
    if (!supabase) throw new Error("Supabase is not configured")

    try {
      const result = await signOutSafely()
      if (!result.success) {
        // If session is already missing, that's actually success for logout
        if (result.error?.includes('session missing') || result.error?.includes('Session saknas')) {
          console.log("Session already missing, treating as successful logout")
          // Clear local state
          setUser(null)
          setProfile(null)
          setError(null)
          return
        }
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("Error during signOut:", error)
      // For logout, we should clear local state even if there's an error
      clearLocalSession() // Clear any remaining local session data
      setUser(null)
      setProfile(null)
      setError(null)
      // Don't throw the error for logout - just log it
      console.warn("Logout completed with errors, but local state cleared")
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!supabase) throw new Error("Supabase is not configured")
    if (!user) throw new Error("No user logged in")

    const { error } = await supabase.from("karriar_profiles").update(updates).eq("id", user.id)

    if (error) throw error

    setProfile((prev) => (prev ? { ...prev, ...updates } : null))
  }

  const value = {
    user,
    profile,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
