import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { email, tier = 'pro' } = await req.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    console.log('🔧 Fixing subscription for:', email, 'to:', tier)

    // Hämta user ID först
    const { data: profile, error: profileFetchError } = await supabase
      .from('karriar_profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (profileFetchError || !profile) {
      console.error('❌ User not found:', email)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = profile.id

    // Uppdatera karriar_profiles
    const { error: updateError } = await supabase
      .from('karriar_profiles')
      .update({ 
        subscription_tier: tier,
        subscription_status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('❌ Error updating profile:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    // Lägg till ny payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        amount: tier === 'pro' ? 9900 : tier === 'enterprise' ? 29900 : 0,
        currency: 'SEK',
        status: 'succeeded',
        subscription_tier: tier,
        plan_type: 'monthly_subscription',
        billing_interval: 'month',
        stripe_customer_id: 'manual-fix',
        metadata: { 
          manual_fix: true,
          fixed_at: new Date().toISOString()
        }
      })

    if (paymentError) {
      console.error('⚠️ Payment insert failed (but profile updated):', paymentError)
    }

    console.log('✅ Subscription fixed successfully')

    return NextResponse.json({ 
      success: true, 
      message: `Fixed ${email} subscription to ${tier}`,
      userId 
    })

  } catch (error) {
    console.error('💥 Fix error:', error)
    return NextResponse.json({ 
      error: 'Fix failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint för att kolla status
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const email = url.searchParams.get('email')
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 })
    }

    const { data: profile, error } = await supabase
      .from('karriar_profiles')
      .select('email, subscription_tier, subscription_status, updated_at')
      .eq('email', email)
      .single()

    if (error || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(profile)

  } catch (error) {
    return NextResponse.json({ error: 'Check failed' }, { status: 500 })
  }
} 