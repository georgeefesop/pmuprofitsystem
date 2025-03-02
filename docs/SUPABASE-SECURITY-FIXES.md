# Supabase Security Fixes

This document outlines the steps to address security warnings in the PMU Profit System's Supabase configuration.

## Security Warnings Addressed

1. **Function Search Path Mutable** - The `handle_new_user` function had a mutable search path, which could lead to SQL injection vulnerabilities.
2. **Leaked Password Protection Disabled** - Supabase Auth's feature to prevent the use of compromised passwords was disabled.
3. **Insufficient MFA Options** - The project had too few multi-factor authentication options enabled.

## How to Apply the Fixes

### 1. Fix Function Search Path Mutable

The `handle_new_user` function has been updated in `database/supabase-setup.sql` to explicitly set the search path:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- Set search_path to public to prevent search_path injection
  SET search_path = 'public';
  
  INSERT INTO public.users (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

To apply this fix:

1. Log in to the [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your project
3. Go to the SQL Editor
4. Copy the updated function definition from `database/supabase-setup.sql`
5. Run the SQL query to update the function

### 2. Enable Leaked Password Protection and MFA Options

A new SQL script `database/security-enhancements.sql` has been created to address these warnings:

```sql
-- Enable Leaked Password Protection
UPDATE auth.config
SET enable_hibp_check = true
WHERE id = 1;

-- Enable Multiple MFA Options
UPDATE auth.config
SET enable_totp_mfa = true,
    enable_sms_mfa = true
WHERE id = 1;

-- Set minimum password length
UPDATE auth.config
SET min_password_length = 10
WHERE id = 1;
```

To apply these fixes:

1. Log in to the [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your project
3. Go to the SQL Editor
4. Copy the SQL from `database/security-enhancements.sql`
5. Run the SQL query to update the auth configuration
6. Restart the Auth service from the Supabase Dashboard (Authentication > Settings > Restart Service)

## Verification

After applying these fixes, you should verify that the warnings have been resolved:

1. Log in to the [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your project
3. Go to the Database > Database Health section
4. Check that the warnings are no longer present

## Additional Security Recommendations

1. **Regular Security Audits**: Periodically check the Database Health section for new warnings.
2. **Update Supabase Client**: Ensure you're using the latest version of the Supabase client libraries.
3. **Review Row Level Security Policies**: Regularly review your RLS policies to ensure they're properly securing your data.
4. **Enable Email Verification**: Require email verification for new user registrations.

## References

- [Supabase Database Linter Documentation](https://supabase.com/docs/guides/database/database-linter)
- [Supabase Auth Password Security](https://supabase.com/docs/guides/auth/password-security)
- [Supabase Auth MFA](https://supabase.com/docs/guides/auth/auth-mfa) 