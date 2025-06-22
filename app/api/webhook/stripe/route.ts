import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'
import { updateUserSubscriptionTier } from '@/lib/subscription-helpers'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  console.log('🔥 WEBHOOK RECEIVED - Starting processing')
  
  try {
    // Check if Stripe is available
    if (!stripe) {
      console.warn('❌ Stripe webhook received but Stripe is not configured')
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }

    if (!webhookSecret) {
      console.error('❌ STRIPE_WEBHOOK_SECRET is not set')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    console.log('✅ Stripe and webhook secret are configured')

    const body = await req.text()
    const signature = req.headers.get('stripe-signature')!

    console.log('📝 Request body length:', body.length)
    console.log('🔐 Signature present:', !!signature)

    let event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log('✅ Webhook signature verified successfully')
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log('🎯 Webhook event received:', event.type)
    console.log('📊 Event data:', JSON.stringify(event.data.object, null, 2))

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('🛒 Processing checkout.session.completed')
        await handleCheckoutCompleted(event.data.object)
        break
      case 'payment_intent.succeeded':
        console.log('💳 Processing payment_intent.succeeded')
        await handlePaymentSucceeded(event.data.object)
        break
      case 'invoice.payment_succeeded':
        console.log('📄 Processing invoice.payment_succeeded')
        await handleInvoicePaymentSucceeded(event.data.object)
        break
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        console.log('📋 Processing subscription change:', event.type)
        await handleSubscriptionChange(event.data.object)
        break
      case 'customer.subscription.deleted':
        console.log('🗑️ Processing subscription deletion')
        await handleSubscriptionCancelled(event.data.object)
        break
      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`)
    }

    console.log('✅ Webhook processing completed successfully')
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('💥 Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutCompleted(session: any) {
  try {
    console.log('Checkout completed:', session.id)
    console.log('Session details:', {
      mode: session.mode,
      customer_email: session.customer_email,
      metadata: session.metadata,
      subscription: session.subscription,
      customer: session.customer
    })
    
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
      // Monthly subscription - update immediately since subscription is active
      console.log('Monthly subscription created, updating subscription tier immediately')
      await updateUserSubscriptionTier(foundUser.id, subscriptionTier, false, session.customer)
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
          await updateUserSubscriptionTier(foundUser.id, subscriptionTier, false, subscription.customer)
          
          // Also update the payments table with subscription info
          const { error: paymentUpdateError } = await supabase
            .from('payments')
            .update({
              subscription_tier: subscriptionTier,
              stripe_subscription_id: subscription.id,
              stripe_customer_id: subscription.customer,
              billing_interval: 'month',
              next_billing_date: new Date(subscription.current_period_end * 1000).toISOString()
            })
            .eq('user_id', foundUser.id)
            .eq('stripe_subscription_id', subscription.id)

          if (paymentUpdateError) {
            console.error('Error updating payment record:', paymentUpdateError)
          }
        }
        console.log('Subscription status updated for user:', foundUser.id, 'Status:', subscription.status, 'Tier:', subscriptionTier)
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
    const paymentData: any = {
      user_id: userId,
      amount: session.amount_total,
      currency: session.currency?.toUpperCase() || 'SEK',
      status: 'succeeded',
      subscription_tier: subscriptionTier,
      plan_type: planType,
      stripe_customer_id: session.customer,
      metadata: {
        planType,
        sessionId: session.id,
        mode: session.mode
      }
    }

    // Add subscription-specific fields for monthly plans
    if (session.mode === 'subscription') {
      paymentData.billing_interval = 'month'
      paymentData.stripe_subscription_id = session.subscription
    } else {
      paymentData.stripe_payment_intent_id = session.payment_intent
      paymentData.billing_interval = planType.includes('lifetime') ? 'lifetime' : 'none'
    }

    const { error: paymentError } = await supabase
      .from('payments')
      .insert(paymentData)

    if (paymentError) {
      console.error('Error saving payment:', paymentError)
    } else {
      console.log('Payment record saved successfully for plan:', planType)
    }
  } catch (error) {
    console.error('Error saving payment record:', error)
  }
} 