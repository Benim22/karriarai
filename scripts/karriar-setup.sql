-- KarriärAI Database Setup Script
-- Kör detta i din Supabase SQL Editor för att konfigurera databasen

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create KarriärAI Profiles table (separate from existing profiles table)
CREATE TABLE IF NOT EXISTS karriar_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    
    -- Role and permissions
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator', 'recruiter')),
    
    -- Subscription
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'premium', 'enterprise')),
    subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'canceled', 'past_due', 'trialing')),
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
    experience_level TEXT CHECK (experience_level IN ('junior', 'mid', 'senior', 'lead', 'executive')),
    skills TEXT[],
    industries TEXT[],
    
    -- Job search preferences
    job_search_status TEXT DEFAULT 'not_looking' CHECK (job_search_status IN ('actively_looking', 'open_to_offers', 'not_looking')),
    preferred_salary_min INTEGER,
    preferred_salary_max INTEGER,
    preferred_locations TEXT[],
    remote_work_preference TEXT DEFAULT 'hybrid' CHECK (remote_work_preference IN ('remote', 'hybrid', 'onsite', 'flexible')),
    
    -- Settings
    email_notifications BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    profile_visibility TEXT DEFAULT 'private' CHECK (profile_visibility IN ('public', 'private', 'recruiters_only')),
    
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
    subscription_tier TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job Matches table
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

-- Enable RLS
ALTER TABLE karriar_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_templates ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies (avoid recursion)
CREATE POLICY "Users can manage own profile" ON karriar_profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage own CVs" ON cvs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public CVs are viewable" ON cvs FOR SELECT USING (is_public = true);
CREATE POLICY "Users can view own export history" ON export_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create export records" ON export_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create payments" ON payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own job matches" ON job_matches FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Templates are viewable by all" ON cv_templates FOR SELECT TO authenticated USING (true);

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
CREATE TRIGGER handle_cv_templates_updated_at BEFORE UPDATE ON cv_templates FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Insert default CV templates
INSERT INTO cv_templates (name, description, category, is_premium, template_data) VALUES
('Modern Professional', 'En ren och modern design perfekt för IT och konsulting', 'professional', false, '{"layout": "modern", "colors": ["#2563eb", "#1e40af"], "sections": ["header", "summary", "experience", "education", "skills"]}'),
('Creative Designer', 'Kreativ layout för designers och marknadsförare', 'creative', true, '{"layout": "creative", "colors": ["#7c3aed", "#5b21b6"], "sections": ["header", "portfolio", "experience", "education", "skills"]}'),
('Executive Leadership', 'Professionell design för chefer och ledare', 'executive', true, '{"layout": "executive", "colors": ["#1f2937", "#374151"], "sections": ["header", "summary", "leadership", "experience", "education"]}'),
('Academic Research', 'Strukturerad layout för forskare och akademiker', 'academic', false, '{"layout": "academic", "colors": ["#059669", "#047857"], "sections": ["header", "education", "research", "publications", "experience"]}'),
('Tech Specialist', 'Teknisk design för utvecklare och ingenjörer', 'tech', false, '{"layout": "tech", "colors": ["#dc2626", "#b91c1c"], "sections": ["header", "skills", "projects", "experience", "education"]}'),
('Sales & Marketing', 'Dynamisk design för säljare och marknadsförare', 'sales', true, '{"layout": "sales", "colors": ["#ea580c", "#c2410c"], "sections": ["header", "achievements", "experience", "education", "skills"]}')
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Verify setup
SELECT 
    'karriar_profiles' as table_name, 
    COUNT(*) as row_count 
FROM karriar_profiles
UNION ALL
SELECT 
    'cv_templates' as table_name, 
    COUNT(*) as row_count 
FROM cv_templates; 