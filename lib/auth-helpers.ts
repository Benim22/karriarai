import { supabase } from './supabase'

export function clearLocalSession() {
  // Clear any local storage or session storage related to auth
  if (typeof window !== 'undefined') {
    try {
      // Clear Supabase auth tokens from localStorage
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key)
        }
      })
      
      // Clear session storage as well
      const sessionKeys = Object.keys(sessionStorage)
      sessionKeys.forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          sessionStorage.removeItem(key)
        }
      })
      
      console.log('Local session data cleared')
    } catch (error) {
      console.error('Error clearing local session:', error)
    }
  }
}

export async function refreshSession() {
  try {
    const { data, error } = await supabase.auth.refreshSession()
    if (error) {
      console.error('Error refreshing session:', error)
      return { success: false, error }
    }
    return { success: true, session: data.session }
  } catch (error) {
    console.error('Failed to refresh session:', error)
    return { success: false, error }
  }
}

export async function checkSession() {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      console.error('Error checking session:', error)
      return { success: false, error, session: null }
    }
    return { success: true, session: data.session, error: null }
  } catch (error) {
    console.error('Failed to check session:', error)
    return { success: false, error, session: null }
  }
}

export function handleAuthError(error: any): string {
  if (!error) return 'Okänt fel'
  
  // Check if it's a database error during user creation
  if (error.message && error.message.includes('Database error saving new user')) {
    return 'Registreringen lyckades men det uppstod ett problem med att skapa din profil. Kontakta support om problemet kvarstår.'
  }
  
  // Common auth errors
  const errorMessages: { [key: string]: string } = {
    'AuthSessionMissingError': 'Session saknas. Vänligen logga in igen.',
    'AuthInvalidTokenError': 'Ogiltig token. Vänligen logga in igen.',
    'AuthTokenExpiredError': 'Session har gått ut. Vänligen logga in igen.',
    'invalid_credentials': 'Felaktiga inloggningsuppgifter.',
    'email_not_confirmed': 'Email inte bekräftad. Kontrollera din email.',
    'too_many_requests': 'För många försök. Vänta en stund och försök igen.',
    'signup_disabled': 'Registrering är inte tillgänglig för tillfället.',
    'weak_password': 'Lösenordet är för svagt. Använd minst 6 tecken.',
    'email_already_in_use': 'Email-adressen används redan av ett annat konto.',
    'invalid_email': 'Ogiltig email-adress.',
  }

  const errorCode = error.message || error.code || error.name
  
  // Check for specific error patterns
  if (errorCode.includes('duplicate key') || errorCode.includes('already exists')) {
    return 'Ett konto med denna email-adress finns redan.'
  }
  
  if (errorCode.includes('Database error') || errorCode.includes('database')) {
    return 'Databasfel uppstod. Försök igen eller kontakta support.'
  }
  
  return errorMessages[errorCode] || `Autentiseringsfel: ${errorCode}`
}

export async function signOutSafely() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      // If session is already missing, consider it a successful logout
      if (error.message?.includes('Auth session missing') || 
          error.message?.includes('session missing') ||
          error.name === 'AuthSessionMissingError') {
        console.log('Session already missing during logout, treating as success')
        return { success: true }
      }
      console.error('Error signing out:', error)
      return { success: false, error: handleAuthError(error) }
    }
    return { success: true }
  } catch (error: any) {
    // Handle cases where session is already missing
    if (error.message?.includes('Auth session missing') || 
        error.message?.includes('session missing') ||
        error.name === 'AuthSessionMissingError') {
      console.log('Session already missing during logout, treating as success')
      return { success: true }
    }
    console.error('Failed to sign out:', error)
    return { success: false, error: 'Kunde inte logga ut' }
  }
}

// Helper function to create user profile manually if trigger fails
export async function createUserProfileManually(userId: string, email: string, fullName: string) {
  try {
    // Create profile
    const { error: profileError } = await supabase
      .from('karriar_profiles')
      .insert({
        id: userId,
        email: email,
        full_name: fullName,
        subscription_tier: 'free',
        subscription_status: 'free',
        extra_cv_credits: 0,
        export_credits: 0,
        lifetime_access: false
      })

    if (profileError) {
      console.error('Error creating profile manually:', profileError)
      return false
    }

    // Create payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        amount: 0,
        currency: 'SEK',
        status: 'succeeded',
        subscription_tier: 'free',
        plan_type: 'free',
        billing_interval: 'none'
      })

    if (paymentError) {
      console.error('Error creating payment record manually:', paymentError)
      // Don't fail if payment record creation fails
    }

    return true
  } catch (error) {
    console.error('Error in createUserProfileManually:', error)
    return false
  }
} 