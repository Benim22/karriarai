-- Fix registration trigger to use correct column names
-- This script fixes the trigger that creates user profiles and payment records

-- First, add the missing extra_cv_credits column
ALTER TABLE karriar_profiles ADD COLUMN IF NOT EXISTS extra_cv_credits INTEGER DEFAULT 0;

-- Create the corrected trigger function
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
            lifetime_access,
            role,
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
            false
        );
        
        RAISE LOG 'Successfully created profile for user %', NEW.id;
        
    EXCEPTION
        WHEN OTHERS THEN
            -- Log error but don't fail the user creation
            RAISE WARNING 'Failed to create profile for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
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
        
        RAISE LOG 'Successfully created payment record for user %', NEW.id;
        
    EXCEPTION
        WHEN OTHERS THEN
            -- Log error but don't fail the user creation
            RAISE WARNING 'Failed to create payment record for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_karriar_user();

-- Function to manually create profile for your current user
CREATE OR REPLACE FUNCTION create_missing_profile_for_user(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_record RECORD;
    profile_exists BOOLEAN;
BEGIN
    -- Find the user
    SELECT id, email, raw_user_meta_data INTO user_record
    FROM auth.users 
    WHERE email = user_email;
    
    IF NOT FOUND THEN
        RAISE WARNING 'User with email % not found', user_email;
        RETURN FALSE;
    END IF;
    
    -- Check if profile already exists
    SELECT EXISTS(SELECT 1 FROM karriar_profiles WHERE id = user_record.id) INTO profile_exists;
    
    IF profile_exists THEN
        RAISE LOG 'Profile already exists for user %', user_email;
        RETURN TRUE;
    END IF;
    
    -- Create the profile
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
            onboarding_completed
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
            false
        );
        
        RAISE LOG 'Successfully created profile for user %', user_email;
        RETURN TRUE;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE WARNING 'Failed to create profile for user %: %', user_email, SQLERRM;
            RETURN FALSE;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable logging so we can see what happens
SET log_statement = 'all';
SET log_min_messages = 'log'; 