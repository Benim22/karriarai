"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, CheckCircle, XCircle, AlertTriangle, Database, Play, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase"

const SQL_SCRIPTS = {
  tables: `-- KarriärAI Database Schema
-- Kör detta först för att skapa alla tabeller

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator', 'recruiter');
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'premium', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'canceled', 'past_due', 'trialing');
CREATE TYPE experience_level AS ENUM ('junior', 'mid', 'senior', 'lead', 'executive');
CREATE TYPE job_search_status AS ENUM ('actively_looking', 'open_to_offers', 'not_looking');
CREATE TYPE remote_work_preference AS ENUM ('remote', 'hybrid', 'onsite', 'flexible');
CREATE TYPE profile_visibility AS ENUM ('public', 'private', 'recruiters_only');

-- KarriärAI Profiles table (extended user information)
CREATE TABLE IF NOT EXISTS karriar_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    
    -- Role and permissions
    role user_role DEFAULT 'user',
    permissions TEXT[],
    
    -- Subscription
    subscription_tier subscription_tier DEFAULT 'free',
    subscription_status subscription_status DEFAULT 'inactive',
    subscription_expires_at TIMESTAMPTZ,
    
    -- Contact information
    phone TEXT,
    location TEXT,
    bio TEXT,
    website TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    
    -- Professional information
    job_title TEXT,
    company TEXT,
    experience_level experience_level,
    skills TEXT[],
    industries TEXT[],
    
    -- Job search preferences
    job_search_status job_search_status DEFAULT 'not_looking',
    preferred_salary_min INTEGER,
    preferred_salary_max INTEGER,
    preferred_locations TEXT[],
    remote_work_preference remote_work_preference DEFAULT 'hybrid',
    
    -- Settings
    email_notifications BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    profile_visibility profile_visibility DEFAULT 'private',
    
    -- Payment
    stripe_customer_id TEXT,
    
    -- Metadata
    onboarding_completed BOOLEAN DEFAULT false,
    last_active_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CV Templates table
CREATE TABLE IF NOT EXISTS cv_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    preview_image_url TEXT,
    template_data JSONB,
    is_premium BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CVs table
CREATE TABLE IF NOT EXISTS cvs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES cv_templates(id),
    title TEXT NOT NULL,
    content JSONB,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Export History table
CREATE TABLE IF NOT EXISTS export_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    cv_id UUID REFERENCES cvs(id) ON DELETE CASCADE,
    export_type TEXT NOT NULL,
    file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_payment_intent_id TEXT,
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'SEK',
    status TEXT NOT NULL,
    subscription_tier subscription_tier,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job Matches table (for future AI matching feature)
CREATE TABLE IF NOT EXISTS job_matches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    job_title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT,
    salary_range TEXT,
    match_score DECIMAL(3,2),
    job_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_karriar_profiles_email ON karriar_profiles(email);
CREATE INDEX IF NOT EXISTS idx_karriar_profiles_role ON karriar_profiles(role);
CREATE INDEX IF NOT EXISTS idx_karriar_profiles_subscription_tier ON karriar_profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_cvs_user_id ON cvs(user_id);
CREATE INDEX IF NOT EXISTS idx_cvs_template_id ON cvs(template_id);
CREATE INDEX IF NOT EXISTS idx_export_history_user_id ON export_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_job_matches_user_id ON job_matches(user_id);

-- RLS (Row Level Security) Policies
ALTER TABLE karriar_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_matches ENABLE ROW LEVEL SECURITY;

-- KarriärAI Profiles policies
CREATE POLICY "Users can view own profile" ON karriar_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON karriar_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON karriar_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Recruiters can view public profiles" ON karriar_profiles FOR SELECT USING (
    profile_visibility = 'public' OR 
    (profile_visibility = 'recruiters_only' AND EXISTS (
        SELECT 1 FROM karriar_profiles WHERE id = auth.uid() AND role = 'recruiter'
    ))
);
CREATE POLICY "Admins can view all profiles" ON karriar_profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM karriar_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- CVs policies
CREATE POLICY "Users can manage own CVs" ON cvs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public CVs are viewable" ON cvs FOR SELECT USING (is_public = true);

-- Export history policies
CREATE POLICY "Users can view own export history" ON export_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create export records" ON export_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Payments policies
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create payments" ON payments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Job matches policies
CREATE POLICY "Users can manage own job matches" ON job_matches FOR ALL USING (auth.uid() = user_id);

-- Function to automatically create profile on user registration
CREATE OR REPLACE FUNCTION public.handle_new_karriar_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.karriar_profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user registration
DROP TRIGGER IF EXISTS on_auth_karriar_user_created ON auth.users;
CREATE TRIGGER on_auth_karriar_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_karriar_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER handle_karriar_profiles_updated_at BEFORE UPDATE ON karriar_profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER handle_cvs_updated_at BEFORE UPDATE ON cvs FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER handle_cv_templates_updated_at BEFORE UPDATE ON cv_templates FOR EACH ROW EXECUTE FUNCTION handle_updated_at();`,

  templates: `-- CV Templates Seed Data
-- Kör detta efter att tabellerna har skapats

INSERT INTO cv_templates (name, description, category, is_premium, template_data) VALUES
('Modern Professional', 'En ren och modern design perfekt för IT och konsulting', 'professional', false, '{"layout": "modern", "colors": ["#2563eb", "#1e40af"], "sections": ["header", "summary", "experience", "education", "skills"]}'),
('Creative Designer', 'Kreativ layout för designers och marknadsförare', 'creative', true, '{"layout": "creative", "colors": ["#7c3aed", "#5b21b6"], "sections": ["header", "portfolio", "experience", "education", "skills"]}'),
('Executive Leadership', 'Professionell design för chefer och ledare', 'executive', true, '{"layout": "executive", "colors": ["#1f2937", "#374151"], "sections": ["header", "summary", "leadership", "experience", "education"]}'),
('Academic Research', 'Strukturerad layout för forskare och akademiker', 'academic', false, '{"layout": "academic", "colors": ["#059669", "#047857"], "sections": ["header", "education", "research", "publications", "experience"]}'),
('Tech Specialist', 'Teknisk design för utvecklare och ingenjörer', 'tech', false, '{"layout": "tech", "colors": ["#dc2626", "#b91c1c"], "sections": ["header", "skills", "projects", "experience", "education"]}'),
('Sales & Marketing', 'Dynamisk design för säljare och marknadsförare', 'sales', true, '{"layout": "sales", "colors": ["#ea580c", "#c2410c"], "sections": ["header", "achievements", "experience", "education", "skills"]}');

-- Verify insertion
SELECT COUNT(*) as template_count FROM cv_templates;`,

  rls: `-- Additional RLS policies and security
-- Kör detta för extra säkerhet

-- Enable RLS on cv_templates (read-only for users)
ALTER TABLE cv_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Templates are viewable by all" ON cv_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can modify templates" ON cv_templates FOR ALL USING (
    EXISTS (SELECT 1 FROM karriar_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create function to check user permissions
CREATE OR REPLACE FUNCTION public.has_permission(permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM karriar_profiles 
        WHERE id = auth.uid() 
        AND (
            role = 'admin' OR 
            permission_name = ANY(permissions)
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`
}

export default function DatabaseSetupPage() {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [error, setError] = useState<string | null>(null)
  const [executionResults, setExecutionResults] = useState<{[key: string]: 'pending' | 'success' | 'error'}>({})
  const { toast } = useToast()

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from('karriar_profiles').select('count').limit(1)
      
      if (error) {
        if (error.code === '42P01') {
          setConnectionStatus('connected')
          setError('Tabeller existerar inte än. Kör SQL-skripten nedan.')
        } else {
          setConnectionStatus('error')
          setError(`Anslutningsfel: ${error.message}`)
        }
      } else {
        setConnectionStatus('connected')
        setError(null)
      }
    } catch (err) {
      setConnectionStatus('error')
      setError('Kunde inte ansluta till Supabase')
    }
  }

  const copyToClipboard = async (text: string, scriptName: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Kopierat!",
        description: `${scriptName} kopierat till urklipp`,
      })
    } catch (err) {
      toast({
        title: "Fel",
        description: "Kunde inte kopiera till urklipp",
        variant: "destructive"
      })
    }
  }

  const executeScript = async (scriptName: string, sql: string) => {
    setExecutionResults(prev => ({ ...prev, [scriptName]: 'pending' }))
    
    try {
      const supabase = createClient()
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql })
      
      if (error) {
        setExecutionResults(prev => ({ ...prev, [scriptName]: 'error' }))
        toast({
          title: "Fel vid körning",
          description: error.message,
          variant: "destructive"
        })
      } else {
        setExecutionResults(prev => ({ ...prev, [scriptName]: 'success' }))
        toast({
          title: "Framgång!",
          description: `${scriptName} kördes framgångsrikt`,
        })
        
        // Recheck connection after successful execution
        setTimeout(checkConnection, 1000)
      }
    } catch (err) {
      setExecutionResults(prev => ({ ...prev, [scriptName]: 'error' }))
      toast({
        title: "Fel",
        description: "Kunde inte köra SQL-skript",
        variant: "destructive"
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />
      default: return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    }
  }

  const getExecutionIcon = (result: string) => {
    switch (result) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending': return <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      default: return <Play className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Databassetup</h1>
        <p className="text-muted-foreground">
          Konfigurera din Supabase-databas för KarriärAI
        </p>
      </div>

      {/* Connection Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Anslutningsstatus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {getStatusIcon(connectionStatus)}
            <div>
              <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'}>
                {connectionStatus === 'connected' ? 'Ansluten' : 
                 connectionStatus === 'error' ? 'Fel' : 'Kontrollerar...'}
              </Badge>
              {error && (
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              )}
            </div>
            <Button onClick={checkConnection} variant="outline" size="sm">
              Kontrollera igen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Alert className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Viktigt:</strong> Kör skripten i ordning (1, 2, 3). Gå till din Supabase dashboard → SQL Editor och klistra in varje skript.
        </AlertDescription>
      </Alert>

      {/* SQL Scripts */}
      <Tabs defaultValue="tables" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tables">1. Tabeller & Schema</TabsTrigger>
          <TabsTrigger value="templates">2. CV-mallar</TabsTrigger>
          <TabsTrigger value="rls">3. Säkerhet & RLS</TabsTrigger>
        </TabsList>

        <TabsContent value="tables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Skapa tabeller och schema
              </CardTitle>
              <CardDescription>
                Detta skapar alla nödvändiga tabeller, typer och triggers för KarriärAI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button 
                  onClick={() => copyToClipboard(SQL_SCRIPTS.tables, "Tabeller & Schema")}
                  variant="outline"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Kopiera SQL
                </Button>
                <Button 
                  onClick={() => executeScript("Tabeller", SQL_SCRIPTS.tables)}
                  disabled={executionResults["Tabeller"] === 'pending'}
                  className="flex items-center gap-2"
                >
                  {getExecutionIcon(executionResults["Tabeller"])}
                  Kör automatiskt
                </Button>
              </div>
              <Textarea 
                value={SQL_SCRIPTS.tables} 
                readOnly 
                className="font-mono text-sm h-40"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Lägg till CV-mallar
              </CardTitle>
              <CardDescription>
                Detta lägger till standard CV-mallar som användare kan välja mellan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button 
                  onClick={() => copyToClipboard(SQL_SCRIPTS.templates, "CV-mallar")}
                  variant="outline"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Kopiera SQL
                </Button>
                <Button 
                  onClick={() => executeScript("Mallar", SQL_SCRIPTS.templates)}
                  disabled={executionResults["Mallar"] === 'pending'}
                  className="flex items-center gap-2"
                >
                  {getExecutionIcon(executionResults["Mallar"])}
                  Kör automatiskt
                </Button>
              </div>
              <Textarea 
                value={SQL_SCRIPTS.templates} 
                readOnly 
                className="font-mono text-sm h-32"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Säkerhetspolicies (RLS)
              </CardTitle>
              <CardDescription>
                Detta konfigurerar Row Level Security för att skydda användardata
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button 
                  onClick={() => copyToClipboard(SQL_SCRIPTS.rls, "RLS Policies")}
                  variant="outline"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Kopiera SQL
                </Button>
                <Button 
                  onClick={() => executeScript("RLS", SQL_SCRIPTS.rls)}
                  disabled={executionResults["RLS"] === 'pending'}
                  className="flex items-center gap-2"
                >
                  {getExecutionIcon(executionResults["RLS"])}
                  Kör automatiskt
                </Button>
              </div>
              <Textarea 
                value={SQL_SCRIPTS.rls} 
                readOnly 
                className="font-mono text-sm h-32"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Next Steps */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Nästa steg</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Kör alla tre SQL-skript i din Supabase SQL Editor</li>
            <li>Kontrollera att alla tabeller skapades korrekt</li>
            <li>Gå tillbaka till applikationen och logga in</li>
            <li>Din profil kommer automatiskt skapas vid första inloggningen</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
} 