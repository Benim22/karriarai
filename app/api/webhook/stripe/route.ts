import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')!

    let event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Hantera olika event typer
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object)
        break
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutCompleted(session: any) {
  try {
    console.log('Checkout completed:', session.id)
    
    const customerEmail = session.customer_email
    const paymentType = session.metadata?.type
    
    if (!customerEmail) {
      console.error('No customer email found in session')
      return
    }

    // Hitta användaren baserat på email
    const { data: user, error: userError } = await supabase.auth.admin.listUsers()
    if (userError) {
      console.error('Error fetching users:', userError)
      return
    }

    const foundUser = user.users.find(u => u.email === customerEmail)
    if (!foundUser) {
      console.error('User not found for email:', customerEmail)
      return
    }

    // Spara betalningen i databasen
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: foundUser.id,
        stripe_payment_intent_id: session.payment_intent,
        amount: session.amount_total,
        currency: session.currency?.toUpperCase() || 'SEK',
        status: 'succeeded',
        subscription_tier: paymentType === 'one-time-cv' ? null : paymentType
      })

    if (paymentError) {
      console.error('Error saving payment:', paymentError)
      return
    }

    // Om det är en engångsbetalning för extra CV, uppdatera användarens credits
    if (paymentType === 'one-time-cv') {
      await grantExtraCVCredit(foundUser.id)
    }

    console.log('Payment processed successfully for user:', foundUser.id)
  } catch (error) {
    console.error('Error handling checkout completed:', error)
  }
}

async function handlePaymentSucceeded(paymentIntent: any) {
  try {
    console.log('Payment succeeded:', paymentIntent.id)
    
    // Uppdatera betalningsstatus om den finns i databasen
    const { error } = await supabase
      .from('payments')
      .update({ status: 'succeeded' })
      .eq('stripe_payment_intent_id', paymentIntent.id)

    if (error) {
      console.error('Error updating payment status:', error)
    }
  } catch (error) {
    console.error('Error handling payment succeeded:', error)
  }
}

async function grantExtraCVCredit(userId: string) {
  try {
    // Kontrollera om användaren redan har extra CV credits
    const { data: profile, error: profileError } = await supabase
      .from('karriar_profiles')
      .select('extra_cv_credits')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return
    }

    // Lägg till 1 extra CV credit
    const currentCredits = profile?.extra_cv_credits || 0
    const { error: updateError } = await supabase
      .from('karriar_profiles')
      .update({ 
        extra_cv_credits: currentCredits + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating CV credits:', updateError)
      return
    }

    console.log(`Granted 1 extra CV credit to user ${userId}. Total credits: ${currentCredits + 1}`)
  } catch (error) {
    console.error('Error granting extra CV credit:', error)
  }
} 