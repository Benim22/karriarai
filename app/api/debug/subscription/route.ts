import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { updateUserSubscriptionTier } from '@/lib/subscription-helpers'

export async function POST(request: NextRequest) {
  try {
    const { userId, email, subscriptionTier = 'pro' } = await request.json()

    if (!userId && !email) {
      return NextResponse.json({ error: 'userId or email required' }, { status: 400 })
    }

    let targetUserId = userId

    // If only email provided, find user by email
    if (!targetUserId && email) {
      const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
      if (usersError) {
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
      }

      const foundUser = users.users.find(u => u.email === email)
      if (!foundUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      targetUserId = foundUser.id
    }

    console.log('Debug: Updating subscription for user:', targetUserId, 'to tier:', subscriptionTier)

    // Update subscription tier
    const success = await updateUserSubscriptionTier(targetUserId, subscriptionTier)

    if (!success) {
      return NextResponse.json({ error: 'Failed to update subscription tier' }, { status: 500 })
    }

    // Get updated user info
    const { data: profile, error: profileError } = await supabase
      .from('karriar_profiles')
      .select('subscription_tier, subscription_status, lifetime_access')
      .eq('id', targetUserId)
      .single()

    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('subscription_tier, status, plan_type')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })
      .limit(3)

    return NextResponse.json({
      success: true,
      userId: targetUserId,
      profile: profile || null,
      profileError: profileError?.message || null,
      recentPayments: payments || [],
      paymentsError: paymentsError?.message || null
    })

  } catch (error) {
    console.error('Debug subscription error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const userId = searchParams.get('userId')

    if (!userId && !email) {
      return NextResponse.json({ error: 'userId or email required' }, { status: 400 })
    }

    let targetUserId = userId

    // If only email provided, find user by email
    if (!targetUserId && email) {
      const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
      if (usersError) {
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
      }

      const foundUser = users.users.find(u => u.email === email)
      if (!foundUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      targetUserId = foundUser.id
    }

    // Get current user info
    const { data: profile, error: profileError } = await supabase
      .from('karriar_profiles')
      .select('*')
      .eq('id', targetUserId)
      .single()

    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      userId: targetUserId,
      profile: profile || null,
      profileError: profileError?.message || null,
      payments: payments || [],
      paymentsError: paymentsError?.message || null
    })

  } catch (error) {
    console.error('Debug subscription GET error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 