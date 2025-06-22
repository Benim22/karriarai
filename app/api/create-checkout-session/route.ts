import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_PRICES, getPlanDetails, getSubscriptionTierFromPlan, isLifetimePlan } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    // Check if Stripe is available
    if (!stripe) {
      return NextResponse.json({ 
        error: 'Payment system is not configured. Please contact support.' 
      }, { status: 503 })
    }

    const { planType, email, successUrl, cancelUrl } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (!planType) {
      return NextResponse.json({ error: 'Plan type is required' }, { status: 400 })
    }

    const planDetails = getPlanDetails(planType as any)
    if (!planDetails) {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 })
    }

    // Create metadata for the payment
    const metadata: Record<string, string> = {
      email,
      planType,
      subscriptionTier: getSubscriptionTierFromPlan(planType as any),
      isLifetime: isLifetimePlan(planType as any).toString()
    }

    // Determine session mode and line items
    let sessionMode: 'payment' | 'subscription' = 'payment'
    let lineItems: any[] = []

    if (planType.includes('monthly')) {
      // Monthly subscription
      sessionMode = 'subscription'
      lineItems = [{
        price: planDetails.priceId,
        quantity: 1,
      }]
    } else {
      // One-time payment (lifetime or single purchase)
      sessionMode = 'payment'
      lineItems = [{
        price_data: {
          currency: planDetails.currency.toLowerCase(),
          product_data: {
            name: planDetails.name,
            description: planDetails.features.join(', '),
          },
          unit_amount: planDetails.price * 100, // Convert to öre/cents
        },
        quantity: 1,
      }]
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: sessionMode,
      success_url: successUrl || `${req.nextUrl.origin}/dashboard?payment=success&plan=${planType}`,
      cancel_url: cancelUrl || `${req.nextUrl.origin}/priser?payment=cancelled`,
      customer_email: email,
      metadata,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      // Add subscription-specific settings
      ...(sessionMode === 'subscription' && {
        subscription_data: {
          metadata,
        },
      }),
    })

    console.log('Checkout session created:', {
      sessionId: session.id,
      planType,
      mode: sessionMode,
      amount: planDetails.price
    })

    return NextResponse.json({ 
      url: session.url,
      sessionId: session.id 
    })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

// Legacy support for old API format
export async function PUT(req: NextRequest) {
  try {
    const { type, email, quantity = 1 } = await req.json()

    // Map old types to new plan types
    const planTypeMap: Record<string, string> = {
      'one-time-cv': 'extra_cv',
      'single-export': 'single_export',
      'pro': 'pro_monthly',
      'enterprise': 'enterprise_monthly'
    }

    const planType = planTypeMap[type] || type

    return POST(req)
  } catch (error) {
    console.error('Error in legacy endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
} 