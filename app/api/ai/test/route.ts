import { NextRequest, NextResponse } from 'next/server'
import { improveTextWithAI } from '@/lib/ai-service'

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Test endpoint only available in development' },
      { status: 403 }
    )
  }

  try {
    console.log('🧪 Testing AI service...')
    
    const testText = "Jag arbetar med webbutveckling och har erfarenhet av JavaScript."
    const result = await improveTextWithAI(testText, 'summary')
    
    return NextResponse.json({
      success: true,
      original: testText,
      improved: result,
      apiKeyConfigured: !!process.env.GOOGLE_GEMINI_API_KEY,
      apiKeyLength: process.env.GOOGLE_GEMINI_API_KEY?.length || 0,
      model: 'gemini-1.5-pro'
    })

  } catch (error) {
    console.error('❌ AI test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      apiKeyConfigured: !!process.env.GOOGLE_GEMINI_API_KEY,
      apiKeyLength: process.env.GOOGLE_GEMINI_API_KEY?.length || 0
    })
  }
} 