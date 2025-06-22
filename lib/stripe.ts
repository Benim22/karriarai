import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

export const PRICING_PLANS = {
  free: {
    name: "Gratis",
    price: 0,
    features: ["1 CV", "Grundläggande mallar", "Förhandsvisning", "Ingen export"],
    limits: {
      cvs: 1,
      exports: 0,
      templates: ["traditional"],
    },
  },
  oneTimeCV: {
    name: "Extra CV",
    price: 1900, // 19 SEK in öre
    currency: "SEK",
    features: ["1 extra CV", "Alla mallar", "Obegränsade exporter"],
    description: "Köp ett extra CV för engångsbruk"
  },
  pro: {
    name: "Pro",
    price: 9900, // 99 SEK per month
    currency: "SEK",
    interval: "month",
    features: [
      "Obegränsat antal CV",
      "15+ professionella mallar", 
      "AI-optimering av innehåll",
      "Avancerad jobbmatchning",
      "Personlig karriärrådgivning",
      "Prioritetssupport",
      "Exportera till Word & PDF"
    ],
    limits: {
      cvs: -1, // unlimited
      exports: -1,
      templates: ["traditional", "modern", "creative"],
      priority_support: true,
      career_guidance: true,
      ai_optimization: true
    },
  },
  enterprise: {
    name: "Enterprise",
    price: 29900, // 299 SEK per month
    currency: "SEK",
    interval: "month",
    features: [
      "Allt i Pro",
      "Teamhantering",
      "Bulk CV-analys", 
      "Anpassade mallar",
      "API-åtkomst",
      "Dedikerad kontoansvarig",
      "SLA-garanti",
      "Anpassad integration"
    ],
    limits: {
      cvs: -1,
      exports: -1,
      templates: ["traditional", "modern", "creative", "custom"],
      team_management: true,
      bulk_analysis: true,
      api_access: true,
      custom_templates: true,
      dedicated_support: true,
      sla_guarantee: true,
      custom_integration: true
    },
  },
}

// Stripe Product IDs (dessa skulle sättas upp i Stripe Dashboard)
export const STRIPE_PRODUCTS = {
  oneTimeCV: process.env.STRIPE_ONE_TIME_CV_PRICE_ID || "price_one_time_cv",
  pro: process.env.STRIPE_PRO_PRICE_ID || "price_pro_monthly", 
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID || "price_enterprise_monthly"
}

// Helper function för att få plan baserat på subscription tier
export function getPlanByTier(tier: string) {
  switch (tier) {
    case 'free':
      return PRICING_PLANS.free
    case 'pro':
      return PRICING_PLANS.pro
    case 'enterprise':
      return PRICING_PLANS.enterprise
    default:
      return PRICING_PLANS.free
  }
}

// Helper function för att kontrollera funktioner baserat på prenumeration
export function hasFeature(tier: string, feature: string): boolean {
  const plan = getPlanByTier(tier)
  
  switch (feature) {
    case 'unlimited_cvs':
      return plan.limits?.cvs === -1
    case 'unlimited_exports':
      return plan.limits?.exports === -1
    case 'priority_support':
      return plan.limits?.priority_support === true
    case 'career_guidance':
      return plan.limits?.career_guidance === true
    case 'ai_optimization':
      return plan.limits?.ai_optimization === true
    case 'team_management':
      return plan.limits?.team_management === true
    case 'bulk_analysis':
      return plan.limits?.bulk_analysis === true
    case 'api_access':
      return plan.limits?.api_access === true
    case 'custom_templates':
      return plan.limits?.custom_templates === true
    case 'dedicated_support':
      return plan.limits?.dedicated_support === true
    case 'sla_guarantee':
      return plan.limits?.sla_guarantee === true
    case 'custom_integration':
      return plan.limits?.custom_integration === true
    default:
      return false
  }
}
