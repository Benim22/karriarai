"use client"

import { useEffect, useState, useCallback, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { 
  FileText, 
  Plus, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  TrendingUp, 
  Users, 
  Star, 
  Palette,
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  Briefcase,
  Target,
  Award,
  Loader2,
  RefreshCw,
  AlertTriangle
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { sv } from "date-fns/locale"
import Link from "next/link"
import { CVTemplatePreview } from "@/components/cv-template-preview"

// Mock data för utveckling
const mockCVs = [
  {
    id: "1",
    title: "Mitt första CV",
    template: "550e8400-e29b-41d4-a716-446655440001",
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    status: "draft",
    preview_url: null
  },
  {
    id: "2", 
    title: "Senior Developer CV",
    template: "550e8400-e29b-41d4-a716-446655440002",
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString(), 
    status: "completed",
    preview_url: null
  }
]

const mockExports: any[] = [
  {
    id: "1",
    cv_title: "Mitt första CV",
    format: "PDF",
    created_at: new Date().toISOString()
  }
]

// Separate component for handling search params
function PaymentNotificationHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const payment = searchParams.get('payment')
    const type = searchParams.get('type')
    
    if (payment === 'success' && type === 'one-time-cv') {
      const event = new CustomEvent('show-toast', {
        detail: { 
          message: 'Betalning genomförd! Du kan nu skapa ett extra CV.', 
          type: 'success' 
        }
      })
      window.dispatchEvent(event)
      router.replace('/dashboard')
    } else if (payment === 'cancelled') {
      const event = new CustomEvent('show-toast', {
        detail: { 
          message: 'Betalning avbruten.', 
          type: 'info' 
        }
      })
      window.dispatchEvent(event)
      router.replace('/dashboard')
    }
  }, [searchParams, router])

  return null
}

function DashboardPageContent() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [cvs, setCvs] = useState(mockCVs)
  const [exports, setExports] = useState(mockExports)
  const [dataLoading, setDataLoading] = useState(false) // Start with false to avoid initial loading
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCV, setSelectedCV] = useState<any>(null)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [cvToDelete, setCvToDelete] = useState<any>(null)
  const fetchingRef = useRef(false)

  // Redirect if not authenticated and reset data when logged out
  useEffect(() => {
    if (!loading && !user) {
      console.log("🚪 User logged out, clearing dashboard data and redirecting...")
      // Clear all dashboard data when user logs out
      setCvs([])
      setExports([])
      setSelectedCV(null)
      setDataLoading(false)
      fetchingRef.current = false
      setPreviewDialogOpen(false)
      setDeleteDialogOpen(false)
      setCvToDelete(null)
      
      router.push("/auth/login?redirectTo=/dashboard")
    }
  }, [user, loading, router])

  // Memoized fetch function to prevent infinite loops
  const fetchUserData = useCallback(async () => {
    if (!user?.id) {
      console.warn("No user ID available for fetching data")
      return
    }

    // Prevent multiple simultaneous fetches
    if (fetchingRef.current) {
      console.log("⏳ Data fetch already in progress, skipping...")
      return
    }

    fetchingRef.current = true
    setDataLoading(true)
    console.log("🔄 Fetching user data for:", user.id.substring(0, 8) + '...')
    
    try {
      const { supabase } = await import("@/lib/supabase")

      // Fetch user's CVs with better error handling
      const { data: userCVs, error: cvError } = await supabase
        .from("cvs")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })

      if (cvError) {
        console.error("Error fetching CVs:", cvError)
        setCvs([]) // Set empty array instead of mock data
      } else {
        console.log("✅ Successfully fetched", userCVs?.length || 0, "CVs")
        setCvs(userCVs || [])
      }

      // Fetch recent exports with better error handling
      const { data: userExports, error: exportError } = await supabase
        .from("export_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10)

      if (exportError) {
        console.error("Error fetching exports:", exportError)
        setExports([])
      } else {
        console.log("✅ Successfully fetched", userExports?.length || 0, "exports")
        setExports(userExports || [])
      }

    } catch (error) {
      console.error("❌ Critical error fetching user data:", error)
      setCvs([])
      setExports([])
    } finally {
      fetchingRef.current = false
      setDataLoading(false)
      console.log("✅ Data loading complete")
    }
  }, [user?.id]) // Ta bort dataLoading från dependencies för att undvika loops

  // Fetch user data when authenticated - only once per user
  useEffect(() => {
    if (user && !loading && user.id) {
      console.log("🚀 Triggering fetchUserData for user:", user.id.substring(0, 8) + '...')
      fetchUserData()
    }
  }, [user?.id, loading]) // Ta bort fetchUserData från dependency för att förhindra loops

  // Helper funktioner för CV preview
  const transformCVDataForPreview = (cv: any) => {
    if (!cv.content) {
      console.warn("⚠️ No content found in CV:", cv.title)
      return null
    }
    
    console.log("🔄 Transforming CV data:", cv.content)
    
    // Hantera personal info från olika fält
    const personalInfo = cv.content.personalInfo || cv.content.personal_info || {}
    
    // Hantera work experience från olika fält  
    const experiences = cv.content.experiences || cv.content.work_experience || []
    
    // Transform experiences till rätt format
    const transformedExperiences = experiences.map((exp: any) => ({
      id: exp.id || Math.random().toString(),
      title: exp.title || exp.position || "",
      company: exp.company || "",
      location: exp.location || "",
      startDate: exp.startDate || exp.start_date || "",
      endDate: exp.endDate || exp.end_date || "",
      current: exp.current || false,
      description: exp.description || ""
    }))
    
    // Transform education till rätt format
    const transformedEducation = (cv.content.education || []).map((edu: any) => ({
      id: edu.id || Math.random().toString(),
      degree: edu.degree || edu.field || "",
      school: edu.school || edu.institution || "",
      location: edu.location || "",
      startDate: edu.startDate || edu.start_date || "",
      endDate: edu.endDate || edu.end_date || "",
      current: edu.current || false,
      description: edu.description || ""
    }))
    
    // Transform skills till rätt format
    const transformedSkills = (cv.content.skills || []).map((skill: any) => {
      let level = 'Medel' // Default
      if (typeof skill.level === 'number') {
        // Konvertera numerisk level till text
        const levels = ['Nybörjare', 'Medel', 'Avancerad', 'Expert']
        level = levels[Math.min(skill.level - 1, 3)] || 'Medel'
      } else if (typeof skill.level === 'string') {
        level = skill.level
      }
      
      return {
        id: skill.id || Math.random().toString(),
        name: skill.name || "",
        level: level as 'Nybörjare' | 'Medel' | 'Avancerad' | 'Expert'
      }
    }).filter((skill: any) => skill.name.trim() !== "") // Filtrera bort tomma skills
    
    const transformedData = {
      personalInfo: {
        fullName: personalInfo.fullName || personalInfo.full_name || "Namn saknas",
        email: personalInfo.email || "",
        phone: personalInfo.phone || "",
        address: personalInfo.address || "",
        city: personalInfo.city || "",
        postalCode: personalInfo.postalCode || personalInfo.postal_code || "",
        summary: personalInfo.summary || ""
      },
      experiences: transformedExperiences,
      education: transformedEducation,
      skills: transformedSkills,
      languages: cv.content.languages || [],
      certifications: cv.content.certifications || []
    }
    
    console.log("✅ Transformed CV data:", transformedData)
    return transformedData
  }

  const getDefaultTemplate = () => ({
    id: 'default',
    name: 'Standard Mall',
    category: 'modern',
    template_data: {}
  })

  const getDefaultStyles = () => ({
    fontFamily: 'Inter',
    fontSize: '14px',
    primaryColor: '#2563eb',
    secondaryColor: '#64748b',
    accentColor: '#3b82f6',
    backgroundColor: '#ffffff',
    headerStyle: 'modern',
    sectionSpacing: 'medium',
    layout: 'single-column',
    sectionStyle: 'minimal',
    headerPosition: 'top'
  })

  const handlePreviewCV = async (cv: any) => {
    console.log("👁️ Opening preview for CV:", cv.title)
    
    setPreviewLoading(true)
    setSelectedCV(null) // Reset selected CV
    setPreviewDialogOpen(true) // Open dialog immediately
    
    try {
      const { supabase } = await import("@/lib/supabase")
      
      // Hämta fullständig CV-data med template information
      const { data: fullCVData, error } = await supabase
        .from("cvs")
        .select(`
          *,
          cv_templates (
            id,
            name,
            category,
            template_data
          )
        `)
        .eq("id", cv.id)
        .single()
      
      if (error) {
        console.error("❌ Error fetching CV data:", error)
        console.log("🔄 Using fallback basic CV data:", cv)
        setSelectedCV(cv) // Fallback till basic data
      } else {
        console.log("✅ CV data fetched successfully")
        console.log("📊 Full CV data structure:", JSON.stringify(fullCVData, null, 2))
        setSelectedCV(fullCVData)
      }
      
    } catch (error) {
      console.error("❌ Critical error in preview:", error)
      setSelectedCV(cv) // Fallback
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleDeleteCV = (cv: any) => {
    setCvToDelete(cv)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteCV = async () => {
    if (!cvToDelete) return

    try {
      console.log("🗑️ Deleting CV:", cvToDelete.title)
      const { supabase } = await import("@/lib/supabase")
      
      const { error } = await supabase
        .from("cvs")
        .delete()
        .eq("id", cvToDelete.id)
        .eq("user_id", user!.id)

      if (error) {
        console.error("❌ Database error deleting CV:", error)
        throw error
      }

      console.log("✅ CV deleted from database successfully")
      
      // Update local state
      setCvs(prevCvs => prevCvs.filter(cv => cv.id !== cvToDelete.id))
      setDeleteDialogOpen(false)
      setCvToDelete(null)
      
      // Show success toast
      const successEvent = new CustomEvent('show-toast', {
        detail: { 
          message: `CV "${cvToDelete.title}" har tagits bort framgångsrikt`, 
          type: 'success' 
        }
      })
      window.dispatchEvent(successEvent)
    } catch (error) {
      console.error("❌ Critical error deleting CV:", error)
      
      // Show error toast
      const errorEvent = new CustomEvent('show-toast', {
        detail: { 
          message: 'Kunde inte ta bort CV:t. Försök igen.', 
          type: 'error' 
        }
      })
      window.dispatchEvent(errorEvent)
    } finally {
      setDeleteDialogOpen(false)
      setCvToDelete(null)
    }
  }

  const filteredCVs = cvs.filter(cv => 
    cv.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getSubscriptionLimits = () => {
    const tier = profile?.subscription_tier || 'free'
    switch (tier) {
      case 'pro':
        return { cvs: -1, exports: -1, label: 'Pro' }
      case 'enterprise':
        return { cvs: -1, exports: -1, label: 'Enterprise' }
      default:
        return { cvs: 3, exports: 5, label: 'Gratis' }
    }
  }

  const limits = getSubscriptionLimits()
  const canCreateCV = limits.cvs === -1 || cvs.length < limits.cvs + (profile?.extra_cv_credits || 0)

  // Show loading spinner while auth is loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Laddar dashboard...</p>
        </div>
      </div>
    )
  }

  // Don't render if user is not authenticated
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      <Suspense fallback={null}>
        <PaymentNotificationHandler />
      </Suspense>
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div className="mb-6 lg:mb-0">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Hej {profile?.full_name?.split(" ")[0] || "Användare"}! 👋
            </h1>
            <p className="text-gray-600 text-lg">Hantera dina CV och följ din jobbsökningsresa</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Badge 
              variant={profile?.subscription_tier === "free" ? "secondary" : "default"}
              className="text-sm px-4 py-2"
            >
              {limits.label} Plan
            </Badge>
            <Button 
              onClick={() => canCreateCV ? router.push('/cv-builder') : null}
              disabled={!canCreateCV}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nytt CV
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Mina CV</CardTitle>
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{cvs.length}</div>
              {limits.cvs !== -1 && (
                <div className="mt-3">
                  <Progress 
                    value={(cvs.length / (limits.cvs + (profile?.extra_cv_credits || 0))) * 100} 
                    className="h-2 bg-gray-200"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {cvs.length} av {limits.cvs + (profile?.extra_cv_credits || 0)} använda
                    {profile?.extra_cv_credits > 0 && (
                      <span className="text-blue-600 font-medium"> (+{profile.extra_cv_credits} extra)</span>
                    )}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Exporter</CardTitle>
              <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Download className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{exports.length}</div>
              <p className="text-xs text-gray-500 mt-1">Senaste månaden</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Jobbmatcher</CardTitle>
              <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">12</div>
              <p className="text-xs text-purple-600 hover:text-purple-800 mt-1">
                <Link href="/jobbmatchning" className="hover:underline cursor-pointer">
                  Se alla jobb →
                </Link>
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Framgång</CardTitle>
              <div className="h-8 w-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Award className="h-4 w-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">85%</div>
              <p className="text-xs text-gray-500 mt-1">Profil komplett</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* CV List */}
          <div className="lg:col-span-2">
            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">Mina CV</CardTitle>
                    <CardDescription className="text-gray-600">Hantera och redigera dina CV</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Sök CV..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full sm:w-64"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {dataLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">Laddar dina CV...</p>
                      <p className="text-sm text-gray-500 mt-1">Detta kan ta några sekunder</p>
                    </div>
                  </div>
                ) : filteredCVs.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-20 w-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <FileText className="h-10 w-10 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {searchTerm ? "Inga CV hittades" : "Välkommen till ditt CV-bibliotek!"}
                    </h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                      {searchTerm 
                        ? "Försök med en annan sökning eller rensa filtret för att se alla dina CV." 
                        : "Skapa ditt första professionella CV med AI-stöd och moderna mallar."
                      }
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                      {!searchTerm && (
                        <Button 
                          onClick={() => canCreateCV ? router.push('/cv-builder') : null}
                          disabled={!canCreateCV}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                          size="lg"
                        >
                          <Plus className="mr-2 h-5 w-5" />
                          Skapa ditt första CV
                        </Button>
                      )}
                      <Button 
                        onClick={fetchUserData}
                        variant="outline"
                        size="lg"
                        className="border-blue-200 hover:bg-blue-50"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Uppdatera
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredCVs.map((cv) => (
                      <Card
                        key={cv.id}
                        className="group border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-white"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                                <FileText className="h-7 w-7 text-white" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                                  {cv.title}
                                </h3>
                                <div className="flex items-center gap-3">
                                  <Badge 
                                    variant={cv.status === 'completed' ? 'default' : 'secondary'}
                                    className="text-xs font-medium"
                                  >
                                    {cv.status === 'completed' ? '✅ Klar' : '📝 Utkast'}
                                  </Badge>
                                  <div className="flex items-center gap-1 text-sm text-gray-500">
                                    <Calendar className="h-3 w-3" />
                                    <span>
                                      Uppdaterad {formatDistanceToNow(new Date(cv.updated_at), {
                                        addSuffix: true,
                                        locale: sv,
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="hover:bg-blue-100 hover:text-blue-600 rounded-xl"
                                onClick={() => handlePreviewCV(cv)}
                                title="Förhandsgranska CV"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="hover:bg-green-100 hover:text-green-600 rounded-xl"
                                asChild
                                title="Redigera CV"
                              >
                                <Link href={`/cv-builder?id=${cv.id}`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="hover:bg-red-100 hover:text-red-600 rounded-xl"
                                onClick={() => handleDeleteCV(cv)}
                                title="Ta bort CV"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-900">Snabbåtgärder</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start hover:bg-blue-50 hover:border-blue-200"
                  asChild
                >
                  <Link href="/cv-builder">
                    <Plus className="mr-2 h-4 w-4" />
                    Nytt CV
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start hover:bg-green-50 hover:border-green-200"
                  asChild
                >
                  <Link href="/jobbmatchning">
                    <Briefcase className="mr-2 h-4 w-4" />
                    Hitta jobb
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start hover:bg-purple-50 hover:border-purple-200"
                  asChild
                >
                  <Link href="/exempel-cv">
                    <Palette className="mr-2 h-4 w-4" />
                    CV-mallar
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-900">Senaste aktivitet</CardTitle>
              </CardHeader>
              <CardContent>
                {exports.length === 0 ? (
                  <p className="text-gray-500 text-sm">Ingen aktivitet än</p>
                ) : (
                  <div className="space-y-3">
                    {exports.slice(0, 5).map((exportItem) => (
                      <div key={exportItem.id} className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <Download className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {exportItem.cv_title}
                          </p>
                          <p className="text-xs text-gray-500">
                            Exporterad som {exportItem.format}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CV Preview Dialog */}
      <Dialog 
        open={previewDialogOpen} 
        onOpenChange={(open) => {
          setPreviewDialogOpen(open)
          if (!open) {
            // Reset state när dialogen stängs
            setSelectedCV(null)
            setPreviewLoading(false)
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCV?.title}</DialogTitle>
            <DialogDescription>
              Förhandsgranska ditt CV innan du exporterar eller delar det
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {previewLoading ? (
              <div className="text-center py-16 text-gray-500">
                <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-lg font-medium">Laddar förhandsgranskning...</p>
                <p className="text-sm mt-1">Hämtar CV-data och mall</p>
              </div>
            ) : selectedCV ? (
              <div className="bg-white border rounded-lg shadow-inner max-h-[600px] overflow-y-auto">
                {selectedCV.content && transformCVDataForPreview(selectedCV) ? (
                  <div className="p-4">
                    <CVTemplatePreview
                      cvData={transformCVDataForPreview(selectedCV)}
                      template={selectedCV.cv_templates || getDefaultTemplate()}
                      styles={selectedCV.styles || getDefaultStyles()}
                    />
                  </div>
                ) : (
                  <div className="text-center py-16 text-gray-500">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Tomt CV</p>
                    <p className="text-sm mt-2 max-w-md mx-auto">
                      Detta CV innehåller ingen data än. Klicka på "Redigera" för att lägga till innehåll och skapa ditt professionella CV.
                    </p>
                    <Button asChild className="mt-4">
                      <Link href={`/cv-builder?id=${selectedCV.id}`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Börja redigera
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
                <p className="text-lg font-medium">Kunde inte ladda CV</p>
                <p className="text-sm mt-2">Ett fel uppstod när CV:t skulle hämtas.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setPreviewDialogOpen(false)}
              disabled={previewLoading}
            >
              Stäng
            </Button>
            <Button asChild disabled={previewLoading || !selectedCV}>
              <Link href={`/cv-builder?id=${selectedCV?.id}`}>
                <Edit className="mr-2 h-4 w-4" />
                Redigera CV
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Är du säker?</AlertDialogTitle>
            <AlertDialogDescription>
              Detta kommer att permanent radera CV:t "{cvToDelete?.title}". 
              Denna åtgärd kan inte ångras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteCV}
              className="bg-red-600 hover:bg-red-700"
            >
              Radera
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Laddar dashboard...</p>
        </div>
      </div>
    }>
      <DashboardPageContent />
    </Suspense>
  )
}
