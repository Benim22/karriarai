import Stripe from "stripe"

// Check if Stripe keys are available
const hasStripeKeys = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_')

if (!hasStripeKeys && process.env.NODE_ENV === 'production') {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

// Initialize Stripe only if keys are available
export const stripe = hasStripeKeys 
  ? new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2024-12-18.acacia",
})
  : null

if (!hasStripeKeys) {
  console.warn('⚠️  Stripe not initialized: STRIPE_SECRET_KEY not found or invalid. Payment features will be disabled.')
}

// Stripe Price IDs - Replace these with your actual Price IDs from Stripe Dashboard
export const STRIPE_PRICES = {
  // Monthly subscriptions
  PRO_MONTHLY: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || "price_pro_monthly",
  ENTERPRISE_MONTHLY: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || "price_enterprise_monthly",
  
  // Lifetime subscriptions
  PRO_LIFETIME: process.env.STRIPE_PRO_LIFETIME_PRICE_ID || "price_pro_lifetime",
  ENTERPRISE_LIFETIME: process.env.STRIPE_ENTERPRISE_LIFETIME_PRICE_ID || "price_enterprise_lifetime",
  
  // One-time purchases
  EXTRA_CV_CREDIT: process.env.STRIPE_EXTRA_CV_PRICE_ID || "price_extra_cv",
  SINGLE_EXPORT: process.env.STRIPE_SINGLE_EXPORT_PRICE_ID || "price_single_export",
}

// Product configuration
export const PRICING_PLANS = {
  pro_monthly: {
    name: "Pro Monthly",
    price: 99,
    currency: "SEK",
    interval: "month",
    priceId: STRIPE_PRICES.PRO_MONTHLY,
    features: [
      "Unlimited CVs",
      "Priority support (4-8h response)",
      "Personal career guidance",
      "Premium CV templates",
      "Advanced AI features"
    ]
  },
  pro_lifetime: {
    name: "Pro Lifetime",
    price: 1990,
    currency: "SEK",
    interval: "lifetime",
    priceId: STRIPE_PRICES.PRO_LIFETIME,
    features: [
      "All Pro features",
      "Lifetime access",
      "No recurring payments",
      "Future feature updates included"
    ]
  },
  enterprise_monthly: {
    name: "Enterprise Monthly",
    price: 299,
    currency: "SEK",
    interval: "month",
    priceId: STRIPE_PRICES.ENTERPRISE_MONTHLY,
    features: [
      "Everything in Pro",
      "Team management",
      "Bulk CV export",
      "API access",
      "Custom templates",
      "Priority support (1-2h response)",
      "Dedicated account manager"
    ]
  },
  enterprise_lifetime: {
    name: "Enterprise Lifetime",
    price: 4990,
    currency: "SEK",
    interval: "lifetime",
    priceId: STRIPE_PRICES.ENTERPRISE_LIFETIME,
    features: [
      "All Enterprise features",
      "Lifetime access",
      "No recurring payments",
      "Future feature updates included"
    ]
  },
  extra_cv: {
    name: "Extra CV Credit",
    price: 19,
    currency: "SEK",
    interval: "one_time",
    priceId: STRIPE_PRICES.EXTRA_CV_CREDIT,
    features: [
      "Create 1 additional CV",
      "No recurring charges",
      "Instant access"
    ]
  },
  single_export: {
    name: "Single Export",
    price: 9,
    currency: "SEK",
    interval: "one_time",
    priceId: STRIPE_PRICES.SINGLE_EXPORT,
    features: [
      "Export 1 CV to PDF/DOCX",
      "High-quality format",
      "Instant download"
    ]
  }
}

export type PlanType = keyof typeof PRICING_PLANS

// Helper function to get plan details
export function getPlanDetails(planType: PlanType) {
  return PRICING_PLANS[planType]
}

// Helper function to determine subscription tier from plan
export function getSubscriptionTierFromPlan(planType: PlanType): string {
  if (planType.includes('pro')) return 'pro'
  if (planType.includes('enterprise')) return 'enterprise'
  return 'free'
}

// Helper function to check if plan is lifetime
export function isLifetimePlan(planType: PlanType): boolean {
  return planType.includes('lifetime')
}

// Helper function to get all subscription plans (excluding one-time purchases)
export function getSubscriptionPlans() {
  return Object.entries(PRICING_PLANS).filter(([key]) => 
    !key.includes('extra_cv') && !key.includes('single_export')
  )
}

// Helper function to get one-time purchase options
export function getOneTimePurchases() {
  return Object.entries(PRICING_PLANS).filter(([key]) => 
    key.includes('extra_cv') || key.includes('single_export')
  )
}
