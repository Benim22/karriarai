-- Quick setup script för att testa betalningssystemet
-- Kör detta script för att snabbt sätta upp systemet

-- Lägg till kolumner om de inte finns
ALTER TABLE karriar_profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE karriar_profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free';
ALTER TABLE karriar_profiles ADD COLUMN IF NOT EXISTS lifetime_access BOOLEAN DEFAULT false;
ALTER TABLE karriar_profiles ADD COLUMN IF NOT EXISTS export_credits INTEGER DEFAULT 0;

ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS plan_type TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS billing_interval TEXT;

-- Enkel funktion för att hämta subscription info
CREATE OR REPLACE FUNCTION get_user_subscription_info(user_id_param UUID)
RETURNS TABLE (
    subscription_tier TEXT,
    subscription_status TEXT,
    lifetime_access BOOLEAN,
    extra_cv_credits INTEGER,
    export_credits INTEGER,
    stripe_customer_id TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(p.subscription_tier, 'free')::TEXT,
        COALESCE(p.subscription_status, 'free')::TEXT,
        COALESCE(p.lifetime_access, false),
        COALESCE(p.extra_cv_credits, 0),
        COALESCE(p.export_credits, 0),
        p.stripe_customer_id
    FROM karriar_profiles p
    WHERE p.id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enkel funktion för att uppdatera subscription tier
CREATE OR REPLACE FUNCTION update_user_subscription_tier(
    user_id_param UUID,
    new_tier TEXT,
    is_lifetime BOOLEAN DEFAULT false,
    stripe_customer_id_param TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE karriar_profiles 
    SET 
        subscription_tier = new_tier,
        subscription_status = CASE 
            WHEN is_lifetime THEN 'lifetime'
            WHEN new_tier = 'free' THEN 'free'
            ELSE 'active'
        END,
        lifetime_access = is_lifetime,
        stripe_customer_id = COALESCE(stripe_customer_id_param, stripe_customer_id),
        updated_at = NOW()
    WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 