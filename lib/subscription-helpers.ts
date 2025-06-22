import { supabase } from './supabase'

// Subscription tiers
export type SubscriptionTier = 'free' | 'pro' | 'enterprise'
export type SubscriptionStatus = 'free' | 'active' | 'canceled' | 'lifetime'

export interface SubscriptionInfo {
  subscription_tier: SubscriptionTier
  subscription_status: SubscriptionStatus
  lifetime_access: boolean
  extra_cv_credits: number
  export_credits: number
  stripe_customer_id?: string
}

export interface SubscriptionLimits {
  cvs: number // -1 for unlimited
  exports: number // -1 for unlimited
  ai_features: boolean
  priority_support: boolean
  team_management: boolean
  bulk_export: boolean
  api_access: boolean
  custom_templates: boolean
}

// Hämta användarens subscription information
export async function getUserSubscriptionInfo(userId: string): Promise<SubscriptionInfo | null> {
  try {
    const { data, error } = await supabase.rpc('get_user_subscription_info', {
      user_id_param: userId
    })

    if (error) {
      console.error('Error fetching subscription info:', error)
      return null
    }

    return data?.[0] || null
  } catch (error) {
    console.error('Error in getUserSubscriptionInfo:', error)
    return null
  }
}

// Uppdatera användarens subscription tier
export async function updateUserSubscriptionTier(
  userId: string, 
  tier: SubscriptionTier,
  isLifetime: boolean = false,
  stripeCustomerId?: string
): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('update_user_subscription_tier', {
      user_id_param: userId,
      new_tier: tier,
      is_lifetime: isLifetime,
      stripe_customer_id_param: stripeCustomerId
    })

    if (error) {
      console.error('Error updating subscription tier:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in updateUserSubscriptionTier:', error)
    return false
  }
}

// Kontrollera subscription limits för en specifik funktion
export async function checkSubscriptionLimits(
  userId: string, 
  featureType: 'cvs' | 'exports' | 'ai_features'
): Promise<any> {
  try {
    const { data, error } = await supabase.rpc('check_subscription_limits', {
      user_id_param: userId,
      feature_type: featureType
    })

    if (error) {
      console.error('Error checking subscription limits:', error)
      return { allowed: false, reason: 'Database error' }
    }

    return data
  } catch (error) {
    console.error('Error in checkSubscriptionLimits:', error)
    return { allowed: false, reason: 'System error' }
  }
}

// Konsumera en credit (CV eller export)
export async function consumeCredit(
  userId: string, 
  creditType: 'cv' | 'export'
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('consume_credit', {
      user_id_param: userId,
      credit_type: creditType
    })

    if (error) {
      console.error('Error consuming credit:', error)
      return false
    }

    return data === true
  } catch (error) {
    console.error('Error in consumeCredit:', error)
    return false
  }
}

// Hämta subscription limits baserat på tier
export function getSubscriptionLimits(tier: SubscriptionTier, isLifetime: boolean = false): SubscriptionLimits {
  const baseAccess = tier !== 'free' || isLifetime

  switch (tier) {
    case 'free':
      return {
        cvs: 1,
        exports: 0,
        ai_features: false,
        priority_support: false,
        team_management: false,
        bulk_export: false,
        api_access: false,
        custom_templates: false
      }
    
    case 'pro':
      return {
        cvs: -1, // unlimited
        exports: -1, // unlimited
        ai_features: true,
        priority_support: true,
        team_management: false,
        bulk_export: false,
        api_access: false,
        custom_templates: false
      }
    
    case 'enterprise':
      return {
        cvs: -1, // unlimited
        exports: -1, // unlimited
        ai_features: true,
        priority_support: true,
        team_management: true,
        bulk_export: true,
        api_access: true,
        custom_templates: true
      }
    
    default:
      return getSubscriptionLimits('free')
  }
}

// Kontrollera om användaren har tillgång till en specifik funktion
export function hasFeatureAccess(
  subscriptionInfo: SubscriptionInfo, 
  feature: keyof SubscriptionLimits
): boolean {
  const limits = getSubscriptionLimits(
    subscriptionInfo.subscription_tier, 
    subscriptionInfo.lifetime_access
  )
  
  return limits[feature] === true || limits[feature] === -1
}

// Hämta eller skapa Stripe customer ID
export async function getOrCreateStripeCustomer(
  userId: string, 
  email: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('get_or_create_stripe_customer', {
      user_id_param: userId,
      email_param: email
    })

    if (error) {
      console.error('Error getting Stripe customer:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getOrCreateStripeCustomer:', error)
    return null
  }
}

// Spara Stripe customer ID
export async function saveStripeCustomerId(
  userId: string, 
  customerId: string
): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('save_stripe_customer_id', {
      user_id_param: userId,
      customer_id_param: customerId
    })

    if (error) {
      console.error('Error saving Stripe customer ID:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in saveStripeCustomerId:', error)
    return false
  }
}

// Lägg till CV credits
export async function addCVCredits(userId: string, credits: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('karriar_profiles')
      .update({ 
        extra_cv_credits: supabase.raw(`extra_cv_credits + ${credits}`),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('Error adding CV credits:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in addCVCredits:', error)
    return false
  }
}

// Lägg till export credits
export async function addExportCredits(userId: string, credits: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('karriar_profiles')
      .update({ 
        export_credits: supabase.raw(`export_credits + ${credits}`),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('Error adding export credits:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in addExportCredits:', error)
    return false
  }
}

// Hämta användarens betalningshistorik
export async function getUserPayments(userId: string) {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching payments:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getUserPayments:', error)
    return []
  }
}

// Kontrollera om användaren kan skapa fler CV:n
export async function canCreateCV(userId: string): Promise<{ allowed: boolean; reason?: string; requiresPayment?: boolean }> {
  const limits = await checkSubscriptionLimits(userId, 'cvs')
  
  if (limits.allowed) {
    return { allowed: true }
  }

  if (limits.reason === 'CV limit reached') {
    return { 
      allowed: false, 
      reason: 'Du har nått gränsen för antalet CV:n i din plan',
      requiresPayment: true
    }
  }

  return { 
    allowed: false, 
    reason: limits.reason || 'Okänt fel'
  }
}

// Kontrollera om användaren kan exportera
export async function canExport(userId: string): Promise<{ allowed: boolean; reason?: string; requiresPayment?: boolean }> {
  const limits = await checkSubscriptionLimits(userId, 'exports')
  
  if (limits.allowed) {
    return { allowed: true }
  }

  if (limits.reason === 'No export credits available') {
    return { 
      allowed: false, 
      reason: 'Du har inga export-credits kvar',
      requiresPayment: true
    }
  }

  return { 
    allowed: false, 
    reason: limits.reason || 'Okänt fel'
  }
} 