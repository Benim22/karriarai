-- Cleanup script för att fixa dubblerade RLS policies och säkerhetsproblem
-- Detta script löser konflikter mellan olika policies

-- 1. Rensa dubblerade CV templates policies
DROP POLICY IF EXISTS "CV templates are viewable by everyone" ON cv_templates;
DROP POLICY IF EXISTS "Templates are viewable by all" ON cv_templates;

-- Skapa en konsistent policy för CV templates
CREATE POLICY "cv_templates_public_read" ON cv_templates 
FOR SELECT TO authenticated USING (true);

-- 2. Rensa dubblerade CVs policies och förbättra säkerheten
DROP POLICY IF EXISTS "Users can manage own CVs" ON cvs;
DROP POLICY IF EXISTS "Users can create own CVs" ON cvs;
DROP POLICY IF EXISTS "Users can update own CVs" ON cvs;
DROP POLICY IF EXISTS "Users can delete own CVs" ON cvs;
DROP POLICY IF EXISTS "Users can view own CVs" ON cvs;

-- Skapa säkra och specifika policies för CVs
CREATE POLICY "cvs_select_own" ON cvs 
FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "cvs_insert_own" ON cvs 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cvs_update_own" ON cvs 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "cvs_delete_own" ON cvs 
FOR DELETE USING (auth.uid() = user_id);

-- 3. Rensa dubblerade payments policies
DROP POLICY IF EXISTS "Users can create payments" ON payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON payments;

-- Skapa säker payments policy
CREATE POLICY "payments_select_own" ON payments 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "payments_insert_own" ON payments 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Förbättra export_history policies
DROP POLICY IF EXISTS "Users can create export history" ON export_history;
DROP POLICY IF EXISTS "Users can create export records" ON export_history;

CREATE POLICY "export_history_select_own" ON export_history 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "export_history_insert_own" ON export_history 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Lägg till säkerhetsindex för prestanda och säkerhet
CREATE INDEX IF NOT EXISTS idx_karriar_profiles_role_tier ON karriar_profiles(role, subscription_tier);
CREATE INDEX IF NOT EXISTS idx_payments_status_tier ON payments(status, subscription_tier);
CREATE INDEX IF NOT EXISTS idx_cvs_user_public ON cvs(user_id, is_public);

-- 6. Säkerhetsförbättringar för admin-funktioner
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM karriar_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Förbättra trigger-säkerhet
CREATE OR REPLACE FUNCTION secure_handle_new_karriar_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Validera input
    IF NEW.email IS NULL OR NEW.email = '' THEN
        RAISE EXCEPTION 'Email cannot be null or empty';
    END IF;
    
    -- Förhindra duplicering
    IF EXISTS (SELECT 1 FROM karriar_profiles WHERE id = NEW.id) THEN
        RETURN NEW; -- Profil finns redan
    END IF;
    
    -- Skapa profil med säkra defaults
    INSERT INTO public.karriar_profiles (
        id, 
        email, 
        full_name,
        role,
        subscription_tier,
        subscription_status,
        extra_cv_credits,
        export_credits,
        lifetime_access,
        email_notifications,
        marketing_emails,
        profile_visibility,
        job_search_status,
        remote_work_preference,
        onboarding_completed
    )
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        'user', -- Säker default
        'free',
        'free',
        0,
        0,
        false,
        true,
        false, -- Viktigt: opt-in för marketing
        'private', -- Säker default
        'not_looking',
        'hybrid',
        false
    );
    
    -- Skapa initial payment record
    INSERT INTO public.payments (
        user_id,
        amount,
        currency,
        status,
        subscription_tier,
        plan_type,
        billing_interval
    )
    VALUES (
        NEW.id,
        0,
        'SEK',
        'succeeded',
        'free',
        'free',
        'none'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Uppdatera triggern
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION secure_handle_new_karriar_user();

-- 8. Lägg till audit-loggning för säkerhetsövervakning
CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID,
    action TEXT NOT NULL,
    table_name TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aktivera RLS på audit log
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Endast admins kan läsa audit logs
CREATE POLICY "audit_log_admin_only" ON security_audit_log 
FOR ALL USING (is_admin());

COMMENT ON TABLE security_audit_log IS 'Säkerhetslogg för att spåra kritiska ändringar i systemet'; 