import { NextRequest, NextResponse } from "next/server"
import { supabase } from '@/lib/supabase'

// GET /api/enterprise/cvs - List all CVs for Enterprise users
export async function GET(request: NextRequest) {
  try {
    // Check API key for Enterprise users
    const apiKey = request.headers.get('X-API-Key')
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key required" },
        { status: 401 }
      )
    }

    // Find user by API key
    const { data: profile, error: profileError } = await supabase
      .from("karriar_profiles")
      .select("id, subscription_tier")
      .eq("api_key", apiKey)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 401 }
      )
    }

    // Check if user has Enterprise subscription
    if (profile.subscription_tier !== 'enterprise') {
      return NextResponse.json(
        { error: "Enterprise subscription required" },
        { status: 403 }
      )
    }

    // Get query parameters
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const status = url.searchParams.get('status')

    // Build query
    let query = supabase
      .from("cvs")
      .select("id, title, created_at, updated_at, data, template_id")
      .eq("user_id", profile.id)
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq("status", status)
    }

    const { data: cvs, error: cvsError } = await query

    if (cvsError) {
      return NextResponse.json(
        { error: "Failed to fetch CVs" },
        { status: 500 }
      )
    }

    // Get total count
    const { count } = await supabase
      .from("cvs")
      .select("*", { count: 'exact', head: true })
      .eq("user_id", profile.id)

    return NextResponse.json({
      cvs,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })

  } catch (error) {
    console.error("Enterprise API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/enterprise/cvs - Create CV via API
export async function POST(request: NextRequest) {
  try {
    // Check API key
    const apiKey = request.headers.get('X-API-Key')
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key required" },
        { status: 401 }
      )
    }

    // Find user by API key
    const { data: profile, error: profileError } = await supabase
      .from("karriar_profiles")
      .select("id, subscription_tier")
      .eq("api_key", apiKey)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 401 }
      )
    }

    if (profile.subscription_tier !== 'enterprise') {
      return NextResponse.json(
        { error: "Enterprise subscription required" },
        { status: 403 }
      )
    }

    const { title, data, templateId } = await request.json()

    if (!title || !data) {
      return NextResponse.json(
        { error: "Title and data are required" },
        { status: 400 }
      )
    }

    // Create CV
    const { data: cv, error: createError } = await supabase
      .from("cvs")
      .insert({
        user_id: profile.id,
        title,
        data,
        template_id: templateId || 'traditional',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      return NextResponse.json(
        { error: "Failed to create CV" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      cv
    })

  } catch (error) {
    console.error("Enterprise API create error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 