-- Fix current user profile
-- Replace 'your-email@example.com' with your actual email address

SELECT create_missing_profile_for_user('your-email@example.com');

-- Or if you want to see all users without profiles:
SELECT u.email, u.id
FROM auth.users u
LEFT JOIN karriar_profiles p ON u.id = p.id
WHERE p.id IS NULL; 