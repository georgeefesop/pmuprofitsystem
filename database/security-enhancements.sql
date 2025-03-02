-- Security Enhancements for PMU Profit System
-- This script addresses security warnings from Supabase

-- 1. Enable Leaked Password Protection
-- This prevents users from using passwords that have been compromised in data breaches
UPDATE auth.config
SET enable_hibp_check = true
WHERE id = 1;

-- 2. Enable Multiple MFA Options
-- This enhances account security by providing multiple authentication factors
UPDATE auth.config
SET enable_totp_mfa = true,
    enable_sms_mfa = true
WHERE id = 1;

-- 3. Additional Security Recommendations
-- Consider implementing the following:
-- - Set minimum password length
UPDATE auth.config
SET min_password_length = 10
WHERE id = 1;

-- - Set password strength requirements (if supported by your Supabase version)
-- UPDATE auth.config
-- SET password_strength = 'strong'
-- WHERE id = 1;

-- Note: After running this script, you may need to restart your Supabase Auth service
-- for the changes to take effect. You can do this from the Supabase dashboard. 