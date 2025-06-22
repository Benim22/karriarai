# Stripe Webhooks för KarriärAI

Detta dokument beskriver alla Stripe webhooks som behöver konfigureras för att KarriärAI betalningssystemet ska fungera korrekt.

## Webhook Endpoint URL
```
https://www.karriarai.se/api/webhook/stripe
```

## Obligatoriska Webhook Events

### 1. Prenumerationer (Subscriptions)

#### `customer.subscription.created`
- **När**: En ny prenumeration skapas
- **Syfte**: Skapa prenumerationspost i databasen
- **Hanteras av**: `/api/webhook/stripe/route.ts`

#### `customer.subscription.updated`
- **När**: Prenumeration uppdateras (plan ändras, status ändras)
- **Syfte**: Uppdatera prenumerationsstatus och tier i databasen
- **Hanteras av**: `/api/webhook/stripe/route.ts`

#### `customer.subscription.deleted`
- **När**: Prenumeration avbryts eller upphör
- **Syfte**: Sätta subscription_tier till 'free' och status till 'canceled'
- **Hanteras av**: `/api/webhook/stripe/route.ts`

#### `invoice.payment_succeeded`
- **När**: Framgångsrik betalning för prenumeration
- **Syfte**: Förnya prenumeration, uppdatera status till 'active'
- **Hanteras av**: `/api/webhook/stripe/route.ts`

#### `invoice.payment_failed`
- **När**: Misslyckad betalning för prenumeration
- **Syfte**: Hantera misslyckade betalningar, eventuellt sätta status till 'past_due'
- **Hanteras av**: `/api/webhook/stripe/route.ts`

### 2. Engångsbetalningar (One-time Payments)

#### `checkout.session.completed`
- **När**: Checkout session slutförs framgångsrikt
- **Syfte**: Hantera alla typer av betalningar (prenumerationer, livstidsköp, engångsköp)
- **Hanteras av**: `/api/webhook/stripe/route.ts`

#### `payment_intent.succeeded`
- **När**: Engångsbetalning genomförd framgångsrikt
- **Syfte**: Lägga till krediter eller aktivera livstidstillgång
- **Hanteras av**: `/api/webhook/stripe/route.ts`

#### `payment_intent.payment_failed`
- **När**: Engångsbetalning misslyckades
- **Syfte**: Logga misslyckade betalningar för felsökning
- **Hanteras av**: `/api/webhook/stripe/route.ts`

### 3. Kunder (Customers)

#### `customer.created`
- **När**: Ny Stripe-kund skapas
- **Syfte**: Länka Stripe customer ID till användarprofil
- **Hanteras av**: `/api/webhook/stripe/route.ts`

#### `customer.updated`
- **När**: Kundinformation uppdateras
- **Syfte**: Synkronisera kundinformation
- **Hanteras av**: `/api/webhook/stripe/route.ts`

### 4. Återbetalningar (Refunds)

#### `charge.dispute.created`
- **När**: Kund skapar en tvist/chargeback
- **Syfte**: Hantera tvister och eventuellt återkalla tillgång
- **Hanteras av**: `/api/webhook/stripe/route.ts`

#### `invoice.payment_action_required`
- **När**: Ytterligare åtgärd krävs för betalning (3D Secure)
- **Syfte**: Informera användaren om att slutföra betalning
- **Hanteras av**: `/api/webhook/stripe/route.ts`

## Webhook Konfiguration i Stripe Dashboard

### Steg 1: Skapa Webhook Endpoint
1. Gå till Stripe Dashboard → Developers → Webhooks
2. Klicka "Add endpoint"
3. Lägg till URL: `https://www.karriarai.se/api/webhook/stripe`
4. Välj "Latest API version"

### Steg 2: Lägg till Events
Lägg till följande events:
```
customer.subscription.created
customer.subscription.updated  
customer.subscription.deleted
invoice.payment_succeeded
invoice.payment_failed
checkout.session.completed
payment_intent.succeeded
payment_intent.payment_failed
customer.created
customer.updated
charge.dispute.created
invoice.payment_action_required
```

### Steg 3: Hämta Webhook Secret
1. Klicka på din webhook endpoint
2. Gå till "Signing secret" sektionen
3. Klicka "Reveal" och kopiera nyckeln
4. Lägg till i `.env.local` som `STRIPE_WEBHOOK_SECRET`

## Environment Variables som behövs

```env
# Stripe Keys
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase (för databasuppdateringar)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Testning av Webhooks

### Lokal testning med Stripe CLI
```bash
# Installera Stripe CLI
# Logga in
stripe login

# Vidarebefordra webhooks till lokal server
stripe listen --forward-to localhost:3000/api/webhook/stripe

# Testa specifika events
stripe trigger customer.subscription.created
stripe trigger checkout.session.completed
stripe trigger payment_intent.succeeded
```

### Produktionstestning
1. Använd Stripe test mode
2. Skapa test-betalningar via din applikation
3. Kontrollera webhook logs i Stripe Dashboard
4. Verifiera att databasuppdateringar sker korrekt

## Felsökning

### Vanliga problem:
1. **Webhook timeout**: Webhook måste svara inom 20 sekunder
2. **Fel webhook secret**: Kontrollera att `STRIPE_WEBHOOK_SECRET` är korrekt
3. **Databas connection error**: Kontrollera Supabase-anslutning
4. **Duplicate events**: Webhooks kan skickas flera gånger, använd idempotency

### Loggar att övervaka:
- Stripe Dashboard → Webhooks → Endpoint → Logs
- Vercel/server logs för `/api/webhook/stripe`
- Supabase database logs för betalningsuppdateringar

## Säkerhet

1. **Webhook signature verification**: Implementerat i `/api/webhook/stripe/route.ts`
2. **HTTPS endast**: Stripe kräver HTTPS för webhooks
3. **IP allowlist**: Valfritt, Stripe webhook IP-adresser
4. **Rate limiting**: Implementera om nödvändigt

## Backup och Monitoring

1. **Webhook logs**: Spara alla webhook events i databasen för audit
2. **Failed webhook retry**: Stripe försöker igen automatiskt
3. **Monitoring alerts**: Sätt upp alerts för misslyckade webhooks
4. **Manual sync**: Implementera manuell synkronisering för edge cases 