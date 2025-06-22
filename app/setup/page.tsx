"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { CheckCircle, XCircle, Loader2, Database, Copy, ExternalLink } from "lucide-react"
import { setupSupabaseDatabase, checkSupabaseConnection } from "@/lib/setup-supabase"

export default function SetupPage() {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')
  const [setupStatus, setSetupStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    setConnectionStatus('checking')
    const isConnected = await checkSupabaseConnection()
    setConnectionStatus(isConnected ? 'connected' : 'disconnected')
  }

  const runSetup = async () => {
    setSetupStatus('running')
    setErrorMessage('')
    
    try {
      const success = await setupSupabaseDatabase()
      setSetupStatus(success ? 'success' : 'error')
      if (!success) {
        setErrorMessage('Setup failed. Please check the console for details.')
      }
    } catch (error) {
      setSetupStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const sqlScript1 = `-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table for user data
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'mini', 'pro', 'premium')),
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'canceled', 'past_due')),
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create CV templates table
CREATE TABLE cv_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('traditional', 'modern', 'creative')),
  preview_image TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  styles JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create CVs table
CREATE TABLE cvs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Mitt CV',
  template_id UUID REFERENCES cv_templates(id),
  content JSONB DEFAULT '{}',
  styles JSONB DEFAULT '{}',
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create export history table
CREATE TABLE export_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  cv_id UUID REFERENCES cvs(id) ON DELETE CASCADE NOT NULL,
  export_type TEXT NOT NULL CHECK (export_type IN ('png', 'jpg', 'docx')),
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'SEK',
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled')),
  payment_type TEXT NOT NULL CHECK (payment_type IN ('one_time_export', 'subscription')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job matches table
CREATE TABLE job_matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  job_id TEXT NOT NULL,
  job_title TEXT NOT NULL,
  employer TEXT,
  location TEXT,
  description TEXT,
  url TEXT,
  match_score INTEGER DEFAULT 0,
  is_saved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_matches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own CVs" ON cvs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own CVs" ON cvs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own CVs" ON cvs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own CVs" ON cvs FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own export history" ON export_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create export history" ON export_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create payments" ON payments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own job matches" ON job_matches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create job matches" ON job_matches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own job matches" ON job_matches FOR UPDATE USING (auth.uid() = user_id);

-- CV templates are public for reading
CREATE POLICY "CV templates are viewable by everyone" ON cv_templates FOR SELECT USING (true);`

  const sqlScript2 = `-- Insert default CV templates
INSERT INTO cv_templates (name, category, preview_image, is_premium, styles) VALUES
(
  'Klassisk Professionell',
  'traditional',
  '/templates/classic-professional.png',
  false,
  '{
    "fontFamily": "Inter",
    "fontSize": "14px",
    "primaryColor": "#1f2937",
    "secondaryColor": "#6b7280",
    "accentColor": "#3b82f6",
    "backgroundColor": "#ffffff",
    "headerStyle": "simple",
    "sectionSpacing": "medium"
  }'
),
(
  'Modern Minimalist',
  'modern',
  '/templates/modern-minimalist.png',
  false,
  '{
    "fontFamily": "Inter",
    "fontSize": "14px",
    "primaryColor": "#111827",
    "secondaryColor": "#6b7280",
    "accentColor": "#10b981",
    "backgroundColor": "#ffffff",
    "headerStyle": "modern",
    "sectionSpacing": "large"
  }'
),
(
  'Kreativ Designer',
  'creative',
  '/templates/creative-designer.png',
  true,
  '{
    "fontFamily": "Inter",
    "fontSize": "14px",
    "primaryColor": "#7c3aed",
    "secondaryColor": "#a78bfa",
    "accentColor": "#f59e0b",
    "backgroundColor": "#fefefe",
    "headerStyle": "creative",
    "sectionSpacing": "medium"
  }'
),
(
  'Teknisk Expert',
  'modern',
  '/templates/tech-expert.png',
  true,
  '{
    "fontFamily": "JetBrains Mono",
    "fontSize": "13px",
    "primaryColor": "#0f172a",
    "secondaryColor": "#475569",
    "accentColor": "#0ea5e9",
    "backgroundColor": "#ffffff",
    "headerStyle": "tech",
    "sectionSpacing": "compact"
  }'
);

-- Create function to handle user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Supabase Setup
            </h1>
            <p className="text-xl text-muted-foreground">
              Konfigurera din Supabase-databas för KarriärAI
            </p>
          </div>

          {/* Connection Status */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Anslutningsstatus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {connectionStatus === 'checking' && (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                    <span>Kontrollerar anslutning...</span>
                  </>
                )}
                {connectionStatus === 'connected' && (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-green-700 dark:text-green-400">Ansluten till Supabase</span>
                    <Badge variant="secondary">Redo</Badge>
                  </>
                )}
                {connectionStatus === 'disconnected' && (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="text-red-700 dark:text-red-400">Ej ansluten till Supabase</span>
                    <Badge variant="destructive">Konfiguration krävs</Badge>
                  </>
                )}
                <Button variant="outline" size="sm" onClick={checkConnection}>
                  Testa igen
                </Button>
              </div>
            </CardContent>
          </Card>

          {connectionStatus === 'disconnected' && (
            <Alert className="mb-8">
              <AlertDescription>
                <strong>Konfiguration krävs:</strong> Se till att du har lagt till dina Supabase-credentials i .env-filen:
                <br />
                <code className="text-sm">NEXT_PUBLIC_SUPABASE_URL=din-supabase-url</code>
                <br />
                <code className="text-sm">NEXT_PUBLIC_SUPABASE_ANON_KEY=din-anon-key</code>
              </AlertDescription>
            </Alert>
          )}

          {/* Setup Instructions */}
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Steg 1: Skapa tabeller</CardTitle>
                <CardDescription>
                  Kör detta SQL-skript i din Supabase SQL Editor för att skapa alla nödvändiga tabeller
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">01-create-tables.sql</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(sqlScript1)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Kopiera
                      </Button>
                    </div>
                    <pre className="text-xs overflow-x-auto max-h-40 text-muted-foreground">
                      {sqlScript1.substring(0, 200)}...
                    </pre>
                  </div>
                  <Button
                    variant="outline"
                    asChild
                  >
                    <a 
                      href="https://supabase.com/dashboard/project/_/sql"
                className="cursor-pointer" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Öppna Supabase SQL Editor
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Steg 2: Lägg till mallar och funktioner</CardTitle>
                <CardDescription>
                  Kör detta SQL-skript efter att tabellerna är skapade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">02-seed-templates.sql</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(sqlScript2)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Kopiera
                      </Button>
                    </div>
                    <pre className="text-xs overflow-x-auto max-h-40 text-muted-foreground">
                      {sqlScript2.substring(0, 200)}...
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Steg 3: Testa installationen</CardTitle>
                <CardDescription>
                  Kontrollera att allt är korrekt konfigurerat
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {setupStatus === 'error' && errorMessage && (
                    <Alert variant="destructive">
                      <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                  )}
                  
                  {setupStatus === 'success' && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Setup slutförd! Din Supabase-databas är redo att användas.
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    onClick={runSetup} 
                    disabled={setupStatus === 'running' || connectionStatus !== 'connected'}
                    className="w-full"
                  >
                    {setupStatus === 'running' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Testa databas-setup
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
} 