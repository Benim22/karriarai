import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { email, subscriptionTier = 'pro' } = await req.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    console.log('🔧 Manual update for:', email, 'to tier:', subscriptionTier)

    // Update karriar_profiles
    const { error: profileError } = await supabase
      .from('karriar_profiles')
      .update({ 
        subscription_tier: subscriptionTier,
        subscription_status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('email', email)

    if (profileError) {
      console.error('❌ Error updating profile:', profileError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    // Update payments table
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: (await supabase.from('karriar_profiles').select('id').eq('email', email).single()).data?.id,
        amount: 9900,
        currency: 'SEK',
        status: 'succeeded',
        subscription_tier: subscriptionTier,
        plan_type: 'monthly_subscription',
        billing_interval: 'month',
        stripe_customer_id: 'manual-test',
        metadata: { manual: true }
      })

    if (paymentError) {
      console.error('❌ Error adding payment:', paymentError)
    }

    console.log('✅ Manual update completed')

    return NextResponse.json({ 
      success: true, 
      message: `Updated ${email} to ${subscriptionTier}` 
    })

  } catch (error) {
    console.error('💥 Manual update error:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
} 