-- 06-update-payments-system.sql
-- Uppdaterar betalningssystemet för att fungera korrekt med Stripe

-- Lägg till nya kolumner i payments tabellen om de inte finns
ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS plan_type TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS billing_interval TEXT; -- 'monthly', 'lifetime', 'one_time'
ALTER TABLE payments ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;

-- Lägg till nya kolumner i karriar_profiles tabellen
ALTER TABLE karriar_profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE karriar_profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free'; -- 'free', 'active', 'canceled', 'lifetime'
ALTER TABLE karriar_profiles ADD COLUMN IF NOT EXISTS lifetime_access BOOLEAN DEFAULT false;
ALTER TABLE karriar_profiles ADD COLUMN IF NOT EXISTS export_credits INTEGER DEFAULT 0;

-- Skapa index för bättre prestanda
CREATE INDEX IF NOT EXISTS idx_payments_stripe_customer_id ON payments(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_subscription_id ON payments(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_subscription_tier ON payments(user_id, subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON karriar_profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON karriar_profiles(subscription_tier);

-- Uppdatera RLS policies för payments tabellen
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own payments" ON payments;
CREATE POLICY "Users can insert own payments" ON payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Skapa funktion för att uppdatera subscription tier
CREATE OR REPLACE FUNCTION update_user_subscription_tier(
    user_id_param UUID,
    new_tier TEXT,
    is_lifetime BOOLEAN DEFAULT false,
    stripe_customer_id_param TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Uppdatera karriar_profiles
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

    -- Uppdatera den senaste betalningen för användaren
    UPDATE payments 
    SET 
        subscription_tier = new_tier,
        stripe_customer_id = COALESCE(stripe_customer_id_param, stripe_customer_id),
        updated_at = NOW()
    WHERE user_id = user_id_param 
    AND status = 'succeeded'
    AND id = (
        SELECT id FROM payments 
        WHERE user_id = user_id_param 
        AND status = 'succeeded'
        ORDER BY created_at DESC 
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Skapa funktion för att hämta användarens aktuella subscription info
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
        p.subscription_tier,
        p.subscription_status,
        p.lifetime_access,
        p.extra_cv_credits,
        p.export_credits,
        p.stripe_customer_id
    FROM karriar_profiles p
    WHERE p.id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Skapa funktion för att kontrollera subscription limits
CREATE OR REPLACE FUNCTION check_subscription_limits(
    user_id_param UUID,
    feature_type TEXT -- 'cvs', 'exports', 'ai_features', etc.
)
RETURNS JSONB AS $$
DECLARE
    user_info RECORD;
    cv_count INTEGER;
    result JSONB;
BEGIN
    -- Hämta användarens subscription info
    SELECT * INTO user_info FROM get_user_subscription_info(user_id_param);
    
    IF user_info IS NULL THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'User not found'
        );
    END IF;

    -- Kontrollera baserat på feature_type
    CASE feature_type
        WHEN 'cvs' THEN
            -- Räkna användarens CV:n
            SELECT COUNT(*) INTO cv_count FROM user_cvs WHERE user_id = user_id_param;
            
            -- Kontrollera limits baserat på subscription tier
            IF user_info.subscription_tier IN ('pro', 'enterprise') OR user_info.lifetime_access THEN
                result := jsonb_build_object(
                    'allowed', true,
                    'current_count', cv_count,
                    'limit', -1,
                    'tier', user_info.subscription_tier
                );
            ELSIF user_info.extra_cv_credits > 0 THEN
                result := jsonb_build_object(
                    'allowed', true,
                    'current_count', cv_count,
                    'limit', 1 + user_info.extra_cv_credits,
                    'tier', user_info.subscription_tier,
                    'using_credits', true
                );
            ELSIF cv_count >= 1 THEN
                result := jsonb_build_object(
                    'allowed', false,
                    'current_count', cv_count,
                    'limit', 1,
                    'tier', user_info.subscription_tier,
                    'reason', 'CV limit reached'
                );
            ELSE
                result := jsonb_build_object(
                    'allowed', true,
                    'current_count', cv_count,
                    'limit', 1,
                    'tier', user_info.subscription_tier
                );
            END IF;
            
        WHEN 'exports' THEN
            IF user_info.subscription_tier IN ('pro', 'enterprise') OR user_info.lifetime_access THEN
                result := jsonb_build_object(
                    'allowed', true,
                    'limit', -1,
                    'tier', user_info.subscription_tier
                );
            ELSIF user_info.export_credits > 0 THEN
                result := jsonb_build_object(
                    'allowed', true,
                    'credits', user_info.export_credits,
                    'tier', user_info.subscription_tier
                );
            ELSE
                result := jsonb_build_object(
                    'allowed', false,
                    'tier', user_info.subscription_tier,
                    'reason', 'No export credits available'
                );
            END IF;
            
        ELSE
            result := jsonb_build_object(
                'allowed', user_info.subscription_tier IN ('pro', 'enterprise') OR user_info.lifetime_access,
                'tier', user_info.subscription_tier
            );
    END CASE;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Skapa funktion för att konsumera credits
CREATE OR REPLACE FUNCTION consume_credit(
    user_id_param UUID,
    credit_type TEXT -- 'cv', 'export'
)
RETURNS BOOLEAN AS $$
DECLARE
    current_credits INTEGER;
BEGIN
    CASE credit_type
        WHEN 'cv' THEN
            SELECT extra_cv_credits INTO current_credits 
            FROM karriar_profiles 
            WHERE id = user_id_param;
            
            IF current_credits > 0 THEN
                UPDATE karriar_profiles 
                SET extra_cv_credits = extra_cv_credits - 1,
                    updated_at = NOW()
                WHERE id = user_id_param;
                RETURN true;
            END IF;
            
        WHEN 'export' THEN
            SELECT export_credits INTO current_credits 
            FROM karriar_profiles 
            WHERE id = user_id_param;
            
            IF current_credits > 0 THEN
                UPDATE karriar_profiles 
                SET export_credits = export_credits - 1,
                    updated_at = NOW()
                WHERE id = user_id_param;
                RETURN true;
            END IF;
    END CASE;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Uppdatera trigger för nya användare
CREATE OR REPLACE FUNCTION handle_new_karriar_user()
RETURNS trigger AS $$
BEGIN
    -- Skapa profil
    INSERT INTO public.karriar_profiles (
        id, 
        email, 
        full_name,
        subscription_tier,
        subscription_status,
        extra_cv_credits,
        export_credits,
        lifetime_access
    )
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        'free',
        'free',
        0,
        0,
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

-- Återskapa triggern
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_karriar_user();

-- Lägg till kommentarer för dokumentation
COMMENT ON FUNCTION update_user_subscription_tier IS 'Uppdaterar användarens subscription tier och relaterad information';
COMMENT ON FUNCTION get_user_subscription_info IS 'Hämtar användarens aktuella subscription information';
COMMENT ON FUNCTION check_subscription_limits IS 'Kontrollerar om användaren kan använda en viss funktion baserat på deras subscription';
COMMENT ON FUNCTION consume_credit IS 'Konsumerar en credit för CV eller export';

-- Lägg till några hjälpfunktioner för Stripe integration
CREATE OR REPLACE FUNCTION get_or_create_stripe_customer(
    user_id_param UUID,
    email_param TEXT
)
RETURNS TEXT AS $$
DECLARE
    existing_customer_id TEXT;
BEGIN
    -- Försök hitta befintlig Stripe customer ID
    SELECT stripe_customer_id INTO existing_customer_id
    FROM karriar_profiles
    WHERE id = user_id_param AND stripe_customer_id IS NOT NULL;
    
    -- Om vi inte har en customer ID, returnera NULL så att Stripe kan skapa en
    RETURN existing_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funktion för att spara Stripe customer ID
CREATE OR REPLACE FUNCTION save_stripe_customer_id(
    user_id_param UUID,
    customer_id_param TEXT
)
RETURNS VOID AS $$
BEGIN
    UPDATE karriar_profiles 
    SET stripe_customer_id = customer_id_param,
        updated_at = NOW()
    WHERE id = user_id_param;
    
    UPDATE payments 
    SET stripe_customer_id = customer_id_param,
        updated_at = NOW()
    WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 