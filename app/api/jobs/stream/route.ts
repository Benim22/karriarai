import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const params = await request.json()
    
    // Build query parameters for Jobstream API
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
      params['occupation-concept-id'].forEach((id: string) => searchParams.append('occupation-concept-id', id))
    }
    if (params['location-concept-id']) {
      params['location-concept-id'].forEach((id: string) => searchParams.append('location-concept-id', id))
    }

    // Make request to Jobstream API from server-side (no CORS issues)
    const response = await fetch(`https://jobstream.api.jobtechdev.se/stream?${searchParams}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "KarriärAI/1.0",
      },
    })

    if (!response.ok) {
      throw new Error(`Jobstream API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error in jobs stream API route:", error)
    
    // Return error response
    return NextResponse.json(
      { error: "Failed to fetch jobs from Jobstream API" },
      { status: 500 }
    )
  }
} 