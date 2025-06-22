-- Add extra_cv_credits column to karriar_profiles table
ALTER TABLE karriar_profiles 
ADD COLUMN IF NOT EXISTS extra_cv_credits INTEGER DEFAULT 0;

-- Add comment to explain the column
COMMENT ON COLUMN karriar_profiles.extra_cv_credits IS 'Number of extra CV credits purchased by the user for one-time CV creation beyond their plan limits';

-- Update subscription tier check to include mini
ALTER TABLE karriar_profiles 
DROP CONSTRAINT IF EXISTS karriar_profiles_subscription_tier_check;

ALTER TABLE karriar_profiles 
ADD CONSTRAINT karriar_profiles_subscription_tier_check 
CHECK (subscription_tier IN ('free', 'mini', 'pro', 'premium', 'enterprise')); 