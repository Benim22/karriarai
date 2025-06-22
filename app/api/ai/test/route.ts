import { NextRequest, NextResponse } from 'next/server'
import { testCreateUserProfile } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing createUserProfileManually function...')
    const result = await testCreateUserProfile()
    
    return NextResponse.json({
      success: true,
      result: result,
      message: result ? 'Profile creation test passed' : 'Profile creation test failed'
    })
  } catch (error: any) {
    console.error('Test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      details: error
    }, { status: 500 })
  }
} 