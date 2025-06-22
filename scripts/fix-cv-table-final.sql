-- Final CV table fix - corrected with proper UUIDs
-- This ensures the CVs table works correctly with the CV builder

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- cv_templates table already exists with UUID id, no need to recreate

-- CVs table already exists with correct structure, no need to recreate

-- Create export history table if it doesn't exist
CREATE TABLE IF NOT EXISTS export_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    cv_id UUID REFERENCES cvs(id) ON DELETE CASCADE NOT NULL,
    export_type TEXT NOT NULL CHECK (export_type IN ('pdf', 'docx', 'png', 'jpg')),
    file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_cvs_user_id ON cvs(user_id);
CREATE INDEX IF NOT EXISTS idx_cvs_template_id ON cvs(template_id);
CREATE INDEX IF NOT EXISTS idx_export_history_user_id ON export_history(user_id);
CREATE INDEX IF NOT EXISTS idx_export_history_cv_id ON export_history(cv_id);

-- Enable RLS (safe to run multiple times)
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might conflict, then recreate
DROP POLICY IF EXISTS "Users can view own CVs" ON cvs;
DROP POLICY IF EXISTS "Users can create own CVs" ON cvs;
DROP POLICY IF EXISTS "Users can update own CVs" ON cvs;
DROP POLICY IF EXISTS "Users can delete own CVs" ON cvs;
DROP POLICY IF EXISTS "Public CVs are viewable" ON cvs;
DROP POLICY IF EXISTS "CV templates are viewable by everyone" ON cv_templates;
DROP POLICY IF EXISTS "Users can view own export history" ON export_history;
DROP POLICY IF EXISTS "Users can create export history" ON export_history;

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

-- Trigger for updated_at (drop first to avoid conflicts)
DROP TRIGGER IF EXISTS handle_cvs_updated_at ON cvs;
CREATE TRIGGER handle_cvs_updated_at 
    BEFORE UPDATE ON cvs 
    FOR EACH ROW 
    EXECUTE FUNCTION handle_cvs_updated_at();

-- Insert default CV templates with proper UUIDs
INSERT INTO cv_templates (id, name, description, category, is_premium, template_data) 
VALUES 
    ('550e8400-e29b-41d4-a716-446655440001'::uuid, 'Modern Minimalist', 'En ren och modern CV-mall', 'modern', false, '{}'),
    ('550e8400-e29b-41d4-a716-446655440002'::uuid, 'Classic Professional', 'En klassisk och professionell CV-mall', 'traditional', false, '{}'),
    ('550e8400-e29b-41d4-a716-446655440003'::uuid, 'Creative Design', 'En kreativ och färgglad CV-mall', 'creative', false, '{}'),
    ('550e8400-e29b-41d4-a716-446655440004'::uuid, 'Executive Premium', 'En premium CV-mall för ledande befattningar', 'premium', true, '{}')
ON CONFLICT (id) DO NOTHING; 