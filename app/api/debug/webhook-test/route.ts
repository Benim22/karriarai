import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { updateUserSubscriptionTier } from '@/lib/subscription-helpers'

export async function POST(req: NextRequest) {
  try {
    const { email, subscriptionTier = 'pro' } = await req.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    console.log('🧪 Testing webhook logic for:', email, 'tier:', subscriptionTier)

    // Find user by email
    const { data: user, error: userError } = await supabase.auth.admin.listUsers()
    if (userError) {
      console.error('❌ Error fetching users:', userError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    const foundUser = user.users.find(u => u.email === email)
    if (!foundUser) {
      console.error('❌ User not found for email:', email)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('✅ Found user:', foundUser.id)

    // Test updating subscription tier
    await updateUserSubscriptionTier(foundUser.id, subscriptionTier, false, 'test-customer')

    // Test saving payment record
    const paymentData = {
      user_id: foundUser.id,
      amount: 9900, // 99 SEK
      currency: 'SEK',
      status: 'succeeded',
      subscription_tier: subscriptionTier,
      plan_type: 'monthly_subscription',
      stripe_customer_id: 'test-customer',
      billing_interval: 'month',
      stripe_subscription_id: 'test-subscription',
      metadata: {
        planType: 'monthly_subscription',
        test: true
      }
    }

    const { error: paymentError } = await supabase
      .from('payments')
      .insert(paymentData)

    if (paymentError) {
      console.error('❌ Error saving payment:', paymentError)
      return NextResponse.json({ error: 'Failed to save payment' }, { status: 500 })
    }

    console.log('✅ Test completed successfully')

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook logic tested successfully',
      userId: foundUser.id,
      subscriptionTier 
    })

  } catch (error) {
    console.error('💥 Test error:', error)
    return NextResponse.json({ error: 'Test failed' }, { status: 500 })
  }
} 