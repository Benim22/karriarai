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
  
  // Common auth errors
  const errorMessages: { [key: string]: string } = {
    'AuthSessionMissingError': 'Session saknas. Vänligen logga in igen.',
    'AuthInvalidTokenError': 'Ogiltig token. Vänligen logga in igen.',
    'AuthTokenExpiredError': 'Session har gått ut. Vänligen logga in igen.',
    'invalid_credentials': 'Felaktiga inloggningsuppgifter.',
    'email_not_confirmed': 'Email inte bekräftad. Kontrollera din email.',
    'too_many_requests': 'För många försök. Vänta en stund och försök igen.',
    'signup_disabled': 'Registrering är inte tillgänglig för tillfället.',
  }

  const errorCode = error.message || error.code || error.name
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