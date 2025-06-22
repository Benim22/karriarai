"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertTriangle, Loader2, Database } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function PaymentSystemSetupPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const runMigration = async () => {
    setLoading(true)
    setError("")
    setSuccess(false)
    setLogs([])

    try {
      addLog("Startar migrering av betalningssystem...")

      // Step 1: Create payment records for existing users
      addLog("Skapar betalningsrecord för befintliga användare...")
      
      const { data: existingUsers, error: usersError } = await supabase
        .from('karriar_profiles')
        .select('id, subscription_tier')

      if (usersError) {
        throw new Error(`Fel vid hämtning av användare: ${usersError.message}`)
      }

      addLog(`Hittade ${existingUsers?.length || 0} användare`)

      // Check which users already have payment records
      const { data: existingPayments, error: paymentsError } = await supabase
        .from('payments')
        .select('user_id')

      if (paymentsError) {
        throw new Error(`Fel vid hämtning av betalningar: ${paymentsError.message}`)
      }

      const existingPaymentUserIds = new Set(existingPayments?.map(p => p.user_id) || [])
      const usersNeedingPaymentRecords = existingUsers?.filter(user => !existingPaymentUserIds.has(user.id)) || []

      addLog(`${usersNeedingPaymentRecords.length} användare behöver betalningsrecord`)

      // Create payment records for users who don't have them
      if (usersNeedingPaymentRecords.length > 0) {
        const paymentRecords = usersNeedingPaymentRecords.map(user => ({
          user_id: user.id,
          amount: 0,
          currency: 'SEK',
          status: 'succeeded',
          subscription_tier: user.subscription_tier || 'free'
        }))

        const { error: insertError } = await supabase
          .from('payments')
          .insert(paymentRecords)

        if (insertError) {
          throw new Error(`Fel vid skapande av betalningsrecord: ${insertError.message}`)
        }

        addLog(`Skapade ${paymentRecords.length} betalningsrecord`)
      }

      // Step 2: Update the trigger function
      addLog("Uppdaterar trigger-funktion...")
      
      const triggerFunction = `
        CREATE OR REPLACE FUNCTION public.handle_new_karriar_user()
        RETURNS TRIGGER AS $$
        BEGIN
            -- Create profile
            INSERT INTO public.karriar_profiles (id, email, full_name)
            VALUES (
                NEW.id,
                NEW.email,
                COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
            );
            
            -- Create initial payment record to track subscription status
            INSERT INTO public.payments (
                user_id,
                amount,
                currency,
                status,
                subscription_tier
            ) VALUES (
                NEW.id,
                0, -- Initial free tier has no cost
                'SEK',
                'succeeded', -- Free tier is automatically "succeeded"
                'free' -- Start with free tier
            );
            
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `

      const { error: functionError } = await supabase.rpc('exec_sql', { sql: triggerFunction })
      
      if (functionError) {
        addLog(`Varning: Kunde inte uppdatera trigger-funktion: ${functionError.message}`)
      } else {
        addLog("Trigger-funktion uppdaterad")
      }

      // Step 3: Create helper functions
      addLog("Skapar hjälpfunktioner...")
      
      const helperFunctions = `
        -- Function to get current subscription tier from payments table
        CREATE OR REPLACE FUNCTION get_user_subscription_tier(user_uuid UUID)
        RETURNS TEXT AS $$
        DECLARE
            tier TEXT;
        BEGIN
            -- Get the most recent payment record for the user
            SELECT subscription_tier INTO tier
            FROM payments 
            WHERE user_id = user_uuid 
            AND subscription_tier IS NOT NULL
            ORDER BY created_at DESC 
            LIMIT 1;
            
            -- If no payment record found, return 'free'
            RETURN COALESCE(tier, 'free');
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Function to update subscription tier
        CREATE OR REPLACE FUNCTION update_user_subscription_tier(user_uuid UUID, new_tier TEXT)
        RETURNS VOID AS $$
        BEGIN
            -- Insert new payment record with the new subscription tier
            INSERT INTO payments (
                user_id,
                amount,
                currency,
                status,
                subscription_tier
            ) VALUES (
                user_uuid,
                CASE 
                    WHEN new_tier = 'free' THEN 0
                    WHEN new_tier = 'pro' THEN 9900 -- 99 SEK in öre
                    WHEN new_tier = 'enterprise' THEN 29900 -- 299 SEK in öre
                    ELSE 0
                END,
                'SEK',
                'succeeded',
                new_tier
            );
            
            -- Also update the karriar_profiles for backward compatibility
            UPDATE karriar_profiles 
            SET 
                subscription_tier = new_tier,
                updated_at = NOW()
            WHERE id = user_uuid;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `

      const { error: helpersError } = await supabase.rpc('exec_sql', { sql: helperFunctions })
      
      if (helpersError) {
        addLog(`Varning: Kunde inte skapa hjälpfunktioner: ${helpersError.message}`)
      } else {
        addLog("Hjälpfunktioner skapade")
      }

      addLog("Migrering slutförd framgångsrikt!")
      setSuccess(true)

    } catch (error: any) {
      console.error("Migration error:", error)
      setError(error.message)
      addLog(`FEL: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Betalningssystem Setup</h1>
          <p className="text-muted-foreground">
            Uppdatera systemet så att subscription_tier hanteras via payments tabellen
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Databasmigrering
            </CardTitle>
            <CardDescription>
              Denna migrering kommer att:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Skapa betalningsrecord för alla befintliga användare</li>
                <li>Uppdatera trigger-funktionen för nya registreringar</li>
                <li>Skapa hjälpfunktioner för prenumerationshantering</li>
                <li>Sätta upp systemet så att payments tabellen är källan till sanning</li>
              </ul>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Migreringen slutfördes framgångsrikt! Betalningssystemet är nu uppdaterat.
                </AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={runMigration} 
              disabled={loading || success}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {success ? "Migrering slutförd" : "Kör migrering"}
            </Button>

            {logs.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Migreringsloggar:</h3>
                <div className="bg-muted p-4 rounded-md max-h-64 overflow-y-auto">
                  <pre className="text-sm">
                    {logs.join('\n')}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 