import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'
import { updateUserSubscriptionTier } from '@/lib/subscription-helpers'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  try {
    // Check if Stripe is available
    if (!stripe) {
      console.warn('Stripe webhook received but Stripe is not configured')
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not set')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    const body = await req.text()
    const signature = req.headers.get('stripe-signature')!

    let event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log('Webhook event received:', event.type)

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object)
        break
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object)
        break
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object)
        break
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(event.data.object)
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
    const metadata = session.metadata || {}
    const planType = metadata.planType
    const subscriptionTier = metadata.subscriptionTier || 'free'
    const isLifetime = metadata.isLifetime === 'true'
    
    if (!customerEmail) {
      console.error('No customer email found in session')
      return
    }

    // Find user by email
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

    // Handle different payment types
    if (planType === 'extra_cv') {
      // Extra CV credit
      await grantExtraCVCredit(foundUser.id)
    } else if (planType === 'single_export') {
      // Single export credit
      await grantExportCredit(foundUser.id)
    } else if (isLifetime) {
      // Lifetime subscription
      await grantLifetimeAccess(foundUser.id, subscriptionTier, session)
    } else if (session.mode === 'subscription') {
      // Monthly subscription - will be handled by subscription events
      console.log('Monthly subscription created, will be handled by subscription events')
    } else {
      // One-time payment for subscription tier
      await updateUserSubscriptionTier(foundUser.id, subscriptionTier)
    }

    // Save payment record
    await savePaymentRecord(foundUser.id, session, planType, subscriptionTier)

    console.log('Payment processed successfully for user:', foundUser.id, 'Plan:', planType)
  } catch (error) {
    console.error('Error handling checkout completed:', error)
  }
}

async function handlePaymentSucceeded(paymentIntent: any) {
  try {
    console.log('Payment succeeded:', paymentIntent.id)
    
    // Update payment status if it exists in database
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

async function handleInvoicePaymentSucceeded(invoice: any) {
  try {
    console.log('Invoice payment succeeded:', invoice.id)
    
    // Handle recurring subscription payments
    if (!stripe) return
    
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription)
    if (subscription && subscription.metadata) {
      const subscriptionTier = subscription.metadata.subscriptionTier
      const customerEmail = subscription.metadata.email
      
      if (customerEmail && subscriptionTier) {
        const { data: user } = await supabase.auth.admin.listUsers()
        const foundUser = user?.users.find(u => u.email === customerEmail)
        
        if (foundUser) {
          await updateUserSubscriptionTier(foundUser.id, subscriptionTier)
          console.log('Recurring payment processed for user:', foundUser.id)
        }
      }
    }
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error)
  }
}

async function handleSubscriptionChange(subscription: any) {
  try {
    console.log('Subscription changed:', subscription.id, subscription.status)
    
    const metadata = subscription.metadata || {}
    const customerEmail = metadata.email
    const subscriptionTier = metadata.subscriptionTier
    
    if (customerEmail && subscriptionTier) {
      const { data: user } = await supabase.auth.admin.listUsers()
      const foundUser = user?.users.find(u => u.email === customerEmail)
      
      if (foundUser) {
        if (subscription.status === 'active') {
          await updateUserSubscriptionTier(foundUser.id, subscriptionTier)
        }
        console.log('Subscription status updated for user:', foundUser.id, 'Status:', subscription.status)
      }
    }
  } catch (error) {
    console.error('Error handling subscription change:', error)
  }
}

async function handleSubscriptionCancelled(subscription: any) {
  try {
    console.log('Subscription cancelled:', subscription.id)
    
    const metadata = subscription.metadata || {}
    const customerEmail = metadata.email
    
    if (customerEmail) {
      const { data: user } = await supabase.auth.admin.listUsers()
      const foundUser = user?.users.find(u => u.email === customerEmail)
      
      if (foundUser) {
        // Downgrade to free tier
        await updateUserSubscriptionTier(foundUser.id, 'free')
        console.log('User downgraded to free tier:', foundUser.id)
      }
    }
  } catch (error) {
    console.error('Error handling subscription cancellation:', error)
  }
}

async function grantExtraCVCredit(userId: string) {
  try {
    // Get current credits
    const { data: profile, error: profileError } = await supabase
      .from('karriar_profiles')
      .select('extra_cv_credits')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return
    }

    // Add 1 extra CV credit
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

async function grantExportCredit(userId: string) {
  try {
    // Add export credit to user profile
    const { data: profile, error: profileError } = await supabase
      .from('karriar_profiles')
      .select('export_credits')
      .eq('id', userId)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching user profile:', profileError)
      return
    }

    const currentCredits = profile?.export_credits || 0
    const { error: updateError } = await supabase
      .from('karriar_profiles')
      .update({ 
        export_credits: currentCredits + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating export credits:', updateError)
      return
    }

    console.log(`Granted 1 export credit to user ${userId}. Total credits: ${currentCredits + 1}`)
  } catch (error) {
    console.error('Error granting export credit:', error)
  }
}

async function grantLifetimeAccess(userId: string, subscriptionTier: string, session: any) {
  try {
    // Update user to lifetime access
    const { error: updateError } = await supabase
      .from('karriar_profiles')
      .update({ 
        subscription_tier: subscriptionTier,
        subscription_status: 'lifetime',
        lifetime_access: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error granting lifetime access:', updateError)
      return
    }

    console.log(`Granted lifetime ${subscriptionTier} access to user ${userId}`)
  } catch (error) {
    console.error('Error granting lifetime access:', error)
  }
}

async function savePaymentRecord(userId: string, session: any, planType: string, subscriptionTier: string) {
  try {
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        stripe_payment_intent_id: session.payment_intent,
        amount: session.amount_total,
        currency: session.currency?.toUpperCase() || 'SEK',
        status: 'succeeded',
        subscription_tier: subscriptionTier,
        metadata: {
          planType,
          sessionId: session.id,
          mode: session.mode
        }
      })

    if (paymentError) {
      console.error('Error saving payment:', paymentError)
    } else {
      console.log('Payment record saved successfully')
    }
  } catch (error) {
    console.error('Error saving payment record:', error)
  }
} 