-- Fix registration issues
-- Run this script to fix user registration problems

-- First, ensure all required columns exist in karriar_profiles
ALTER TABLE karriar_profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free';
ALTER TABLE karriar_profiles ADD COLUMN IF NOT EXISTS lifetime_access BOOLEAN DEFAULT false;
ALTER TABLE karriar_profiles ADD COLUMN IF NOT EXISTS export_credits INTEGER DEFAULT 0;
ALTER TABLE karriar_profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Ensure all required columns exist in payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS plan_type TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS billing_interval TEXT;

-- Create a simple, robust trigger function
CREATE OR REPLACE FUNCTION handle_new_karriar_user()
RETURNS trigger AS $$
BEGIN
    -- Try to create profile first
    BEGIN
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
    EXCEPTION
        WHEN OTHERS THEN
            -- Log error but don't fail the user creation
            RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    END;
    
    -- Try to create payment record
    BEGIN
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
    EXCEPTION
        WHEN OTHERS THEN
            -- Log error but don't fail the user creation
            RAISE WARNING 'Failed to create payment record for user %: %', NEW.id, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_karriar_user();

-- Also create a function to manually fix existing users who might be missing profiles
CREATE OR REPLACE FUNCTION fix_missing_profiles()
RETURNS INTEGER AS $$
DECLARE
    user_record RECORD;
    fixed_count INTEGER := 0;
BEGIN
    -- Find users without profiles
    FOR user_record IN 
        SELECT u.id, u.email, u.raw_user_meta_data
        FROM auth.users u
        LEFT JOIN karriar_profiles p ON u.id = p.id
        WHERE p.id IS NULL
    LOOP
        BEGIN
            -- Create missing profile
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
                user_record.id, 
                user_record.email, 
                COALESCE(user_record.raw_user_meta_data->>'full_name', ''),
                'free',
                'free',
                0,
                0,
                false
            );
            
            -- Create missing payment record
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
                user_record.id,
                0,
                'SEK',
                'succeeded',
                'free',
                'free',
                'none'
            );
            
            fixed_count := fixed_count + 1;
            
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to fix profile for user %: %', user_record.id, SQLERRM;
        END;
    END LOOP;
    
    RETURN fixed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the fix function
SELECT fix_missing_profiles() as users_fixed; 