import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { email, subscriptionTier } = await req.json()
    
    if (!email || !subscriptionTier) {
      return NextResponse.json({ 
        error: 'Email and subscriptionTier are required' 
      }, { status: 400 })
    }

    console.log('🧪 DEBUG: Testing subscription update for:', email, 'to tier:', subscriptionTier)

    // Find user by email
    const { data: users, error: userError } = await supabase.auth.admin.listUsers()
    if (userError) {
      console.error('Error fetching users:', userError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    const foundUser = users.users.find(u => u.email === email)
    if (!foundUser) {
      return NextResponse.json({ 
        error: `User not found for email: ${email}` 
      }, { status: 404 })
    }

    console.log('✅ Found user:', foundUser.id)

    // Update subscription tier
    const { error: updateError } = await supabase
      .from('karriar_profiles')
      .update({
        subscription_tier: subscriptionTier,
        subscription_status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', foundUser.id)

    if (updateError) {
      console.error('❌ Error updating subscription:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update subscription', 
        details: updateError 
      }, { status: 500 })
    }

    // Also create/update payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: foundUser.id,
        amount: subscriptionTier === 'pro' ? 9900 : subscriptionTier === 'enterprise' ? 29900 : 0,
        currency: 'SEK',
        status: 'succeeded',
        subscription_tier: subscriptionTier,
        plan_type: `${subscriptionTier}_monthly`,
        billing_interval: 'month',
        metadata: {
          source: 'debug_endpoint',
          planType: `${subscriptionTier}_monthly`
        }
      })

    if (paymentError) {
      console.error('⚠️ Error creating payment record:', paymentError)
      // Don't fail the request since subscription update succeeded
    }

    console.log('✅ Successfully updated subscription tier to:', subscriptionTier)

    return NextResponse.json({ 
      success: true,
      message: `Successfully updated ${email} to ${subscriptionTier} tier`,
      userId: foundUser.id,
      subscriptionTier
    })

  } catch (error) {
    console.error('💥 Debug endpoint error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')
    
    if (!email) {
      return NextResponse.json({ 
        error: 'Email parameter is required' 
      }, { status: 400 })
    }

    // Find user by email
    const { data: users, error: userError } = await supabase.auth.admin.listUsers()
    if (userError) {
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    const foundUser = users.users.find(u => u.email === email)
    if (!foundUser) {
      return NextResponse.json({ 
        error: `User not found for email: ${email}` 
      }, { status: 404 })
    }

    // Get current subscription info
    const { data: profile, error: profileError } = await supabase
      .from('karriar_profiles')
      .select('subscription_tier, subscription_status, extra_cv_credits, export_credits, lifetime_access')
      .eq('id', foundUser.id)
      .single()

    if (profileError) {
      return NextResponse.json({ 
        error: 'Failed to fetch profile', 
        details: profileError 
      }, { status: 500 })
    }

    // Get recent payments
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', foundUser.id)
      .order('created_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      user: {
        id: foundUser.id,
        email: foundUser.email
      },
      profile,
      recentPayments: payments || []
    })

  } catch (error) {
    console.error('💥 Debug GET endpoint error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 