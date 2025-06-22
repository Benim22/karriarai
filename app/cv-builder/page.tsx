"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { format, parse } from "date-fns"
import { sv } from "date-fns/locale"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Loader2, Plus, Trash2, Download, Save, Eye, User, Briefcase, GraduationCap, Award, FileText, Settings, X, Sparkles, Wand2, Clock, CheckCircle, CalendarDays } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToastProvider } from "@/components/toast-notification"
import { getCVTemplate, CVTemplate } from "@/lib/cv-templates"
import { CVTemplatePreview } from "@/components/cv-template-preview"
import { CVLimitDialog } from "@/components/cv-limit-dialog"

interface PersonalInfo {
  fullName: string
  email: string
  phone: string
  address: string
  city: string
  postalCode: string
  summary: string
}

interface Experience {
  id: string
  title: string
  company: string
  location: string
  startDate: string
  endDate: string
  current: boolean
  description: string
}

interface Education {
  id: string
  degree: string
  school: string
  location: string
  startDate: string
  endDate: string
  current: boolean
  description: string
}

interface Skill {
  id: string
  name: string
  level: 'Nybörjare' | 'Medel' | 'Avancerad' | 'Expert'
}

interface CVData {
  personalInfo: PersonalInfo
  experiences: Experience[]
  education: Education[]
  skills: Skill[]
  languages: string[]
  certifications: string[]
  template?: CVTemplate
}

const initialCVData: CVData = {
  personalInfo: {
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    summary: ''
  },
  experiences: [],
  education: [],
  skills: [],
  languages: [],
  certifications: [],
  template: undefined
}

// Custom DatePicker component for month/year selection
interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

function DatePicker({ value, onChange, placeholder = "Välj datum", disabled = false }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  
  // Parse current value
  const currentDate = value ? parse(value, "yyyy-MM", new Date()) : null
  const currentMonth = currentDate ? currentDate.getMonth() : null
  const currentYear = currentDate ? currentDate.getFullYear() : null

  // Generate months in Swedish
  const months = [
    "Januari", "Februari", "Mars", "April", "Maj", "Juni",
    "Juli", "Augusti", "September", "Oktober", "November", "December"
  ]

  // Generate years (from 1960 to current year)
  const currentYearNum = new Date().getFullYear()
  const years = Array.from({ length: currentYearNum - 1959 }, (_, i) => currentYearNum - i)

  const handleMonthChange = (monthIndex: string) => {
    const month = parseInt(monthIndex)
    const year = currentYear || new Date().getFullYear()
    const newDate = format(new Date(year, month), "yyyy-MM")
    onChange(newDate)
  }

  const handleYearChange = (yearStr: string) => {
    const year = parseInt(yearStr)
    const month = currentMonth !== null ? currentMonth : 0
    const newDate = format(new Date(year, month), "yyyy-MM")
    onChange(newDate)
  }

  const displayValue = currentDate 
    ? format(currentDate, "MMMM yyyy", { locale: sv })
    : placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-full justify-start text-left font-normal ${!currentDate && "text-muted-foreground"}`}
          disabled={disabled}
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          {displayValue}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="space-y-4">
          <div className="text-sm font-medium text-center">Välj månad och år</div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Månad</Label>
              <Select 
                value={currentMonth !== null ? currentMonth.toString() : ""} 
                onValueChange={handleMonthChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj månad" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">År</Label>
              <Select 
                value={currentYear ? currentYear.toString() : ""} 
                onValueChange={handleYearChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj år" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                onChange("")
                setOpen(false)
              }}
            >
              Rensa
            </Button>
            <Button 
              size="sm" 
              onClick={() => setOpen(false)}
              disabled={!currentDate}
            >
              Klar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function CVBuilderContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [cvData, setCVData] = useState<CVData>(initialCVData)
  const [activeTab, setActiveTab] = useState("personal")
  const [saving, setSaving] = useState(false)
  const [progress, setProgress] = useState(0)
  const [aiImproving, setAiImproving] = useState<string | null>(null)
  const [autoSaving, setAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [showLimitDialog, setShowLimitDialog] = useState(false)
  const [userCVs, setUserCVs] = useState<any[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)
  const lastSavedDataRef = useRef<CVData | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login?redirectTo=/cv-builder")
    }
  }, [user, loading, router])

  // Check CV limits and load user data
  useEffect(() => {
    if (user) {
      checkCVLimitsAndLoadData()
    }
  }, [user, searchParams])

  const checkCVLimitsAndLoadData = async () => {
    try {
      const { supabase } = await import("@/lib/supabase")
      
      // Hämta användarens profil och CV:n
      const [profileResult, cvsResult] = await Promise.all([
        supabase
          .from('karriar_profiles')
          .select('*')
          .eq('id', user!.id)
          .single(),
        supabase
          .from('cvs')
          .select('*')
          .eq('user_id', user!.id)
      ])

      const profile = profileResult.data
      const cvs = cvsResult.data || []
      
      setUserProfile(profile)
      setUserCVs(cvs)

      // Kontrollera om användaren försöker skapa ett nytt CV
      const templateId = searchParams.get('template')
      const editingCVId = searchParams.get('id')
      
      // Om det är en template (nytt CV) och användaren har nått sin gräns
      if (templateId && !editingCVId) {
        const limits = getSubscriptionLimits(profile?.subscription_tier)
        const extraCredits = profile?.extra_cv_credits || 0
        const totalAllowed = limits.cvs === -1 ? -1 : limits.cvs + extraCredits
        
        if (totalAllowed !== -1 && cvs.length >= totalAllowed) {
          setShowLimitDialog(true)
          return // Stoppa här, visa dialog
        }
      }

      // Set basic user info
      setCVData(prev => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          fullName: user!.user_metadata?.full_name || '',
          email: user!.email || ''
        }
      }))
      
      // Load template if specified in URL
      if (templateId) {
        loadTemplate(templateId)
      } else {
        // Load existing CV data
        loadExistingCV()
      }
    } catch (error) {
      console.error('Error checking CV limits:', error)
    }
  }

  const getSubscriptionLimits = (subscriptionTier?: string) => {
    switch (subscriptionTier) {
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
  }

  const consumeExtraCreditIfNeeded = async () => {
    if (!userProfile || !user) return

    const limits = getSubscriptionLimits(userProfile.subscription_tier)
    
    // Om användaren har obegränsade CV, behöver vi inte konsumera credits
    if (limits.cvs === -1) return

    // Kontrollera om detta CV går över grundgränsen
    if (userCVs.length >= limits.cvs && userProfile.extra_cv_credits > 0) {
      try {
        const { supabase } = await import("@/lib/supabase")
        
        // Minska extra credits med 1
        const { error } = await supabase
          .from('karriar_profiles')
          .update({ 
            extra_cv_credits: userProfile.extra_cv_credits - 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)

        if (!error) {
          // Uppdatera lokalt state
          setUserProfile(prev => ({
            ...prev,
            extra_cv_credits: prev.extra_cv_credits - 1
          }))
          
          console.log('Consumed 1 extra CV credit. Remaining:', userProfile.extra_cv_credits - 1)
        } else {
          console.error('Error consuming extra credit:', error)
        }
      } catch (error) {
        console.error('Error consuming extra credit:', error)
      }
    }
  }

  const loadTemplate = async (templateId: string) => {
    try {
      console.log("Loading template:", templateId)
      const template = await getCVTemplate(templateId)
      
      if (template) {
        console.log("Template loaded:", template.name)
        
        // Try to load existing CV first, then apply template
        const { supabase } = await import("@/lib/supabase")
        
        const { data: existingCV, error } = await supabase
          .from('cvs')
          .select('*')
          .eq('user_id', user!.id)
          .single()

        let baseData = initialCVData
        
        if (existingCV && !error && existingCV.content) {
          // Use existing CV data as base
          const content = existingCV.content
          baseData = {
            personalInfo: content.personalInfo || {
              fullName: user!.user_metadata?.full_name || '',
              email: user!.email || '',
              phone: '',
              address: '',
              city: '',
              postalCode: '',
              summary: ''
            },
            experiences: content.experiences || [],
            education: content.education || [],
            skills: content.skills || [],
            languages: content.languages || [],
            certifications: content.certifications || [],
            template: undefined
          }
          setLastSaved(new Date(existingCV.updated_at))
        } else {
          // Use user info for new CV
          baseData = {
            ...initialCVData,
            personalInfo: {
              ...initialCVData.personalInfo,
              fullName: user!.user_metadata?.full_name || '',
              email: user!.email || ''
            }
          }
        }
        
        // Apply template to the data
        setCVData({
          ...baseData,
          template: template
        })
        
        console.log("Template applied successfully")
      } else {
        console.log("Template not found, loading existing CV")
        await loadExistingCV()
      }
    } catch (error) {
      console.error("Error loading template:", error)
      await loadExistingCV()
    }
  }

  const loadExistingCV = async () => {
    try {
      const { supabase } = await import("@/lib/supabase")
      
      const { data: existingCV, error } = await supabase
        .from('cvs')
        .select('*')
        .eq('user_id', user!.id)
        .single()

      if (existingCV && !error && existingCV.content) {
        const content = existingCV.content
        setCVData({
          personalInfo: content.personalInfo || {
            fullName: user!.user_metadata?.full_name || '',
            email: user!.email || '',
            phone: '',
            address: '',
            city: '',
            postalCode: '',
            summary: ''
          },
          experiences: content.experiences || [],
          education: content.education || [],
          skills: content.skills || [],
          languages: content.languages || [],
          certifications: content.certifications || [],
          template: content.template || undefined
        })
        console.log("Existing CV loaded successfully")
        setLastSaved(new Date(existingCV.updated_at))
        
        // Set the loaded data as the last saved data to prevent unnecessary auto-saves
        lastSavedDataRef.current = {
          personalInfo: content.personalInfo || {
            fullName: user!.user_metadata?.full_name || '',
            email: user!.email || '',
            phone: '',
            address: '',
            city: '',
            postalCode: '',
            summary: ''
          },
          experiences: content.experiences || [],
          education: content.education || [],
          skills: content.skills || [],
          languages: content.languages || [],
          certifications: content.certifications || [],
          template: content.template || undefined
        }
      }
    } catch (error) {
      console.log("No existing CV found or error loading:", error)
      // Keep default data with user info
    }
  }

  // Calculate progress
  useEffect(() => {
    const calculateProgress = () => {
      let completed = 0
      const total = 6

      if (cvData.personalInfo.fullName && cvData.personalInfo.email) completed++
      if (cvData.personalInfo.summary) completed++
      if (cvData.experiences.length > 0) completed++
      if (cvData.education.length > 0) completed++
      if (cvData.skills.length > 0) completed++
      if (cvData.languages.length > 0 || cvData.certifications.length > 0) completed++

      setProgress((completed / total) * 100)
    }

    calculateProgress()
  }, [cvData])

  // Auto-save functionality with debounce
  useEffect(() => {
    if (!user || !autoSaveEnabled) return

    // Check if data has actually changed since last save
    const hasDataChanged = () => {
      if (!lastSavedDataRef.current) return true
      return JSON.stringify(cvData) !== JSON.stringify(lastSavedDataRef.current)
    }

    const autoSave = async (currentCvData: CVData) => {
      setAutoSaving(true)
      try {
        await saveCVWithData(currentCvData, false) // Don't show notification for auto-save
        lastSavedDataRef.current = { ...currentCvData } // Store copy of saved data
      } catch (error) {
        console.error('Auto-save failed:', error)
      } finally {
        setAutoSaving(false)
      }
    }

    // Debounce auto-save - wait 3 seconds after last change
    const timeoutId = setTimeout(() => {
      // Only auto-save if there's meaningful content and data has changed
      if ((cvData.personalInfo.fullName || cvData.personalInfo.summary || 
          cvData.experiences.length > 0 || cvData.education.length > 0 || 
          cvData.skills.length > 0) && hasDataChanged()) {
        autoSave(cvData)
      }
    }, 3000)

    return () => clearTimeout(timeoutId)
  }, [cvData, user, autoSaveEnabled])

  // Format last saved time
  const formatLastSaved = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'just nu'
    if (diffInMinutes === 1) return '1 minut sedan'
    if (diffInMinutes < 60) return `${diffInMinutes} minuter sedan`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours === 1) return '1 timme sedan'
    if (diffInHours < 24) return `${diffInHours} timmar sedan`
    
    return date.toLocaleDateString('sv-SE')
  }

  const addExperience = () => {
    const newExp: Experience = {
      id: Date.now().toString(),
      title: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: ''
    }
    setCVData(prev => ({
      ...prev,
      experiences: [...prev.experiences, newExp]
    }))
  }

  const updateExperience = (id: string, field: keyof Experience, value: any) => {
    setCVData(prev => ({
      ...prev,
      experiences: prev.experiences.map(exp => 
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }))
  }

  const removeExperience = (id: string) => {
    setCVData(prev => ({
      ...prev,
      experiences: prev.experiences.filter(exp => exp.id !== id)
    }))
  }

  const addEducation = () => {
    const newEdu: Education = {
      id: Date.now().toString(),
      degree: '',
      school: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: ''
    }
    setCVData(prev => ({
      ...prev,
      education: [...prev.education, newEdu]
    }))
  }

  const updateEducation = (id: string, field: keyof Education, value: any) => {
    setCVData(prev => ({
      ...prev,
      education: prev.education.map(edu => 
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    }))
  }

  const removeEducation = (id: string) => {
    setCVData(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id)
    }))
  }

  const addSkill = () => {
    const newSkill: Skill = {
      id: Date.now().toString(),
      name: '',
      level: 'Medel'
    }
    setCVData(prev => ({
      ...prev,
      skills: [...prev.skills, newSkill]
    }))
  }

  const updateSkill = (id: string, field: keyof Skill, value: any) => {
    setCVData(prev => ({
      ...prev,
      skills: prev.skills.map(skill => 
        skill.id === id ? { ...skill, [field]: value } : skill
      )
    }))
  }

  const removeSkill = (id: string) => {
    setCVData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill.id !== id)
    }))
  }

  const saveCVWithData = async (dataToSave: CVData, showNotification = true) => {
    setSaving(true)
    try {
      const { supabase } = await import("@/lib/supabase")
      
      // Create CV data for database - store everything in content JSONB field
      const cvDataForDB = {
        user_id: user!.id,
        title: dataToSave.personalInfo.fullName ? `${dataToSave.personalInfo.fullName}s CV` : 'Mitt CV',
        content: {
          personalInfo: dataToSave.personalInfo,
          experiences: dataToSave.experiences,
          education: dataToSave.education,
          skills: dataToSave.skills,
          languages: dataToSave.languages,
          certifications: dataToSave.certifications
        },
        updated_at: new Date().toISOString()
      }

      // Check if CV already exists for this user
      const { data: existingCV } = await supabase
        .from('cvs')
        .select('id')
        .eq('user_id', user!.id)
        .single()

      if (existingCV) {
        // Update existing CV
        const { error } = await supabase
          .from('cvs')
          .update(cvDataForDB)
          .eq('id', existingCV.id)
        
        if (error) throw error
      } else {
        // Create new CV
        const { error } = await supabase
          .from('cvs')
          .insert([cvDataForDB])
        
        if (error) throw error

        // Konsumera extra credit om användaren har nått sin grundgräns
        await consumeExtraCreditIfNeeded()
      }

      // Update last saved time for both auto and manual saves
      setLastSaved(new Date())
      setSaveStatus('success')
      lastSavedDataRef.current = { ...dataToSave } // Store copy of saved data
      
      if (showNotification) {
        console.log("CV saved successfully!")
        // Show success notification
        const event = new CustomEvent('show-toast', {
          detail: { message: 'CV sparat framgångsrikt!', type: 'success' }
        })
        window.dispatchEvent(event)
      }
      
      // Clear success status after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      console.error("Error saving CV:", error)
      setSaveStatus('error')
      
      if (showNotification) {
        // Show error notification
        const event = new CustomEvent('show-toast', {
          detail: { message: 'Fel vid sparning av CV. Försök igen.', type: 'error' }
        })
        window.dispatchEvent(event)
      }
      
      // Clear error status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000)
    } finally {
      setSaving(false)
    }
  }

  // Wrapper function for manual saving that uses current cvData
  const saveCV = async (showNotification = true) => {
    return saveCVWithData(cvData, showNotification)
  }

  const improveTextWithAI = async (text: string, type: 'summary' | 'experience' | 'education', context?: any) => {
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
          message: 'Text förbättrad med AI!', 
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Laddar CV-builder...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">CV Builder</h1>
              <p className="text-muted-foreground mb-2">
                Skapa ditt professionella CV steg för steg. Dina ändringar sparas automatiskt var 3:e sekund.
              </p>
              {cvData.template && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Använder mall:</span>
                  <span 
                    className="text-sm px-3 py-1 rounded-full text-white font-medium"
                    style={{ backgroundColor: cvData.template.styles.accentColor }}
                  >
                    {cvData.template.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCVData(prev => ({ ...prev, template: undefined }))}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              {!cvData.template && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="cursor-pointer"
                >
                  <Link href="/exempel-cv">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Välj mall
                  </Link>
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span>Framsteg</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              
              {/* Auto-save status */}
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="auto-save"
                      checked={autoSaveEnabled}
                      onCheckedChange={setAutoSaveEnabled}
                    />
                    <label htmlFor="auto-save" className="cursor-pointer">
                      Automatisk sparning
                    </label>
                  </div>
                  {autoSaving && (
                    <div className="flex items-center gap-1 text-blue-600">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Sparar...</span>
                    </div>
                  )}
                </div>
                {lastSaved && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Senast sparad: {formatLastSaved(lastSaved)}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={() => saveCV(true)} 
                      disabled={saving || autoSaving}
                      variant={saveStatus === 'success' ? 'default' : saveStatus === 'error' ? 'destructive' : 'default'}
                      className={saveStatus === 'success' ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      {(saving || autoSaving) ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : saveStatus === 'success' ? (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {saving ? 'Sparar...' : 
                       autoSaving ? 'Auto-sparar...' : 
                       saveStatus === 'success' ? 'Sparat!' :
                       saveStatus === 'error' ? 'Fel - försök igen' :
                       'Spara nu'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Spara ditt CV manuellt (även när auto-save är aktiverat)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Förhandsgranska
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>CV Förhandsvisning</DialogTitle>
                  </DialogHeader>
                  <div className="bg-white rounded-lg border">
                    <CVTemplatePreview 
                      template={cvData.template}
                      cvData={{
                        personalInfo: cvData.personalInfo,
                        experiences: cvData.experiences,
                        education: cvData.education,
                        skills: cvData.skills,
                        languages: cvData.languages,
                        certifications: cvData.certifications
                      }}
                    />
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Ladda ner
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Personligt
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Sammanfattning
            </TabsTrigger>
            <TabsTrigger value="experience" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Erfarenhet
            </TabsTrigger>
            <TabsTrigger value="education" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Utbildning
            </TabsTrigger>
            <TabsTrigger value="skills" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Färdigheter
            </TabsTrigger>
            <TabsTrigger value="extras" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Övrigt
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personlig Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Fullständigt namn *</Label>
                    <Input
                      id="fullName"
                      value={cvData.personalInfo.fullName}
                      onChange={(e) => setCVData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, fullName: e.target.value }
                      }))}
                      placeholder="Förnamn Efternamn"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-post *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={cvData.personalInfo.email}
                      onChange={(e) => setCVData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, email: e.target.value }
                      }))}
                      placeholder="din@email.se"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefonnummer</Label>
                    <Input
                      id="phone"
                      value={cvData.personalInfo.phone}
                      onChange={(e) => setCVData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, phone: e.target.value }
                      }))}
                      placeholder="070-123 45 67"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Adress</Label>
                    <Input
                      id="address"
                      value={cvData.personalInfo.address}
                      onChange={(e) => setCVData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, address: e.target.value }
                      }))}
                      placeholder="Gatunamn 123"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Stad</Label>
                    <Input
                      id="city"
                      value={cvData.personalInfo.city}
                      onChange={(e) => setCVData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, city: e.target.value }
                      }))}
                      placeholder="Stockholm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Postnummer</Label>
                    <Input
                      id="postalCode"
                      value={cvData.personalInfo.postalCode}
                      onChange={(e) => setCVData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, postalCode: e.target.value }
                      }))}
                      placeholder="123 45"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Professionell Sammanfattning</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Label htmlFor="summary">Beskriv dig själv och dina mål (2-3 meningar)</Label>
                  <div className="relative">
                    <Textarea
                      id="summary"
                      value={cvData.personalInfo.summary}
                      onChange={(e) => setCVData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, summary: e.target.value }
                      }))}
                      placeholder="Erfaren mjukvaruutvecklare med passion för att skapa innovativa lösningar..."
                      className="mt-2 min-h-[120px] pr-12"
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="absolute top-4 right-2 h-8 w-8 p-0"
                            onClick={async () => {
                              const improved = await improveTextWithAI(cvData.personalInfo.summary, 'summary')
                              setCVData(prev => ({
                                ...prev,
                                personalInfo: { ...prev.personalInfo, summary: improved }
                              }))
                            }}
                            disabled={aiImproving === 'summary'}
                          >
                            {aiImproving === 'summary' ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4 text-purple-600" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Förbättra med AI</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    💡 Klicka på <Sparkles className="h-4 w-4 inline text-purple-600" /> för att låta AI förbättra din text
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="experience" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Arbetslivserfarenhet</h2>
              <Button onClick={addExperience}>
                <Plus className="h-4 w-4 mr-2" />
                Lägg till erfarenhet
              </Button>
            </div>

            {cvData.experiences.map((exp, index) => (
              <Card key={exp.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">Erfarenhet {index + 1}</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeExperience(exp.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Jobbtitel *</Label>
                      <Input
                        value={exp.title}
                        onChange={(e) => updateExperience(exp.id, 'title', e.target.value)}
                        placeholder="Mjukvaruutvecklare"
                      />
                    </div>
                    <div>
                      <Label>Företag *</Label>
                      <Input
                        value={exp.company}
                        onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                        placeholder="Företagsnamn AB"
                      />
                    </div>
                    <div>
                      <Label>Plats</Label>
                      <Input
                        value={exp.location}
                        onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                        placeholder="Stockholm, Sverige"
                      />
                    </div>
                    <div>
                      <Label>Startdatum</Label>
                      <DatePicker
                        value={exp.startDate}
                        onChange={(value) => updateExperience(exp.id, 'startDate', value)}
                        placeholder="Välj startdatum"
                      />
                    </div>
                    <div>
                      <Label>Slutdatum</Label>
                      <DatePicker
                        value={exp.endDate}
                        onChange={(value) => updateExperience(exp.id, 'endDate', value)}
                        placeholder="Välj slutdatum"
                        disabled={exp.current}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`current-${exp.id}`}
                        checked={exp.current}
                        onCheckedChange={(checked) => updateExperience(exp.id, 'current', checked)}
                      />
                      <Label htmlFor={`current-${exp.id}`}>Nuvarande position</Label>
                    </div>
                  </div>
                  <div>
                    <Label>Beskrivning</Label>
                    <div className="relative">
                      <Textarea
                        value={exp.description}
                        onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                        placeholder="Beskriv dina huvudsakliga ansvarsområden och prestationer..."
                        className="mt-2 pr-12"
                      />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="absolute top-4 right-2 h-8 w-8 p-0"
                              onClick={async () => {
                                const improved = await improveTextWithAI(exp.description, 'experience', { title: exp.title, company: exp.company })
                                updateExperience(exp.id, 'description', improved)
                              }}
                              disabled={aiImproving === 'experience'}
                            >
                              {aiImproving === 'experience' ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Wand2 className="h-4 w-4 text-blue-600" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Förbättra med AI</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {cvData.experiences.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="text-center py-12">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">Ingen arbetslivserfarenhet tillagd än</p>
                  <Button onClick={addExperience}>
                    <Plus className="h-4 w-4 mr-2" />
                    Lägg till din första erfarenhet
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="education" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Utbildning</h2>
              <Button onClick={addEducation}>
                <Plus className="h-4 w-4 mr-2" />
                Lägg till utbildning
              </Button>
            </div>

            {cvData.education.map((edu, index) => (
              <Card key={edu.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">Utbildning {index + 1}</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeEducation(edu.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Examen/Kurs *</Label>
                      <Input
                        value={edu.degree}
                        onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                        placeholder="Kandidatexamen i Datavetenskap"
                      />
                    </div>
                    <div>
                      <Label>Skola/Universitet *</Label>
                      <Input
                        value={edu.school}
                        onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                        placeholder="Kungliga Tekniska Högskolan"
                      />
                    </div>
                    <div>
                      <Label>Plats</Label>
                      <Input
                        value={edu.location}
                        onChange={(e) => updateEducation(edu.id, 'location', e.target.value)}
                        placeholder="Stockholm, Sverige"
                      />
                    </div>
                    <div>
                      <Label>Startdatum</Label>
                      <DatePicker
                        value={edu.startDate}
                        onChange={(value) => updateEducation(edu.id, 'startDate', value)}
                        placeholder="Välj startdatum"
                      />
                    </div>
                    <div>
                      <Label>Slutdatum</Label>
                      <DatePicker
                        value={edu.endDate}
                        onChange={(value) => updateEducation(edu.id, 'endDate', value)}
                        placeholder="Välj slutdatum"
                        disabled={edu.current}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`current-edu-${edu.id}`}
                        checked={edu.current}
                        onCheckedChange={(checked) => updateEducation(edu.id, 'current', checked)}
                      />
                      <Label htmlFor={`current-edu-${edu.id}`}>Pågående</Label>
                    </div>
                  </div>
                  <div>
                    <Label>Beskrivning (valfritt)</Label>
                    <div className="relative">
                      <Textarea
                        value={edu.description}
                        onChange={(e) => updateEducation(edu.id, 'description', e.target.value)}
                        placeholder="Relevanta kurser, projekt, eller prestationer..."
                        className="mt-2 pr-12"
                      />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="absolute top-4 right-2 h-8 w-8 p-0"
                              onClick={async () => {
                                const improved = await improveTextWithAI(edu.description, 'education', { degree: edu.degree, school: edu.school })
                                updateEducation(edu.id, 'description', improved)
                              }}
                              disabled={aiImproving === 'education'}
                            >
                              {aiImproving === 'education' ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Wand2 className="h-4 w-4 text-green-600" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Förbättra med AI</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {cvData.education.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="text-center py-12">
                  <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">Ingen utbildning tillagd än</p>
                  <Button onClick={addEducation}>
                    <Plus className="h-4 w-4 mr-2" />
                    Lägg till din första utbildning
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="skills" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Färdigheter</h2>
              <Button onClick={addSkill}>
                <Plus className="h-4 w-4 mr-2" />
                Lägg till färdighet
              </Button>
            </div>

            {cvData.skills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Dina färdigheter</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cvData.skills.map((skill) => (
                    <div key={skill.id} className="flex items-center gap-4">
                      <div className="flex-1">
                        <Input
                          value={skill.name}
                          onChange={(e) => updateSkill(skill.id, 'name', e.target.value)}
                          placeholder="t.ex. JavaScript, Projektledning"
                        />
                      </div>
                      <div className="w-32">
                        <select
                          value={skill.level}
                          onChange={(e) => updateSkill(skill.id, 'level', e.target.value)}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="Nybörjare">Nybörjare</option>
                          <option value="Medel">Medel</option>
                          <option value="Avancerad">Avancerad</option>
                          <option value="Expert">Expert</option>
                        </select>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeSkill(skill.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {cvData.skills.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="text-center py-12">
                  <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">Inga färdigheter tillagda än</p>
                  <Button onClick={addSkill}>
                    <Plus className="h-4 w-4 mr-2" />
                    Lägg till din första färdighet
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="extras" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Språk</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={cvData.languages.join('\n')}
                    onChange={(e) => setCVData(prev => ({
                      ...prev,
                      languages: e.target.value.split('\n').filter(lang => lang.trim())
                    }))}
                    placeholder="Svenska - Modersmål&#10;Engelska - Flyt&#10;Tyska - Grundläggande"
                    className="min-h-[120px]"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Skriv ett språk per rad
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Certifieringar & Kurser</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={cvData.certifications.join('\n')}
                    onChange={(e) => setCVData(prev => ({
                      ...prev,
                      certifications: e.target.value.split('\n').filter(cert => cert.trim())
                    }))}
                    placeholder="AWS Solutions Architect&#10;Scrum Master Certification&#10;Google Analytics Certified"
                    className="min-h-[120px]"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Skriv en certifiering per rad
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>

    {/* CV Limit Dialog */}
    <CVLimitDialog
      isOpen={showLimitDialog}
      onClose={() => {
        setShowLimitDialog(false)
        router.push('/dashboard') // Skicka tillbaka till dashboard
      }}
      currentCVCount={userCVs.length}
      userEmail={user?.email}
    />
    </ToastProvider>
  )
}

export default function CVBuilderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Laddar CV-builder...</p>
        </div>
      </div>
    }>
      <CVBuilderContent />
    </Suspense>
  )
} 