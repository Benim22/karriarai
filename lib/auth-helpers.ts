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
    console.log('Creating profile manually for user:', userId, email)
    
    // Wait for user to be created in auth.users with retry logic
    let authUser = null
    let authError = null
    const maxRetries = 5
    const retryDelay = 1000 // 1 second
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`Attempt ${attempt}/${maxRetries}: Checking if user exists in auth.users...`)
      
      const result = await supabase
        .from('auth.users')
        .select('id, email')
        .eq('id', userId)
        .single()
      
      authUser = result.data
      authError = result.error
      
      if (authUser) {
        console.log('User found in auth.users:', authUser)
        break
      }
      
      if (attempt < maxRetries) {
        console.log(`User not found yet, waiting ${retryDelay}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      }
    }
    
    if (authError || !authUser) {
      console.error('User not found in auth.users after all retries:', {
        userId,
        authError,
        attempts: maxRetries,
        message: 'Cannot create profile - user must exist in auth.users first'
      })
      return false
    }
    
    console.log('User verified in auth.users after retries:', authUser)
    
    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('karriar_profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (existingProfile) {
      console.log('Profile already exists for user:', userId)
      return true
    }

    // Use the database function that can bypass RLS policies
    console.log('Calling fix_missing_profiles_complete function...')
    const { data: functionResult, error: functionError } = await supabase
      .rpc('fix_missing_profiles_complete')

    if (functionError) {
      console.error('Error calling fix_missing_profiles_complete:', {
        error: functionError,
        code: functionError.code,
        message: functionError.message,
        details: functionError.details,
        hint: functionError.hint
      })
      return false
    }

    console.log('fix_missing_profiles_complete result:', functionResult)

    // Verify that profile was created
    const { data: newProfile, error: verifyError } = await supabase
      .from('karriar_profiles')
      .select('id, email, full_name')
      .eq('id', userId)
      .single()

    if (verifyError || !newProfile) {
      console.error('Profile verification failed after function call:', verifyError)
      return false
    }

    console.log('Profile successfully created and verified:', newProfile)
    return true

  } catch (error) {
    console.error('Error in createUserProfileManually:', error)
    return false
  }
}

// Test function to verify createUserProfileManually works
export async function testCreateUserProfile() {
  try {
    console.log('Testing fix_missing_profiles_complete function...')
    
    // Just call the function directly - it will handle all users without profiles
    const { data: functionResult, error: functionError } = await supabase
      .rpc('fix_missing_profiles_complete')
    
    if (functionError) {
      console.error('❌ Test failed:', functionError)
      return false
    }
    
    console.log('✅ Test successful - fix_missing_profiles_complete executed')
    console.log('Results:', functionResult)
    
    return true
  } catch (error) {
    console.error('Error in test function:', error)
    return false
  }
} 