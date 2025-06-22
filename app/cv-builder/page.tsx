"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  Save, 
  Download, 
  Eye, 
  Plus, 
  Trash2, 
  User, 
  Briefcase, 
  GraduationCap, 
  Award, 
  FileText,
  Loader2,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building,
  Sparkles,
  Wand2
} from "lucide-react"



interface CVData {
  id?: string
  title: string
  personal_info: {
    full_name: string
    email: string
    phone: string
    address: string
    summary: string
  }
  work_experience: Array<{
    id: string
    company: string
    position: string
    start_date: string
    end_date: string
    current: boolean
    description: string
  }>
  education: Array<{
    id: string
    school: string
    degree: string
    field: string
    start_date: string
    end_date: string
    current: boolean
  }>
  skills: Array<{
    id: string
    name: string
    level: number
  }>
  languages: string[]
  certifications: string[]
  template: string
}

const defaultCVData: CVData = {
  title: "Mitt CV",
  personal_info: {
    full_name: "",
    email: "",
    phone: "",
    address: "",
    summary: ""
  },
  work_experience: [],
  education: [],
  skills: [],
  languages: [],
  certifications: [],
  template: "550e8400-e29b-41d4-a716-446655440001"
}



function CVBuilderContent() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const cvId = searchParams.get('id')
  
  const [cvData, setCvData] = useState<CVData>(defaultCVData)
  const [activeTab, setActiveTab] = useState("personal")
  const [saving, setSaving] = useState(false)
  const [dataLoading, setDataLoading] = useState(!!cvId)
  const [previewMode, setPreviewMode] = useState(false)
  const [aiImproving, setAiImproving] = useState<string | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login?redirectTo=/cv-builder")
    }
  }, [user, loading, router])

  // Load CV data if editing existing CV
  useEffect(() => {
    if (cvId && user) {
      loadCVData(cvId)
    } else {
      // Initialize with user data
      if (user && profile) {
        setCvData(prev => ({
          ...prev,
          personal_info: {
            ...prev.personal_info,
            full_name: profile.full_name || user.user_metadata?.full_name || "",
            email: user.email || ""
          }
        }))
      }
      setDataLoading(false)
    }
  }, [cvId, user, profile])

    const loadCVData = async (id: string) => {
    try {
      const { supabase } = await import("@/lib/supabase")
      
      const { data, error } = await supabase
        .from("cvs")
        .select("*")
        .eq("id", id)
        .eq("user_id", user!.id)
        .single()

      if (error) throw error

      if (data) {
        const content = data.content || {}
        setCvData({
          id: data.id,
          title: data.title,
          personal_info: content.personal_info || defaultCVData.personal_info,
          work_experience: content.work_experience || [],
          education: content.education || [],
          skills: content.skills || [],
          languages: content.languages || [],
          certifications: content.certifications || [],
          template: content.template || "550e8400-e29b-41d4-a716-446655440001"
        })
      }
    } catch (error) {
      console.error("Error loading CV:", error)
      const event = new CustomEvent('show-toast', {
        detail: { 
          message: 'Kunde inte ladda CV data', 
          type: 'error' 
        }
      })
      window.dispatchEvent(event)
    } finally {
      setDataLoading(false)
    }
  }

  const saveCVData = async () => {
    if (!user) return

    setSaving(true)
    try {
      const { supabase } = await import("@/lib/supabase")
      
      // Structure the data according to the database schema
      const cvPayload = {
        title: cvData.title,
        user_id: user.id,
        content: {
          personal_info: cvData.personal_info,
          work_experience: cvData.work_experience,
          education: cvData.education,
          skills: cvData.skills,
          languages: cvData.languages,
          certifications: cvData.certifications,
          template: cvData.template
        },
        updated_at: new Date().toISOString()
      }

      let result
      if (cvData.id) {
        // Update existing CV
        result = await supabase
          .from("cvs")
          .update(cvPayload)
          .eq("id", cvData.id)
          .eq("user_id", user.id)
          .select()
          .single()
      } else {
        // Create new CV
        result = await supabase
          .from("cvs")
          .insert([{
            ...cvPayload,
            created_at: new Date().toISOString()
          }])
          .select()
          .single()
      }

      if (result.error) throw result.error

      if (result.data && !cvData.id) {
        setCvData(prev => ({ ...prev, id: result.data.id }))
        // Update URL to include the new CV ID
        router.replace(`/cv-builder?id=${result.data.id}`)
      }

      const event = new CustomEvent('show-toast', {
        detail: { 
          message: 'CV sparat framgångsrikt!', 
          type: 'success' 
        }
      })
      window.dispatchEvent(event)
    } catch (error) {
      console.error("Error saving CV:", error)
      const event = new CustomEvent('show-toast', {
        detail: { 
          message: 'Kunde inte spara CV', 
          type: 'error' 
        }
      })
      window.dispatchEvent(event)
    } finally {
      setSaving(false)
    }
  }

  const addWorkExperience = () => {
    const newExp = {
      id: Date.now().toString(),
      company: "",
      position: "",
      start_date: "",
      end_date: "",
      current: false,
      description: ""
    }
    setCvData(prev => ({
      ...prev,
      work_experience: [...prev.work_experience, newExp]
    }))
  }

  const updateWorkExperience = (id: string, field: string, value: any) => {
    setCvData(prev => ({
      ...prev,
      work_experience: prev.work_experience.map(exp =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }))
  }

  const removeWorkExperience = (id: string) => {
    setCvData(prev => ({
      ...prev,
      work_experience: prev.work_experience.filter(exp => exp.id !== id)
    }))
  }

  const addEducation = () => {
    const newEdu = {
      id: Date.now().toString(),
      school: "",
      degree: "",
      field: "",
      start_date: "",
      end_date: "",
      current: false
    }
    setCvData(prev => ({
      ...prev,
      education: [...prev.education, newEdu]
    }))
  }

  const updateEducation = (id: string, field: string, value: any) => {
    setCvData(prev => ({
      ...prev,
      education: prev.education.map(edu =>
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    }))
  }

  const removeEducation = (id: string) => {
    setCvData(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id)
    }))
  }

  const addSkill = () => {
    const newSkill = {
      id: Date.now().toString(),
      name: "",
      level: 3
    }
    setCvData(prev => ({
      ...prev,
      skills: [...prev.skills, newSkill]
    }))
  }

  const updateSkill = (id: string, field: string, value: any) => {
    setCvData(prev => ({
      ...prev,
      skills: prev.skills.map(skill =>
        skill.id === id ? { ...skill, [field]: value } : skill
      )
    }))
  }

  const removeSkill = (id: string) => {
    setCvData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill.id !== id)
    }))
  }

  const getCompletionPercentage = () => {
    let completed = 0
    let total = 5

    if (cvData.personal_info.full_name) completed++
    if (cvData.personal_info.email) completed++
    if (cvData.personal_info.summary) completed++
    if (cvData.work_experience.length > 0) completed++
    if (cvData.education.length > 0) completed++

    return Math.round((completed / total) * 100)
  }

  const improveTextWithAI = async (text: string, type: 'summary' | 'experience' | 'education', context?: any) => {
    if (!text.trim()) {
      const event = new CustomEvent('show-toast', {
        detail: { 
          message: 'Lägg till lite text först innan du använder AI-förbättring', 
          type: 'info' 
        }
      })
      window.dispatchEvent(event)
      return text
    }

    setAiImproving(type)
    try {
      console.log('🔍 Frontend: Calling AI improvement API...')
      const response = await fetch('/api/ai/improve-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          type,
          context
        }),
      })

      console.log('📡 Frontend: API response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Frontend: API error:', errorData)
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Frontend: AI improvement successful')
      
      // Show a success notification
      const event = new CustomEvent('show-toast', {
        detail: { 
          message: 'Text förbättrad med AI! ✨', 
          type: 'success' 
        }
      })
      window.dispatchEvent(event)
      
      return data.improvedText || text
    } catch (error) {
      console.error('❌ Frontend: AI improvement failed:', error)
      
      // Show error notification
      const event = new CustomEvent('show-toast', {
        detail: { 
          message: `AI-förbättring misslyckades: ${error instanceof Error ? error.message : 'Okänt fel'}`, 
          type: 'error' 
        }
      })
      window.dispatchEvent(event)
      
      // Return original text if AI fails
      return text
    } finally {
      setAiImproving(null)
    }
  }

  // Show loading spinner while auth is loading
  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">
            {loading ? "Laddar..." : "Laddar CV data..."}
          </p>
        </div>
      </div>
    )
  }

  // Don't render if user is not authenticated
  if (!user) {
    return null
  }

  if (previewMode) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setPreviewMode(false)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Tillbaka till redigering
              </Button>
              <div className="flex items-center gap-2">
                <Button onClick={saveCVData} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Spara
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Exportera
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-4xl mx-auto bg-white shadow-lg">
            <CardContent className="p-8">
              {/* CV Preview Content */}
              <div className="space-y-6">
                {/* Header */}
                <div className="text-center border-b pb-6">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {cvData.personal_info.full_name || "Ditt Namn"}
                  </h1>
                  <div className="flex flex-wrap justify-center gap-4 mt-4 text-gray-600">
                    {cvData.personal_info.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {cvData.personal_info.email}
                      </div>
                    )}
                    {cvData.personal_info.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {cvData.personal_info.phone}
                      </div>
                    )}
                    {cvData.personal_info.address && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {cvData.personal_info.address}
                      </div>
                    )}
                  </div>
                </div>

                {/* Summary */}
                {cvData.personal_info.summary && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">Sammanfattning</h2>
                    <p className="text-gray-700 leading-relaxed">{cvData.personal_info.summary}</p>
                  </div>
                )}

                {/* Work Experience */}
                {cvData.work_experience.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Arbetslivserfarenhet</h2>
                    <div className="space-y-4">
                      {cvData.work_experience.map((exp) => (
                        <div key={exp.id} className="border-l-2 border-blue-200 pl-4">
                          <h3 className="font-semibold text-gray-900">{exp.position}</h3>
                          <div className="flex items-center gap-2 text-gray-600 mb-2">
                            <Building className="h-4 w-4" />
                            <span>{exp.company}</span>
                            <span>•</span>
                            <Calendar className="h-4 w-4" />
                            <span>
                              {exp.start_date} - {exp.current ? "Nuvarande" : exp.end_date}
                            </span>
                          </div>
                          {exp.description && (
                            <p className="text-gray-700 text-sm leading-relaxed">{exp.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {cvData.education.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Utbildning</h2>
                    <div className="space-y-3">
                      {cvData.education.map((edu) => (
                        <div key={edu.id}>
                          <h3 className="font-semibold text-gray-900">{edu.degree}</h3>
                          <div className="flex items-center gap-2 text-gray-600">
                            <GraduationCap className="h-4 w-4" />
                            <span>{edu.school}</span>
                            <span>•</span>
                            <span>{edu.field}</span>
                            <span>•</span>
                            <span>
                              {edu.start_date} - {edu.current ? "Pågående" : edu.end_date}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {cvData.skills.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Färdigheter</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {cvData.skills.map((skill) => (
                        <div key={skill.id}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-gray-900 font-medium">{skill.name}</span>
                            <span className="text-sm text-gray-500">{skill.level}/5</span>
                          </div>
                          <Progress value={(skill.level / 5) * 100} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Tillbaka
                </Link>
              </Button>
              <div>
                <Input
                  value={cvData.title}
                  onChange={(e) => setCvData(prev => ({ ...prev, title: e.target.value }))}
                  className="text-lg font-semibold border-none p-0 h-auto bg-transparent focus-visible:ring-0"
                  placeholder="CV Titel"
                />
                <p className="text-sm text-gray-500">
                  {cvData.id ? "Redigerar befintligt CV" : "Skapar nytt CV"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 mr-4">
                <span className="text-sm text-gray-600">Komplett:</span>
                <Progress value={getCompletionPercentage()} className="w-20 h-2" />
                <span className="text-sm font-medium text-gray-900">{getCompletionPercentage()}%</span>
              </div>
              
              <Button
                variant="outline"
                onClick={() => setPreviewMode(true)}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">Förhandsgranska</span>
              </Button>
              
              <Button onClick={saveCVData} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                <span className="hidden sm:inline">Spara</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Progress */}
          <div className="lg:col-span-1">
            <Card className="bg-white shadow-lg border-0 sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg">CV Framsteg</CardTitle>
                <CardDescription>Slutför alla sektioner för bästa resultat</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Komplett</span>
                    <span className="text-sm text-gray-500">{getCompletionPercentage()}%</span>
                  </div>
                  <Progress value={getCompletionPercentage()} className="h-2" />
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${cvData.personal_info.full_name ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm">Personlig information</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${cvData.work_experience.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm">Arbetslivserfarenhet</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${cvData.education.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm">Utbildning</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${cvData.skills.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm">Färdigheter</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="bg-white shadow-lg border-0">
              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4 mb-8">
                    <TabsTrigger value="personal" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline">Personligt</span>
                    </TabsTrigger>
                    <TabsTrigger value="experience" className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      <span className="hidden sm:inline">Erfarenhet</span>
                    </TabsTrigger>
                    <TabsTrigger value="education" className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      <span className="hidden sm:inline">Utbildning</span>
                    </TabsTrigger>
                    <TabsTrigger value="skills" className="flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      <span className="hidden sm:inline">Färdigheter</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="personal" className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Personlig Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="fullName">Fullständigt namn *</Label>
                          <Input
                            id="fullName"
                            value={cvData.personal_info.full_name}
                            onChange={(e) => setCvData(prev => ({
                              ...prev,
                              personal_info: { ...prev.personal_info, full_name: e.target.value }
                            }))}
                            placeholder="Ditt fullständiga namn"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">E-post *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={cvData.personal_info.email}
                            onChange={(e) => setCvData(prev => ({
                              ...prev,
                              personal_info: { ...prev.personal_info, email: e.target.value }
                            }))}
                            placeholder="din@email.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Telefonnummer</Label>
                          <Input
                            id="phone"
                            value={cvData.personal_info.phone}
                            onChange={(e) => setCvData(prev => ({
                              ...prev,
                              personal_info: { ...prev.personal_info, phone: e.target.value }
                            }))}
                            placeholder="+46 70 123 45 67"
                          />
                        </div>
                        <div>
                          <Label htmlFor="address">Adress</Label>
                          <Input
                            id="address"
                            value={cvData.personal_info.address}
                            onChange={(e) => setCvData(prev => ({
                              ...prev,
                              personal_info: { ...prev.personal_info, address: e.target.value }
                            }))}
                            placeholder="Stockholm, Sverige"
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <Label htmlFor="summary">Sammanfattning</Label>
                        <div className="relative">
                          <Textarea
                            id="summary"
                            value={cvData.personal_info.summary}
                            onChange={(e) => setCvData(prev => ({
                              ...prev,
                              personal_info: { ...prev.personal_info, summary: e.target.value }
                            }))}
                            placeholder="Beskriv dig själv och dina professionella mål..."
                            rows={4}
                            className="pr-12"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="absolute top-2 right-2 h-8 w-8 p-0 bg-white hover:bg-purple-50 border-purple-200"
                            onClick={async () => {
                              const improved = await improveTextWithAI(cvData.personal_info.summary, 'summary')
                              setCvData(prev => ({
                                ...prev,
                                personal_info: { ...prev.personal_info, summary: improved }
                              }))
                            }}
                            disabled={aiImproving === 'summary'}
                            title="Förbättra med AI"
                          >
                            {aiImproving === 'summary' ? (
                              <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                            ) : (
                              <Sparkles className="h-4 w-4 text-purple-600" />
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          💡 Klicka på <Sparkles className="h-3 w-3 inline text-purple-600" /> för att låta AI förbättra din text
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="experience" className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Arbetslivserfarenhet</h3>
                      <Button onClick={addWorkExperience} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Lägg till
                      </Button>
                    </div>
                    
                    {cvData.work_experience.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Inga arbetslivserfarenheter tillagda än</p>
                        <Button onClick={addWorkExperience} variant="outline" className="mt-4">
                          <Plus className="h-4 w-4 mr-2" />
                          Lägg till din första erfarenhet
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {cvData.work_experience.map((exp, index) => (
                          <Card key={exp.id} className="border border-gray-200">
                            <CardHeader className="pb-4">
                              <div className="flex justify-between items-center">
                                <CardTitle className="text-base">Arbetslivserfarenhet {index + 1}</CardTitle>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeWorkExperience(exp.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label>Företag</Label>
                                  <Input
                                    value={exp.company}
                                    onChange={(e) => updateWorkExperience(exp.id, 'company', e.target.value)}
                                    placeholder="Företagsnamn"
                                  />
                                </div>
                                <div>
                                  <Label>Position</Label>
                                  <Input
                                    value={exp.position}
                                    onChange={(e) => updateWorkExperience(exp.id, 'position', e.target.value)}
                                    placeholder="Din titel/position"
                                  />
                                </div>
                                <div>
                                  <Label>Startdatum</Label>
                                  <Input
                                    type="month"
                                    value={exp.start_date}
                                    onChange={(e) => updateWorkExperience(exp.id, 'start_date', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label>Slutdatum</Label>
                                  <Input
                                    type="month"
                                    value={exp.end_date}
                                    onChange={(e) => updateWorkExperience(exp.id, 'end_date', e.target.value)}
                                    disabled={exp.current}
                                  />
                                  <div className="flex items-center mt-2">
                                    <input
                                      type="checkbox"
                                      id={`current-${exp.id}`}
                                      checked={exp.current}
                                      onChange={(e) => updateWorkExperience(exp.id, 'current', e.target.checked)}
                                      className="mr-2"
                                    />
                                    <Label htmlFor={`current-${exp.id}`} className="text-sm">
                                      Arbetar här fortfarande
                                    </Label>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <Label>Beskrivning</Label>
                                <div className="relative">
                                  <Textarea
                                    value={exp.description}
                                    onChange={(e) => updateWorkExperience(exp.id, 'description', e.target.value)}
                                    placeholder="Beskriv dina ansvarsområden och prestationer..."
                                    rows={3}
                                    className="pr-12"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="absolute top-2 right-2 h-8 w-8 p-0 bg-white hover:bg-blue-50 border-blue-200"
                                    onClick={async () => {
                                      const improved = await improveTextWithAI(exp.description, 'experience', { 
                                        position: exp.position, 
                                        company: exp.company 
                                      })
                                      updateWorkExperience(exp.id, 'description', improved)
                                    }}
                                    disabled={aiImproving === 'experience'}
                                    title="Förbättra med AI"
                                  >
                                    {aiImproving === 'experience' ? (
                                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                    ) : (
                                      <Wand2 className="h-4 w-4 text-blue-600" />
                                    )}
                                  </Button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  💡 Klicka på <Wand2 className="h-3 w-3 inline text-blue-600" /> för AI-förbättring
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="education" className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Utbildning</h3>
                      <Button onClick={addEducation} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Lägg till
                      </Button>
                    </div>
                    
                    {cvData.education.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <GraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Ingen utbildning tillagd än</p>
                        <Button onClick={addEducation} variant="outline" className="mt-4">
                          <Plus className="h-4 w-4 mr-2" />
                          Lägg till din första utbildning
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {cvData.education.map((edu, index) => (
                          <Card key={edu.id} className="border border-gray-200">
                            <CardHeader className="pb-4">
                              <div className="flex justify-between items-center">
                                <CardTitle className="text-base">Utbildning {index + 1}</CardTitle>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeEducation(edu.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label>Skola/Universitet</Label>
                                  <Input
                                    value={edu.school}
                                    onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                                    placeholder="Skolans namn"
                                  />
                                </div>
                                <div>
                                  <Label>Examen/Grad</Label>
                                  <Input
                                    value={edu.degree}
                                    onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                                    placeholder="t.ex. Kandidatexamen"
                                  />
                                </div>
                                <div>
                                  <Label>Studieområde</Label>
                                  <Input
                                    value={edu.field}
                                    onChange={(e) => updateEducation(edu.id, 'field', e.target.value)}
                                    placeholder="t.ex. Datavetenskap"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <Label>Start</Label>
                                      <Input
                                        type="month"
                                        value={edu.start_date}
                                        onChange={(e) => updateEducation(edu.id, 'start_date', e.target.value)}
                                      />
                                    </div>
                                    <div>
                                      <Label>Slut</Label>
                                      <Input
                                        type="month"
                                        value={edu.end_date}
                                        onChange={(e) => updateEducation(edu.id, 'end_date', e.target.value)}
                                        disabled={edu.current}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex items-center">
                                    <input
                                      type="checkbox"
                                      id={`current-edu-${edu.id}`}
                                      checked={edu.current}
                                      onChange={(e) => updateEducation(edu.id, 'current', e.target.checked)}
                                      className="mr-2"
                                    />
                                    <Label htmlFor={`current-edu-${edu.id}`} className="text-sm">
                                      Pågående studier
                                    </Label>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="skills" className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Färdigheter</h3>
                      <Button onClick={addSkill} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Lägg till
                      </Button>
                    </div>
                    
                    {cvData.skills.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Award className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Inga färdigheter tillagda än</p>
                        <Button onClick={addSkill} variant="outline" className="mt-4">
                          <Plus className="h-4 w-4 mr-2" />
                          Lägg till din första färdighet
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {cvData.skills.map((skill, index) => (
                          <Card key={skill.id} className="border border-gray-200">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-3">
                                <span className="text-sm font-medium text-gray-600">Färdighet {index + 1}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeSkill(skill.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="space-y-3">
                                <Input
                                  value={skill.name}
                                  onChange={(e) => updateSkill(skill.id, 'name', e.target.value)}
                                  placeholder="Färdighetsnamn"
                                />
                                <div>
                                  <div className="flex justify-between items-center mb-2">
                                    <Label className="text-sm">Nivå</Label>
                                    <span className="text-sm text-gray-500">{skill.level}/5</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="1"
                                    max="5"
                                    value={skill.level}
                                    onChange={(e) => updateSkill(skill.id, 'level', parseInt(e.target.value))}
                                    className="w-full"
                                  />
                                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                                    <span>Nybörjare</span>
                                    <span>Expert</span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CVBuilderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Laddar CV builder...</p>
        </div>
      </div>
    }>
      <CVBuilderContent />
    </Suspense>
  )
} 