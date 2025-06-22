-- Add API key support for Enterprise users
ALTER TABLE karriar_profiles 
ADD COLUMN IF NOT EXISTS api_key TEXT UNIQUE;

-- Add cv_count to export_history for bulk exports
ALTER TABLE export_history 
ADD COLUMN IF NOT EXISTS cv_count INTEGER DEFAULT 1;

-- Create custom_cv_templates table for Enterprise users
CREATE TABLE IF NOT EXISTS custom_cv_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  template_data JSONB NOT NULL,
  preview_image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team_members table for Enterprise team management
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES karriar_profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Create bulk_exports table for tracking bulk export jobs
CREATE TABLE IF NOT EXISTS bulk_exports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cv_ids UUID[] NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('pdf', 'docx', 'json')),
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  download_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create support_tickets table for priority support
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to TEXT,
  response_time_sla INTEGER, -- in hours
  resolution_time_sla INTEGER, -- in hours
  first_response_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create support_responses table
CREATE TABLE IF NOT EXISTS support_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for custom_cv_templates
ALTER TABLE custom_cv_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own custom templates" ON custom_cv_templates 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enterprise users can create custom templates" ON custom_cv_templates 
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM karriar_profiles 
    WHERE id = auth.uid() AND subscription_tier = 'enterprise'
  )
);

CREATE POLICY "Users can update own custom templates" ON custom_cv_templates 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom templates" ON custom_cv_templates 
FOR DELETE USING (auth.uid() = user_id);

-- Add RLS policies for team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view team members of their organization" ON team_members 
FOR SELECT USING (
  organization_id IN (
    SELECT id FROM karriar_profiles WHERE id = auth.uid()
  ) OR user_id = auth.uid()
);

CREATE POLICY "Organization admins can manage team members" ON team_members 
FOR ALL USING (
  organization_id IN (
    SELECT id FROM karriar_profiles 
    WHERE id = auth.uid() AND subscription_tier = 'enterprise'
  )
);

-- Add RLS policies for bulk_exports
ALTER TABLE bulk_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bulk exports" ON bulk_exports 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create bulk exports" ON bulk_exports 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add RLS policies for support_tickets
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own support tickets" ON support_tickets 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create support tickets" ON support_tickets 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own support tickets" ON support_tickets 
FOR UPDATE USING (auth.uid() = user_id);

-- Add RLS policies for support_responses
ALTER TABLE support_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view responses to their tickets" ON support_responses 
FOR SELECT USING (
  ticket_id IN (
    SELECT id FROM support_tickets WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create responses to their tickets" ON support_responses 
FOR INSERT WITH CHECK (
  ticket_id IN (
    SELECT id FROM support_tickets WHERE user_id = auth.uid()
  )
);

-- Add function to generate API keys
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS TEXT AS $$
BEGIN
  RETURN 'ka_' || encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Add function to auto-generate API key for Enterprise users
CREATE OR REPLACE FUNCTION auto_generate_api_key()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate API key when subscription tier is set to enterprise
  IF NEW.subscription_tier = 'enterprise' AND (OLD.subscription_tier IS NULL OR OLD.subscription_tier != 'enterprise') THEN
    NEW.api_key = generate_api_key();
  END IF;
  
  -- Remove API key when downgrading from enterprise
  IF OLD.subscription_tier = 'enterprise' AND NEW.subscription_tier != 'enterprise' THEN
    NEW.api_key = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto API key generation
DROP TRIGGER IF EXISTS auto_generate_api_key_trigger ON karriar_profiles;
CREATE TRIGGER auto_generate_api_key_trigger
  BEFORE UPDATE ON karriar_profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_api_key();

-- Add comments
COMMENT ON COLUMN karriar_profiles.api_key IS 'API key for Enterprise users to access programmatic endpoints';
COMMENT ON TABLE team_members IS 'Team members for Enterprise organizations';
COMMENT ON TABLE bulk_exports IS 'Bulk export jobs for Enterprise users';
COMMENT ON TABLE support_tickets IS 'Support tickets with priority levels based on subscription tier';
COMMENT ON TABLE support_responses IS 'Responses to support tickets from users and support team'; 