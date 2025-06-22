"use client"

import { useEffect, useState, Suspense } from "react"
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
  Loader2
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { sv } from "date-fns/locale"
import Link from "next/link"

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
  const [dataLoading, setDataLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCV, setSelectedCV] = useState<any>(null)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [cvToDelete, setCvToDelete] = useState<any>(null)

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
        .limit(10)

      setCvs(userCVs || mockCVs)
      setExports(userExports || mockExports)
    } catch (error) {
      console.error("Error fetching user data:", error)
      setCvs(mockCVs)
      setExports(mockExports)
    } finally {
      setDataLoading(false)
    }
  }

  const handlePreviewCV = (cv: any) => {
    setSelectedCV(cv)
    setPreviewDialogOpen(true)
  }

  const handleDeleteCV = (cv: any) => {
    setCvToDelete(cv)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteCV = async () => {
    if (!cvToDelete) return

    try {
      const { supabase } = await import("@/lib/supabase")
      
      const { error } = await supabase
        .from("cvs")
        .delete()
        .eq("id", cvToDelete.id)
        .eq("user_id", user!.id)

      if (error) throw error

      setCvs(cvs.filter(cv => cv.id !== cvToDelete.id))
      
      const event = new CustomEvent('show-toast', {
        detail: { 
          message: 'CV raderat framgångsrikt', 
          type: 'success' 
        }
      })
      window.dispatchEvent(event)
    } catch (error) {
      console.error("Error deleting CV:", error)
      const event = new CustomEvent('show-toast', {
        detail: { 
          message: 'Kunde inte radera CV', 
          type: 'error' 
        }
      })
      window.dispatchEvent(event)
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
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                ) : filteredCVs.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {searchTerm ? "Inga CV hittades" : "Inga CV än"}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {searchTerm 
                        ? "Försök med en annan sökning" 
                        : "Skapa ditt första CV för att komma igång"
                      }
                    </p>
                    {!searchTerm && (
                      <Button 
                        onClick={() => canCreateCV ? router.push('/cv-builder') : null}
                        disabled={!canCreateCV}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Skapa ditt första CV
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredCVs.map((cv) => (
                      <div
                        key={cv.id}
                        className="group flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-blue-200 transition-all duration-200"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                            <FileText className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {cv.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                variant={cv.status === 'completed' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {cv.status === 'completed' ? 'Klar' : 'Utkast'}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                Uppdaterad {formatDistanceToNow(new Date(cv.updated_at), {
                                  addSuffix: true,
                                  locale: sv,
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="hover:bg-blue-100 hover:text-blue-600"
                            onClick={() => handlePreviewCV(cv)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="hover:bg-green-100 hover:text-green-600"
                            asChild
                          >
                            <Link href={`/cv-builder?id=${cv.id}`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="hover:bg-red-100 hover:text-red-600"
                            onClick={() => handleDeleteCV(cv)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
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
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCV?.title}</DialogTitle>
            <DialogDescription>
              Förhandsgranska ditt CV innan du exporterar eller delar det
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {selectedCV && (
              <div className="bg-white border rounded-lg p-8 shadow-inner">
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">CV Förhandsgranskning</p>
                  <p className="text-sm mt-2">
                    Här visas ditt CV med vald mall och innehåll
                  </p>
                  <div className="mt-6 space-y-2 text-left max-w-md mx-auto">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
              Stäng
            </Button>
            <Button asChild>
              <Link href={`/cv-builder?id=${selectedCV?.id}`}>
                <Edit className="mr-2 h-4 w-4" />
                Redigera
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
