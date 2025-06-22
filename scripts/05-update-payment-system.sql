-- Update payment system to use payments table for subscription tier management
-- This script ensures all existing users have a payment record

-- First, create payment records for existing users who don't have one
INSERT INTO payments (user_id, amount, currency, status, subscription_tier)
SELECT 
    kp.id,
    0, -- Free tier has no cost
    'SEK',
    'succeeded',
    kp.subscription_tier
FROM karriar_profiles kp
LEFT JOIN payments p ON kp.id = p.user_id
WHERE p.user_id IS NULL;

-- Update the trigger function to ensure payment records are created
CREATE OR REPLACE FUNCTION public.handle_new_karriar_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile
    INSERT INTO public.karriar_profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    
    -- Create initial payment record to track subscription status
    INSERT INTO public.payments (
        user_id,
        amount,
        currency,
        status,
        subscription_tier
    ) VALUES (
        NEW.id,
        0, -- Initial free tier has no cost
        'SEK',
        'succeeded', -- Free tier is automatically "succeeded"
        'free' -- Start with free tier
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get current subscription tier from payments table
CREATE OR REPLACE FUNCTION get_user_subscription_tier(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    tier TEXT;
BEGIN
    -- Get the most recent payment record for the user
    SELECT subscription_tier INTO tier
    FROM payments 
    WHERE user_id = user_uuid 
    AND subscription_tier IS NOT NULL
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- If no payment record found, return 'free'
    RETURN COALESCE(tier, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update subscription tier
CREATE OR REPLACE FUNCTION update_user_subscription_tier(user_uuid UUID, new_tier TEXT)
RETURNS VOID AS $$
BEGIN
    -- Insert new payment record with the new subscription tier
    INSERT INTO payments (
        user_id,
        amount,
        currency,
        status,
        subscription_tier
    ) VALUES (
        user_uuid,
        CASE 
            WHEN new_tier = 'free' THEN 0
            WHEN new_tier = 'pro' THEN 9900 -- 99 SEK in öre
            WHEN new_tier = 'enterprise' THEN 29900 -- 299 SEK in öre
            ELSE 0
        END,
        'SEK',
        'succeeded',
        new_tier
    );
    
    -- Also update the karriar_profiles for backward compatibility
    UPDATE karriar_profiles 
    SET 
        subscription_tier = new_tier,
        updated_at = NOW()
    WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment to explain the new system
COMMENT ON FUNCTION get_user_subscription_tier(UUID) IS 'Gets the current subscription tier from the payments table (most recent record)';
COMMENT ON FUNCTION update_user_subscription_tier(UUID, TEXT) IS 'Updates user subscription tier by creating a new payment record';
COMMENT ON COLUMN payments.subscription_tier IS 'The subscription tier for this payment - this is the source of truth for user subscription status'; 