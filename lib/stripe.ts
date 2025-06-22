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
  oneTimeExport: {
    name: "Engångsexport",
    price: 1900, // 19 SEK in öre
    currency: "SEK",
    features: ["Export av 1 CV", "PNG, JPG eller Word", "Högkvalitativ export"],
  },
  mini: {
    name: "Mini",
    price: 4900, // 49 SEK per month
    currency: "SEK",
    interval: "month",
    features: ["Obegränsade CV", "3 mallar", "Obegränsade exporter", "Jobbmatchning"],
    limits: {
      cvs: -1, // unlimited
      exports: -1,
      templates: ["traditional", "modern"],
    },
  },
  pro: {
    name: "Pro",
    price: 9900, // 99 SEK per month
    currency: "SEK",
    interval: "month",
    features: ["Allt i Mini", "Alla mallar", "AI-optimering", "Prioriterad support"],
    limits: {
      cvs: -1,
      exports: -1,
      templates: ["traditional", "modern", "creative"],
    },
  },
  premium: {
    name: "Premium",
    price: 19900, // 199 SEK per month
    currency: "SEK",
    interval: "month",
    features: ["Allt i Pro", "Anpassade mallar", "Bulk export", "Dedikerad support", "Extra exportformat"],
    limits: {
      cvs: -1,
      exports: -1,
      templates: ["traditional", "modern", "creative", "custom"],
    },
  },
}
