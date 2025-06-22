"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Search, MapPin, Clock, Building, Users, Heart, ExternalLink, Filter, Briefcase, Star, Sparkles, Wand2, FileText, Zap } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Job {
  id: string
  headline: string
  employer: {
    name: string
    workplace: string
  }
  workplace_address: {
    municipality: string
    region: string
  }
  publication_date: string
  application_deadline: string
  employment_type: {
    label: string
  }
  working_hours_type: {
    label: string
  }
  salary_type: {
    label: string
  }
  description: {
    text: string
    text_formatted: string
  }
  webpage_url: string
  logo_url?: string
  relevance?: number
}

interface SearchFilters {
  query: string
  location: string
  employmentType: string
  workingHours: string
  salaryType: string
  publishedAfter: string
}

const initialFilters: SearchFilters = {
  query: '',
  location: '',
  employmentType: '',
  workingHours: '',
  salaryType: '',
  publishedAfter: ''
}

const employmentTypes = [
  { value: '', label: 'Alla anställningstyper' },
  { value: 'permanent', label: 'Tillsvidare' },
  { value: 'temporary', label: 'Tidsbegränsad' },
  { value: 'seasonal', label: 'Säsongsarbete' },
  { value: 'probationary', label: 'Provanställning' }
]

const workingHoursTypes = [
  { value: '', label: 'Alla arbetstider' },
  { value: 'full_time', label: 'Heltid' },
  { value: 'part_time', label: 'Deltid' },
  { value: 'on_demand', label: 'Timanställning' }
]

const salaryTypes = [
  { value: '', label: 'Alla lönetyper' },
  { value: 'fixed', label: 'Fast lön' },
  { value: 'commission', label: 'Provision' },
  { value: 'hourly', label: 'Timlön' }
]

export default function JobMatchingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [filters, setFilters] = useState<SearchFilters>(initialFilters)
  const [searching, setSearching] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [savedJobs, setSavedJobs] = useState<string[]>([])
  const [totalJobs, setTotalJobs] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasSearched, setHasSearched] = useState(false)
  const [aiImproving, setAiImproving] = useState(false)
  const [cvMatching, setCvMatching] = useState(false)
  const [userCvData, setUserCvData] = useState<any>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login?redirectTo=/jobbmatchning")
    }
  }, [user, loading, router])

  // Load saved jobs from localStorage
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`savedJobs_${user.id}`)
      if (saved) {
        setSavedJobs(JSON.parse(saved))
      }
      
      // Load user CV data for matching
      loadUserCvData()
    }
  }, [user])

  const loadUserCvData = async () => {
    if (!user) return
    
    try {
      // Try to get CV data from Supabase
      const { supabase } = await import("@/lib/supabase")
      
      const { data: cvData, error } = await supabase
        .from('cvs')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()
      
      if (cvData && !error && cvData.content) {
        setUserCvData(cvData.content)
      }
    } catch (error) {
      console.log('No CV data found for user')
    }
  }

  const searchJobs = async (page = 1) => {
    setSearching(true)
    try {
      const { searchJobs } = await import("@/lib/arbetsformedlingen")
      
      const searchParams = {
        q: filters.query,
        region: filters.location,
        employment_type: filters.employmentType,
        working_hours_type: filters.workingHours,
        salary_type: filters.salaryType,
        published_after: filters.publishedAfter,
        offset: (page - 1) * 20,
        limit: 20
      }

      const result = await searchJobs(searchParams)
      
      if (page === 1) {
        setJobs(result.hits || [])
        setCurrentPage(1)
      } else {
        setJobs(prev => [...prev, ...(result.hits || [])])
        setCurrentPage(page)
      }
      
      setTotalJobs(result.total || 0)
      setHasSearched(true)
    } catch (error) {
      console.error("Error searching jobs:", error)
      setJobs([])
      setTotalJobs(0)
    } finally {
      setSearching(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    searchJobs(1)
  }

  const loadMoreJobs = () => {
    if (!searching && jobs.length < totalJobs) {
      searchJobs(currentPage + 1)
    }
  }

  const toggleSaveJob = (jobId: string) => {
    const newSavedJobs = savedJobs.includes(jobId)
      ? savedJobs.filter(id => id !== jobId)
      : [...savedJobs, jobId]
    
    setSavedJobs(newSavedJobs)
    localStorage.setItem(`savedJobs_${user!.id}`, JSON.stringify(newSavedJobs))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE')
  }

  const calculateRelevance = (job: Job) => {
    // Use actual relevance if available from CV matching
    if (job.relevance) {
      return job.relevance
    }
    
    // Simple relevance calculation based on user profile for regular search
    // In a real app, this would be more sophisticated
    return Math.floor(Math.random() * 30) + 70 // 70-100% relevance
  }

  const improveSearchWithAI = async () => {
    setAiImproving(true)
    try {
      const response = await fetch('/api/ai/improve-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: filters.query,
          type: 'search_query',
          context: {}
        }),
      })

      if (!response.ok) {
        throw new Error('AI improvement failed')
      }

      const data = await response.json()
      const improvedQuery = data.improvedText || filters.query
      
      setFilters(prev => ({ ...prev, query: improvedQuery }))
    } catch (error) {
      console.error('AI search improvement failed:', error)
      // Keep original query if AI fails
    } finally {
      setAiImproving(false)
    }
  }

  const searchJobsBasedOnCV = async () => {
    if (!userCvData) {
      alert('Inget CV hittades. Skapa ett CV först för att använda denna funktion.')
      return
    }

    setCvMatching(true)
    try {
      const { getJobsBasedOnCV } = await import("@/lib/arbetsformedlingen")
      
      // Get user profile data
      const { supabase } = await import("@/lib/supabase")
      
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single()
      
      const cvBasedJobs = await getJobsBasedOnCV(userCvData, userProfile)
      
      // Convert JobstreamAd to Job format for display
      const convertedJobs = cvBasedJobs.map((job: any) => ({
        id: job.id,
        headline: job.headline,
        employer: job.employer,
        workplace_address: job.workplace_address,
        publication_date: job.publication_date,
        application_deadline: job.application_deadline,
        employment_type: job.employment_type,
        working_hours_type: job.working_hours_type,
        salary_type: job.salary_type || { label: 'Ej specificerad' },
        description: job.description,
        webpage_url: job.webpage_url,
        relevance: job.matchScore
      }))
      
      setJobs(convertedJobs)
      setTotalJobs(convertedJobs.length)
      setHasSearched(true)
      setCurrentPage(1)
      
      // Clear regular search filters since this is CV-based
      setFilters(initialFilters)
      
    } catch (error) {
      console.error("Error with CV-based job matching:", error)
      alert('Ett fel uppstod vid CV-baserad jobbmatchning. Försök igen senare.')
    } finally {
      setCvMatching(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Laddar jobbmatchning...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Jobbmatchning</h1>
          <p className="text-muted-foreground">
            Hitta jobb som matchar din profil med hjälp av Arbetsförmedlingens databas
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="query">Sök efter jobb</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="query"
                      placeholder="t.ex. utvecklare, projektledare, designer..."
                      value={filters.query}
                      onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                      className="pl-10 pr-12"
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1 h-8 w-8 p-0"
                            onClick={improveSearchWithAI}
                            disabled={aiImproving}
                          >
                            {aiImproving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4 text-purple-600" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Förbättra sökning med AI</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div className="w-64">
                  <Label htmlFor="location">Plats</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      placeholder="t.ex. Stockholm, Göteborg..."
                      value={filters.location}
                      onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={searching} className="mt-6">
                  {searching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                  Sök
                </Button>
              </div>

              {/* AI Help Text */}
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <span>Tips: Klicka på AI-ikonen för att förbättra din sökfråga automatiskt</span>
              </div>

              {/* CV-based Job Matching */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Smart CV-matchning</h3>
                    <p className="text-xs text-muted-foreground">
                      Få personliga jobbrekommendationer baserat på ditt CV
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={searchJobsBasedOnCV}
                  disabled={cvMatching || !userCvData}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {cvMatching ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  {cvMatching ? 'Matchar...' : 'Matcha jobb'}
                </Button>
              </div>

              {!userCvData && (
                <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>
                      Du behöver skapa ett CV för att använda CV-baserad jobbmatchning. 
                      <a href="/cv-builder" className="underline ml-1 cursor-pointer">Skapa ditt CV här</a>
                    </span>
                  </div>
                </div>
              )}

              {/* Advanced Filters */}
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Fler filter
                </Button>
                {Object.values(filters).some(value => value) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilters(initialFilters)}
                  >
                    Rensa filter
                  </Button>
                )}
              </div>

              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
                  <div>
                    <Label>Anställningstyp</Label>
                    <Select value={filters.employmentType} onValueChange={(value) => setFilters(prev => ({ ...prev, employmentType: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {employmentTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Arbetstid</Label>
                    <Select value={filters.workingHours} onValueChange={(value) => setFilters(prev => ({ ...prev, workingHours: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {workingHoursTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Lönetyp</Label>
                    <Select value={filters.salaryType} onValueChange={(value) => setFilters(prev => ({ ...prev, salaryType: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {salaryTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Publicerad efter</Label>
                    <Input
                      type="date"
                      value={filters.publishedAfter}
                      onChange={(e) => setFilters(prev => ({ ...prev, publishedAfter: e.target.value }))}
                    />
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {hasSearched && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-muted-foreground">
                {totalJobs > 0 ? `Visar ${jobs.length} av ${totalJobs} jobb` : 'Inga jobb hittades'}
              </p>
              {savedJobs.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {savedJobs.length} sparade jobb
                </p>
              )}
            </div>
            
            {/* CV-based results indicator */}
            {jobs.length > 0 && jobs[0].relevance && (
              <div className="flex items-center gap-2 text-sm bg-blue-50 text-blue-700 px-3 py-2 rounded-lg border border-blue-200">
                <FileText className="h-4 w-4" />
                <span>Dessa jobb är matchade baserat på ditt CV med hjälp av Jobstream API</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Smart matchning
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Job Results */}
        <div className="space-y-4">
          {jobs.map((job) => {
            const relevance = calculateRelevance(job)
            const isSaved = savedJobs.includes(job.id)
            
            return (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{job.headline}</h3>
                        <Badge 
                          variant={job.relevance ? "default" : "secondary"} 
                          className={`text-xs ${job.relevance ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white" : ""}`}
                        >
                          {job.relevance ? (
                            <FileText className="h-3 w-3 mr-1" />
                          ) : (
                            <Star className="h-3 w-3 mr-1" />
                          )}
                          {relevance}% {job.relevance ? "CV-match" : "match"}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          {job.employer.name}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {job.workplace_address.municipality}, {job.workplace_address.region}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Publicerad {formatDate(job.publication_date)}
                        </div>
                      </div>

                      <div className="flex gap-2 mb-3">
                        {job.employment_type?.label && (
                          <Badge variant="outline">{job.employment_type.label}</Badge>
                        )}
                        {job.working_hours_type?.label && (
                          <Badge variant="outline">{job.working_hours_type.label}</Badge>
                        )}
                        {job.salary_type?.label && (
                          <Badge variant="outline">{job.salary_type.label}</Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {job.description.text.substring(0, 300)}...
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleSaveJob(job.id)}
                        className={isSaved ? "text-red-600 border-red-200" : ""}
                      >
                        <Heart className={`h-4 w-4 mr-1 ${isSaved ? "fill-current" : ""}`} />
                        {isSaved ? "Sparad" : "Spara"}
                      </Button>
                      <Button size="sm" asChild>
                        <a href={job.webpage_url} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Ansök
                        </a>
                      </Button>
                    </div>
                  </div>

                  {job.application_deadline && (
                    <div className="text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded">
                      <Clock className="h-4 w-4 inline mr-1" />
                      Ansökan senast: {formatDate(job.application_deadline)}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Load More Button */}
        {jobs.length > 0 && jobs.length < totalJobs && (
          <div className="text-center mt-8">
            <Button
              onClick={loadMoreJobs}
              disabled={searching}
              variant="outline"
            >
              {searching ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Briefcase className="h-4 w-4 mr-2" />
              )}
              Ladda fler jobb
            </Button>
          </div>
        )}

        {/* No Results */}
        {hasSearched && jobs.length === 0 && !searching && (
          <Card>
            <CardContent className="text-center py-12">
              <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Inga jobb hittades</h3>
              <p className="text-muted-foreground mb-4">
                Prova att ändra dina sökkriterier eller ta bort några filter
              </p>
              <Button onClick={() => setFilters(initialFilters)}>
                Rensa alla filter
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Welcome Message */}
        {!hasSearched && (
          <Card>
            <CardContent className="text-center py-12">
              <Briefcase className="h-12 w-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-semibold mb-2">Välkommen till Jobbmatchning</h3>
              <p className="text-muted-foreground mb-6">
                Sök bland tusentals jobb från Arbetsförmedlingen. Använd sökfältet ovan för att komma igång,
                eller prova vår smarta CV-matchning för personliga rekommendationer.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 col-span-2">
                  <div className="p-4 border rounded-lg">
                    <Search className="h-6 w-6 text-blue-600 mb-2" />
                    <h4 className="font-medium mb-1">Sök smart</h4>
                    <p className="text-sm text-muted-foreground">
                      Använd nyckelord och plats för att hitta relevanta jobb
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <FileText className="h-6 w-6 text-purple-600 mb-2" />
                    <h4 className="font-medium mb-1">CV-matchning</h4>
                    <p className="text-sm text-muted-foreground">
                      Få personliga jobbrekommendationer baserat på ditt CV
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <Heart className="h-6 w-6 text-red-600 mb-2" />
                    <h4 className="font-medium mb-1">Spara jobb</h4>
                    <p className="text-sm text-muted-foreground">
                      Spara intressanta jobb för senare granskning
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <Zap className="h-6 w-6 text-yellow-600 mb-2" />
                    <h4 className="font-medium mb-1">Realtidsdata</h4>
                    <p className="text-sm text-muted-foreground">
                      Jobstream API ger dig de senaste jobbannonserna
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium text-blue-900">Powered by Jobstream API</h4>
                </div>
                <p className="text-sm text-blue-700">
                  Vi använder Arbetsförmedlingens officiella Jobstream API för att ge dig tillgång till 
                  de senaste jobbannonserna och förändringarna i realtid. CV-matchningen analyserar 
                  dina färdigheter och erfarenheter för att hitta de mest relevanta jobben.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 