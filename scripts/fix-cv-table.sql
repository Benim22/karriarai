-- Fix CV table structure to match application expectations
-- This ensures the CVs table works correctly with the CV builder

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- First, ensure cv_templates table exists
CREATE TABLE IF NOT EXISTS cv_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    is_premium BOOLEAN DEFAULT false,
    template_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drop and recreate cvs table to ensure consistency
DROP TABLE IF EXISTS cvs CASCADE;

-- Create CVs table with correct structure
CREATE TABLE cvs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL DEFAULT 'Mitt CV',
    content JSONB DEFAULT '{}',
    template_id UUID,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create export history table
CREATE TABLE IF NOT EXISTS export_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    cv_id UUID REFERENCES cvs(id) ON DELETE CASCADE NOT NULL,
    export_type TEXT NOT NULL CHECK (export_type IN ('pdf', 'docx', 'png', 'jpg')),
    file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cvs_user_id ON cvs(user_id);
CREATE INDEX IF NOT EXISTS idx_cvs_template_id ON cvs(template_id);
CREATE INDEX IF NOT EXISTS idx_export_history_user_id ON export_history(user_id);
CREATE INDEX IF NOT EXISTS idx_export_history_cv_id ON export_history(cv_id);

-- Enable RLS
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for CVs
CREATE POLICY "Users can view own CVs" ON cvs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own CVs" ON cvs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own CVs" ON cvs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own CVs" ON cvs FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Public CVs are viewable" ON cvs FOR SELECT USING (is_public = true);

-- Create RLS policies for CV templates (public read access)
CREATE POLICY "CV templates are viewable by everyone" ON cv_templates FOR SELECT USING (true);

-- Create RLS policies for export history
CREATE POLICY "Users can view own export history" ON export_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create export history" ON export_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION handle_cvs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS handle_cvs_updated_at ON cvs;
CREATE TRIGGER handle_cvs_updated_at 
    BEFORE UPDATE ON cvs 
    FOR EACH ROW 
    EXECUTE FUNCTION handle_cvs_updated_at();

-- Insert default CV templates
INSERT INTO cv_templates (id, name, description, category, is_premium, template_data) 
VALUES 
    ('modern-minimalist', 'Modern Minimalist', 'En ren och modern CV-mall', 'modern', false, '{}'),
    ('classic-professional', 'Classic Professional', 'En klassisk och professionell CV-mall', 'traditional', false, '{}'),
    ('creative-design', 'Creative Design', 'En kreativ och färgglad CV-mall', 'creative', false, '{}'),
    ('executive-premium', 'Executive Premium', 'En premium CV-mall för ledande befattningar', 'premium', true, '{}')
ON CONFLICT (id) DO NOTHING; 