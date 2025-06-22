import { supabase } from './supabase'

export async function setupSupabaseDatabase() {
  try {
    console.log('Setting up Supabase database...')

    // Test connection
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .single()

    if (testError && testError.code === '42P01') {
      console.log('Tables do not exist. Please run the SQL scripts in your Supabase dashboard.')
      console.log('1. Go to your Supabase project dashboard')
      console.log('2. Navigate to SQL Editor')
      console.log('3. Run the contents of scripts/01-create-tables.sql')
      console.log('4. Run the contents of scripts/02-seed-templates.sql')
      return false
    }

    if (testError) {
      console.error('Database connection error:', testError)
      return false
    }

    console.log('Database connection successful!')
    
    // Check if we have CV templates
    const { data: templates, error: templatesError } = await supabase
      .from('cv_templates')
      .select('count')

    if (templatesError) {
      console.error('Error checking templates:', templatesError)
      return false
    }

    console.log('Supabase setup completed successfully!')
    return true

  } catch (error) {
    console.error('Setup failed:', error)
    return false
  }
}

export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Supabase connection error:', error)
      return false
    }

    console.log('Supabase connection is working!')
    return true
  } catch (error) {
    console.error('Failed to connect to Supabase:', error)
    return false
  }
} 