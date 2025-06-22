// Arbetsförmedlingen API integration
export interface JobListing {
  id: string
  title: string
  employer: string
  location: string
  description: string
  url: string
  publishedDate: string
  applicationDeadline?: string
  workplaceAddress?: {
    municipality: string
    region: string
  }
}

// Jobstream API interfaces
export interface JobstreamParams {
  date?: string // Stream ads changed since datetime (YYYY-MM-DDTHH:MM:SS format)
  'updated-before-date'?: string // Stream ads changed before datetime
  'occupation-concept-id'?: string[] // Filter by occupation concept ids
  'location-concept-id'?: string[] // Filter by location concept ids
}

export interface JobstreamAd {
  id: string
  headline: string
  employer: {
    name: string
    workplace: string
  }
  workplace_address: {
    municipality: string
    region: string
    country: string
  }
  publication_date: string
  application_deadline?: string
  employment_type: {
    label: string
  }
  working_hours_type: {
    label: string
  }
  salary_type?: {
    label: string
  }
  description: {
    text: string
    text_formatted: string
  }
  webpage_url: string
  occupation: {
    label: string
    concept_id: string
  }
  driving_license_required: boolean
  access_to_own_car: boolean
  experience_required: boolean
}

export interface JobSearchParams {
  q?: string
  region?: string
  employment_type?: string
  working_hours_type?: string
  salary_type?: string
  published_after?: string
  offset?: number
  limit?: number
}

export interface JobSearchResult {
  hits: any[]
  total: number
  stats: any
}

export async function searchJobs(params: JobSearchParams): Promise<JobSearchResult> {
  try {
    // Build query parameters for Arbetsförmedlingen API
    const searchParams = new URLSearchParams()
    
    if (params.q) searchParams.append('q', params.q)
    if (params.region) searchParams.append('region', params.region)
    if (params.employment_type) searchParams.append('employment-type', params.employment_type)
    if (params.working_hours_type) searchParams.append('working-hours-type', params.working_hours_type)
    if (params.salary_type) searchParams.append('salary-type', params.salary_type)
    if (params.published_after) searchParams.append('published-after', params.published_after)
    if (params.offset) searchParams.append('offset', params.offset.toString())
    if (params.limit) searchParams.append('limit', params.limit.toString())

    // Add timeout to prevent hanging requests
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    // Use JobTech API (Arbetsförmedlingen's official API)
    const response = await fetch(`https://jobsearch.api.jobtechdev.se/search?${searchParams}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "KarriärAI/1.0",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    return {
      hits: data.hits || [],
      total: data.total || 0,
      stats: data.stats || {}
    }
  } catch (error) {
    console.error("Error fetching jobs from Arbetsförmedlingen:", error)
    
    // Return mock data for development/testing when API fails
    console.log("Returning mock search data due to API error")
    return {
      hits: generateMockJobs(params),
      total: 50,
      stats: {}
    }
  }
}

// Mock data generator for development
function generateMockJobs(params: JobSearchParams): any[] {
  const mockJobs = [
    {
      id: "1",
      headline: "Fullstack Developer - React & Node.js",
      employer: {
        name: "TechCorp AB",
        workplace: "Stockholm"
      },
      workplace_address: {
        municipality: "Stockholm",
        region: "Stockholm"
      },
      publication_date: "2024-01-15",
      application_deadline: "2024-02-15",
      employment_type: {
        label: "Tillsvidare"
      },
      working_hours_type: {
        label: "Heltid"
      },
      salary_type: {
        label: "Fast lön"
      },
      description: {
        text: "Vi söker en erfaren fullstack-utvecklare som behärskar React, Node.js och moderna webbutvecklingstekniker. Du kommer att arbeta i ett agilt team och utveckla innovativa lösningar för våra kunder.",
        text_formatted: "Vi söker en erfaren fullstack-utvecklare som behärskar React, Node.js och moderna webbutvecklingstekniker."
      },
      webpage_url: "https://example.com/job/1"
    },
    {
      id: "2", 
      headline: "UX/UI Designer",
      employer: {
        name: "Design Studio",
        workplace: "Göteborg"
      },
      workplace_address: {
        municipality: "Göteborg",
        region: "Västra Götaland"
      },
      publication_date: "2024-01-14",
      application_deadline: "2024-02-10",
      employment_type: {
        label: "Tillsvidare"
      },
      working_hours_type: {
        label: "Heltid"
      },
      salary_type: {
        label: "Fast lön"
      },
      description: {
        text: "Som UX/UI Designer hos oss kommer du att skapa användarvänliga och visuellt tilltalande digitala upplevelser. Vi arbetar med spännande projekt inom e-handel och fintech.",
        text_formatted: "Som UX/UI Designer hos oss kommer du att skapa användarvänliga och visuellt tilltalande digitala upplevelser."
      },
      webpage_url: "https://example.com/job/2"
    },
    {
      id: "3",
      headline: "Projektledare IT",
      employer: {
        name: "Konsult AB",
        workplace: "Malmö"
      },
      workplace_address: {
        municipality: "Malmö",
        region: "Skåne"
      },
      publication_date: "2024-01-13",
      application_deadline: "2024-02-20",
      employment_type: {
        label: "Konsultuppdrag"
      },
      working_hours_type: {
        label: "Heltid"
      },
      salary_type: {
        label: "Fast lön"
      },
      description: {
        text: "Vi söker en erfaren projektledare för IT-projekt. Du kommer att leda utvecklingsteam och säkerställa att projekt levereras i tid och inom budget.",
        text_formatted: "Vi söker en erfaren projektledare för IT-projekt."
      },
      webpage_url: "https://example.com/job/3"
    }
  ]

  // Filter mock jobs based on search query
  if (params.q) {
    const query = params.q.toLowerCase()
    return mockJobs.filter(job => 
      job.headline.toLowerCase().includes(query) ||
      job.description.text.toLowerCase().includes(query)
    )
  }

  return mockJobs
}

// Legacy function for backward compatibility
export async function searchJobsLegacy(query: {
  title?: string
  location?: string
  limit?: number
}): Promise<JobListing[]> {
  const params: JobSearchParams = {
    q: query.title,
    region: query.location,
    limit: query.limit
  }
  
  const result = await searchJobs(params)
  
  return result.hits.map((hit: any) => ({
    id: hit.id,
    title: hit.headline,
    employer: hit.employer?.name || "Okänd arbetsgivare",
    location: hit.workplace_address?.municipality || "Okänd plats",
    description: hit.description?.text || "",
    url: hit.webpage_url || `https://arbetsformedlingen.se/platsbanken/annonser/${hit.id}`,
    publishedDate: hit.publication_date,
    applicationDeadline: hit.application_deadline,
    workplaceAddress: hit.workplace_address,
  }))
}

// Jobstream API - Stream job changes
export async function streamJobChanges(params: JobstreamParams = {}): Promise<JobstreamAd[]> {
  try {
    const searchParams = new URLSearchParams()
    
    // Set default date to last 24 hours if not provided
    if (!params.date) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      params.date = yesterday.toISOString().slice(0, 19) // Format: YYYY-MM-DDTHH:MM:SS
    }
    
    if (params.date) searchParams.append('date', params.date)
    if (params['updated-before-date']) searchParams.append('updated-before-date', params['updated-before-date'])
    if (params['occupation-concept-id']) {
      params['occupation-concept-id'].forEach(id => searchParams.append('occupation-concept-id', id))
    }
    if (params['location-concept-id']) {
      params['location-concept-id'].forEach(id => searchParams.append('location-concept-id', id))
    }

    // Add timeout to prevent hanging requests
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(`https://jobstream.api.jobtechdev.se/stream?${searchParams}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "KarriärAI/1.0",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Jobstream API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data || []
  } catch (error) {
    console.error("Error fetching from Jobstream API:", error)
    
    // Return mock data for development/testing when API fails
    console.log("Returning mock jobstream data due to API error")
    return generateMockJobstreamData(params)
  }
}

// Mock jobstream data generator for development/fallback
function generateMockJobstreamData(params: JobstreamParams): JobstreamAd[] {
  const mockJobstreamAds: JobstreamAd[] = [
    {
      id: "stream-1",
      headline: "Senior React Developer - Stockholm",
      employer: {
        name: "Tech Innovation AB",
        workplace: "Stockholm"
      },
      workplace_address: {
        municipality: "Stockholm",
        region: "Stockholm",
        country: "Sverige"
      },
      publication_date: new Date().toISOString(),
      application_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      employment_type: {
        label: "Tillsvidare"
      },
      working_hours_type: {
        label: "Heltid"
      },
      salary_type: {
        label: "Fast lön"
      },
      description: {
        text: "Vi söker en erfaren React-utvecklare för att bygga nästa generations webbapplikationer. Du kommer att arbeta med TypeScript, Next.js och moderna utvecklingsverktyg.",
        text_formatted: "Vi söker en erfaren React-utvecklare för att bygga nästa generations webbapplikationer."
      },
      webpage_url: "https://example.com/jobs/stream-1",
      occupation: {
        label: "Mjukvaruutvecklare",
        concept_id: "2419"
      },
      driving_license_required: false,
      access_to_own_car: false,
      experience_required: true
    },
    {
      id: "stream-2",
      headline: "UX Designer - Göteborg",
      employer: {
        name: "Creative Solutions",
        workplace: "Göteborg"
      },
      workplace_address: {
        municipality: "Göteborg",
        region: "Västra Götaland",
        country: "Sverige"
      },
      publication_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      application_deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
      employment_type: {
        label: "Tillsvidare"
      },
      working_hours_type: {
        label: "Heltid"
      },
      salary_type: {
        label: "Fast lön"
      },
      description: {
        text: "Som UX Designer kommer du att forma användarupplevelsen för våra digitala produkter. Vi arbetar med Figma, användarforskning och agila metoder.",
        text_formatted: "Som UX Designer kommer du att forma användarupplevelsen för våra digitala produkter."
      },
      webpage_url: "https://example.com/jobs/stream-2",
      occupation: {
        label: "Grafisk formgivare",
        concept_id: "2166"
      },
      driving_license_required: false,
      access_to_own_car: false,
      experience_required: true
    },
    {
      id: "stream-3",
      headline: "Projektledare IT - Malmö",
      employer: {
        name: "Consulting Pro",
        workplace: "Malmö"
      },
      workplace_address: {
        municipality: "Malmö",
        region: "Skåne",
        country: "Sverige"
      },
      publication_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      application_deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      employment_type: {
        label: "Konsultuppdrag"
      },
      working_hours_type: {
        label: "Heltid"
      },
      salary_type: {
        label: "Timlön"
      },
      description: {
        text: "Vi söker en erfaren projektledare för att leda komplexa IT-projekt. Du kommer att arbeta med scrum, stakeholder management och leveransansvar.",
        text_formatted: "Vi söker en erfaren projektledare för att leda komplexa IT-projekt."
      },
      webpage_url: "https://example.com/jobs/stream-3",
      occupation: {
        label: "Projektledare",
        concept_id: "1221"
      },
      driving_license_required: false,
      access_to_own_car: false,
      experience_required: true
    }
  ]

  return mockJobstreamAds
}

// Alternative proxy-based search function to avoid CORS issues
export async function searchJobsViaProxy(params: JobSearchParams): Promise<JobSearchResult> {
  try {
    const response = await fetch('/api/jobs/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      throw new Error(`Proxy API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching jobs via proxy:", error)
    
    // Fallback to mock data
    console.log("Returning mock search data due to proxy API error")
    return {
      hits: generateMockJobs(params),
      total: 50,
      stats: {}
    }
  }
}

// Alternative proxy-based jobstream function to avoid CORS issues
export async function streamJobChangesViaProxy(params: JobstreamParams = {}): Promise<JobstreamAd[]> {
  try {
    const response = await fetch('/api/jobs/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      throw new Error(`Proxy API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data || []
  } catch (error) {
    console.error("Error fetching jobs stream via proxy:", error)
    
    // Fallback to mock data
    console.log("Returning mock jobstream data due to proxy API error")
    return generateMockJobstreamData(params)
  }
}

// Enhanced job matching based on CV data
export function calculateJobMatchScore(userSkills: string[], jobDescription: string, userExperience: string[]): number {
  let score = 0
  const jobText = jobDescription.toLowerCase()

  // Check skill matches
  userSkills.forEach((skill) => {
    if (jobText.includes(skill.toLowerCase())) {
      score += 20
    }
  })

  // Check experience matches
  userExperience.forEach((exp) => {
    if (jobText.includes(exp.toLowerCase())) {
      score += 15
    }
  })

  return Math.min(score, 100)
}

// Advanced CV-based job matching
export function calculateAdvancedJobMatch(cvData: any, job: JobstreamAd): number {
  let score = 0
  const jobText = (job.description.text + ' ' + job.headline + ' ' + job.occupation.label).toLowerCase()
  
  // Skills matching (40% weight)
  if (cvData.skills && Array.isArray(cvData.skills) && cvData.skills.length > 0) {
    const skillMatches = cvData.skills.filter((skill: any) => 
      skill.name && jobText.includes(skill.name.toLowerCase())
    )
    score += (skillMatches.length / cvData.skills.length) * 40
  }
  
  // Experience matching (30% weight)
  if (cvData.experiences && Array.isArray(cvData.experiences) && cvData.experiences.length > 0) {
    const expMatches = cvData.experiences.filter((exp: any) => 
      (exp.title && jobText.includes(exp.title.toLowerCase())) || 
      (exp.company && jobText.includes(exp.company.toLowerCase()))
    )
    score += (expMatches.length / cvData.experiences.length) * 30
  }
  
  // Education matching (20% weight)
  if (cvData.education && Array.isArray(cvData.education) && cvData.education.length > 0) {
    const eduMatches = cvData.education.filter((edu: any) => 
      (edu.degree && jobText.includes(edu.degree.toLowerCase())) || 
      (edu.school && jobText.includes(edu.school.toLowerCase()))
    )
    score += (eduMatches.length / cvData.education.length) * 20
  }
  
  // Location preference (10% weight)
  if (cvData.personalInfo && cvData.personalInfo.address) {
    const userLocation = cvData.personalInfo.address.toLowerCase()
    const jobLocation = job.workplace_address.municipality.toLowerCase()
    if (userLocation.includes(jobLocation) || jobLocation.includes(userLocation)) {
      score += 10
    }
  }
  
  return Math.min(Math.round(score), 100)
}

// Get jobs based on CV data using Jobstream API
export async function getJobsBasedOnCV(cvData: any, userProfile: any = null): Promise<JobstreamAd[]> {
  try {
    // Validate CV data
    if (!cvData) {
      console.warn("No CV data provided for job matching")
      return []
    }

    // Extract occupation concepts from CV
    const occupationIds: string[] = []
    
    // Map common job titles to occupation concept IDs (this would be more comprehensive in production)
    const occupationMapping: { [key: string]: string } = {
      'utvecklare': '2419', // Systems developer
      'designer': '2166', // Graphic designer  
      'projektledare': '1221', // Project manager
      'marknadsföring': '2431', // Marketing specialist
      'säljare': '3322', // Sales representative
      'konsult': '2149', // Business consultant
    }
    
    // Check CV experience for occupation matches
    if (cvData.experiences && Array.isArray(cvData.experiences)) {
      cvData.experiences.forEach((exp: any) => {
        if (exp.title) {
          const title = exp.title.toLowerCase()
          Object.keys(occupationMapping).forEach(key => {
            if (title.includes(key)) {
              occupationIds.push(occupationMapping[key])
            }
          })
        }
      })
    }
    
    // Extract location concepts from user profile (if available)
    const locationIds: string[] = []
    if (userProfile && userProfile.preferred_locations) {
      // This would map locations to concept IDs in production
      // For now, we'll use the stream without location filtering
    }
    
    const params: JobstreamParams = {
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19), // Last 7 days
    }
    
    if (occupationIds.length > 0) {
      params['occupation-concept-id'] = occupationIds
    }
    
    const jobs = await streamJobChanges(params)
    
    // Score and sort jobs by relevance
    const scoredJobs = jobs.map(job => ({
      ...job,
      matchScore: calculateAdvancedJobMatch(cvData, job)
    })).sort((a, b) => b.matchScore - a.matchScore)
    
    return scoredJobs.slice(0, 20) // Return top 20 matches
  } catch (error) {
    console.error("Error getting CV-based jobs:", error)
    return []
  }
}
