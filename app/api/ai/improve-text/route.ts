import { NextRequest, NextResponse } from 'next/server'
import { improveTextWithAI, AIImprovementContext } from '@/lib/ai-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, type, context } = body

    if (!text || !type) {
      return NextResponse.json(
        { error: 'Text och typ krävs' },
        { status: 400 }
      )
    }

    const validTypes = ['summary', 'experience', 'education', 'bio', 'job_title', 'message', 'search_query']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Ogiltig typ' },
        { status: 400 }
      )
    }

    const improvedText = await improveTextWithAI(text, type, context as AIImprovementContext)

    return NextResponse.json({ improvedText })

  } catch (error) {
    console.error('AI improvement error:', error)
    return NextResponse.json(
      { error: 'Något gick fel vid förbättring av text' },
      { status: 500 }
    )
  }
} 