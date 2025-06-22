import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const params = await request.json()
    
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

    // Make request to Arbetsförmedlingen API from server-side (no CORS issues)
    const response = await fetch(`https://jobsearch.api.jobtechdev.se/search?${searchParams}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "KarriärAI/1.0",
      },
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    return NextResponse.json({
      hits: data.hits || [],
      total: data.total || 0,
      stats: data.stats || {}
    })
  } catch (error) {
    console.error("Error in jobs search API route:", error)
    
    // Return error response
    return NextResponse.json(
      { error: "Failed to fetch jobs from Arbetsförmedlingen API" },
      { status: 500 }
    )
  }
} 