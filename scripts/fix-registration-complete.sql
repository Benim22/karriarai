-- Complete fix for registration issues
-- This script fixes all problems with user registration

-- 1. Add missing columns
ALTER TABLE karriar_profiles ADD COLUMN IF NOT EXISTS extra_cv_credits INTEGER DEFAULT 0;

-- 2. Check for and remove duplicate triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Create a robust trigger function with proper error handling and duplicate prevention
CREATE OR REPLACE FUNCTION handle_new_karriar_user()
RETURNS trigger AS $$
DECLARE
    profile_exists BOOLEAN;
    payment_exists BOOLEAN;
BEGIN
    -- Check if profile already exists (prevent duplicates)
    SELECT EXISTS(SELECT 1 FROM public.karriar_profiles WHERE id = NEW.id) INTO profile_exists;
    SELECT EXISTS(SELECT 1 FROM public.payments WHERE user_id = NEW.id) INTO payment_exists;
    
    -- Only create profile if it doesn't exist
    IF NOT profile_exists THEN
        BEGIN
            INSERT INTO public.karriar_profiles (
                id, 
                email, 
                full_name,
                subscription_tier,
                subscription_status,
                extra_cv_credits,
                export_credits,
                lifetime_access,
                role,
                email_notifications,
                marketing_emails,
                profile_visibility,
                job_search_status,
                remote_work_preference,
                onboarding_completed,
                created_at,
                updated_at
            )
            VALUES (
                NEW.id, 
                NEW.email, 
                COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
                'free',
                'free',
                0,
                0,
                false,
                'user',
                true,
                false,
                'private',
                'not_looking',
                'hybrid',
                false,
                NOW(),
                NOW()
            );
            
            RAISE LOG 'Successfully created profile for user %', NEW.id;
            
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to create profile for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
        END;
    ELSE
        RAISE LOG 'Profile already exists for user %', NEW.id;
    END IF;
    
    -- Only create payment record if it doesn't exist
    IF NOT payment_exists THEN
        BEGIN
            INSERT INTO public.payments (
                user_id,
                amount,
                currency,
                status,
                subscription_tier,
                plan_type,
                billing_interval,
                created_at
            )
            VALUES (
                NEW.id,
                0,
                'SEK',
                'succeeded',
                'free',
                'free',
                'none',
                NOW()
            );
            
            RAISE LOG 'Successfully created payment record for user %', NEW.id;
            
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to create payment record for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
        END;
    ELSE
        RAISE LOG 'Payment record already exists for user %', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create the trigger (only one)
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_karriar_user();

-- 5. Clean up duplicate payment records
DELETE FROM payments p1 
WHERE p1.ctid NOT IN (
    SELECT MIN(p2.ctid) 
    FROM payments p2 
    WHERE p2.user_id = p1.user_id
);

-- 6. Function to manually fix existing users who might be missing profiles
CREATE OR REPLACE FUNCTION fix_missing_profiles_complete()
RETURNS TABLE(user_id UUID, email TEXT, action TEXT) AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Find users without profiles and create them
    FOR user_record IN 
        SELECT u.id, u.email, u.raw_user_meta_data, u.created_at
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
                lifetime_access,
                role,
                email_notifications,
                marketing_emails,
                profile_visibility,
                job_search_status,
                remote_work_preference,
                onboarding_completed,
                created_at,
                updated_at
            )
            VALUES (
                user_record.id, 
                user_record.email, 
                COALESCE(user_record.raw_user_meta_data->>'full_name', ''),
                'free',
                'free',
                0,
                0,
                false,
                'user',
                true,
                false,
                'private',
                'not_looking',
                'hybrid',
                false,
                user_record.created_at,
                NOW()
            );
            
            -- Ensure payment record exists
            INSERT INTO public.payments (
                user_id,
                amount,
                currency,
                status,
                subscription_tier,
                plan_type,
                billing_interval,
                created_at
            )
            VALUES (
                user_record.id,
                0,
                'SEK',
                'succeeded',
                'free',
                'free',
                'none',
                user_record.created_at
            )
            ON CONFLICT (user_id) DO NOTHING;
            
            user_id := user_record.id;
            email := user_record.email;
            action := 'Profile created';
            RETURN NEXT;
            
        EXCEPTION
            WHEN OTHERS THEN
                user_id := user_record.id;
                email := user_record.email;
                action := 'Failed: ' || SQLERRM;
                RETURN NEXT;
        END;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Run the fix function
SELECT * FROM fix_missing_profiles_complete();

-- 8. Show current status
SELECT 
    'Users in auth.users' as table_name,
    COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
    'Users in karriar_profiles' as table_name,
    COUNT(*) as count
FROM karriar_profiles
UNION ALL
SELECT 
    'Users in payments' as table_name,
    COUNT(*) as count
FROM payments; 