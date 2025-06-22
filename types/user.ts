export interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  
  // Role and permissions
  role: 'user' | 'admin' | 'moderator' | 'recruiter'
  permissions?: string[]
  
  // Subscription
  subscription_tier: 'free' | 'pro' | 'premium' | 'enterprise'
  subscription_status: 'active' | 'inactive' | 'canceled' | 'past_due' | 'trialing'
  subscription_expires_at?: string
  
  // Contact information
  phone?: string
  location?: string
  bio?: string
  website?: string
  linkedin_url?: string
  github_url?: string
  
  // Professional information
  job_title?: string
  company?: string
  experience_level?: 'junior' | 'mid' | 'senior' | 'lead' | 'executive'
  skills?: string[]
  industries?: string[]
  
  // Job search preferences
  job_search_status: 'actively_looking' | 'open_to_offers' | 'not_looking'
  preferred_salary_min?: number
  preferred_salary_max?: number
  preferred_locations?: string[]
  remote_work_preference: 'remote' | 'hybrid' | 'onsite' | 'flexible'
  
  // Settings
  email_notifications: boolean
  marketing_emails: boolean
  profile_visibility: 'public' | 'private' | 'recruiters_only'
  
  // Payment
  stripe_customer_id?: string
  
  // Metadata
  onboarding_completed: boolean
  last_active_at?: string
  created_at?: string
  updated_at?: string
}

export interface ExportHistory {
  id: string
  userId: string
  cvId: string
  exportType: "png" | "jpg" | "docx"
  fileUrl?: string
  createdAt: string
}

export interface Payment {
  id: string
  userId: string
  stripePaymentIntentId?: string
  amount: number
  currency: string
  status: "pending" | "succeeded" | "failed" | "canceled"
  paymentType: "one_time_export" | "subscription"
  metadata: Record<string, any>
  createdAt: string
}

export interface JobMatch {
  id: string
  userId: string
  jobId: string
  jobTitle: string
  employer?: string
  location?: string
  description?: string
  url?: string
  matchScore: number
  isSaved: boolean
  createdAt: string
}
