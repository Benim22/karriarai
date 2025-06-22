import { NextRequest, NextResponse } from "next/server"
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user from request headers
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: "Unauthorized - Bearer token required" },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get user profile to check subscription tier
    const { data: profile } = await supabase
      .from("karriar_profiles")
      .select("subscription_tier")
      .eq("id", user.id)
      .single()

    // Check if user has Enterprise subscription
    if (profile?.subscription_tier !== 'enterprise') {
      return NextResponse.json(
        { error: "Bulk export is only available for Enterprise users" },
        { status: 403 }
      )
    }

    const { cvIds, format } = await request.json()

    if (!cvIds || !Array.isArray(cvIds) || cvIds.length === 0) {
      return NextResponse.json(
        { error: "CV IDs are required" },
        { status: 400 }
      )
    }

    if (!format || !['pdf', 'docx', 'json'].includes(format)) {
      return NextResponse.json(
        { error: "Invalid format. Supported formats: pdf, docx, json" },
        { status: 400 }
      )
    }

    // Get CVs data
    const { data: cvs, error: cvsError } = await supabase
      .from("cvs")
      .select("*")
      .in("id", cvIds)
      .eq("user_id", user.id)

    if (cvsError) {
      return NextResponse.json(
        { error: "Failed to fetch CVs" },
        { status: 500 }
      )
    }

    // Log the bulk export
    await supabase
      .from("export_history")
      .insert({
        user_id: user.id,
        export_type: `bulk_${format}`,
        cv_count: cvs.length,
        created_at: new Date().toISOString()
      })

    // In a real implementation, you would:
    // 1. Process each CV and convert to the requested format
    // 2. Create a ZIP file containing all exports
    // 3. Upload to cloud storage
    // 4. Return download URL

    // For now, return success with mock data
    return NextResponse.json({
      success: true,
      message: `Successfully prepared ${cvs.length} CVs for bulk export`,
      downloadUrl: `/api/download/bulk-export-${Date.now()}.zip`,
      exportId: `bulk_${Date.now()}`,
      cvCount: cvs.length,
      format
    })

  } catch (error) {
    console.error("Bulk export error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 