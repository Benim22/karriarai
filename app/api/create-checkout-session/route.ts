import { NextRequest, NextResponse } from 'next/server'
import { stripe, PRICING_PLANS } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { type, email, quantity = 1 } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    let priceData
    let metadata: Record<string, string> = {
      email,
      type
    }

    if (type === 'one-time-cv') {
      // Engångsbetalning för extra CV
      priceData = {
        currency: 'sek',
        product_data: {
          name: 'Extra CV',
          description: 'Skapa ett extra CV utöver din gratis plan',
        },
        unit_amount: 1900, // 19 SEK i öre
      }
      metadata.quantity = quantity.toString()
    } else {
      return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 })
    }

    // Skapa Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: priceData,
          quantity: quantity,
        },
      ],
      mode: 'payment', // Engångsbetalning
      success_url: `${req.nextUrl.origin}/dashboard?payment=success&type=${type}`,
      cancel_url: `${req.nextUrl.origin}/dashboard?payment=cancelled`,
      customer_email: email,
      metadata,
    })

    // Spara betalningsinformation i databasen (kommer att uppdateras via webhook)
    // Vi sparar minimal information här, resten hanteras i webhook
    console.log('Checkout session created:', session.id)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
} 