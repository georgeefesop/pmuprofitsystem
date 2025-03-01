# Supabase Setup for PMU Profit System

This document provides instructions for setting up Supabase for the PMU Profit System application.

## 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and sign up for an account
2. Create a new project:
   - Choose a name (e.g., "pmu-profit-system")
   - Set a secure database password
   - Select a region closest to your users
   - Wait for your database to be provisioned (usually takes 1-2 minutes)

## 2. Get Your API Keys

1. In your Supabase project dashboard, go to Project Settings > API
2. Copy the following values:
   - Project URL
   - `anon` public key
   - `service_role` secret key

## 3. Set Up Environment Variables

1. Create a `.env.local` file in the root of your project (for local development)
2. Add the following environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

3. For production, set these environment variables in your hosting provider's dashboard

## 4. Set Up Database Schema

1. In the Supabase dashboard, go to the SQL Editor
2. Create a new query and paste the contents of the `supabase-setup.sql` file
3. Run the query to create the necessary tables and set up Row Level Security

## 5. Configure Authentication

1. In the Supabase dashboard, go to Authentication > Settings
2. Under Email Auth, make sure "Enable Email Signup" is turned on
3. Configure Site URL to match your production URL
4. Optionally, customize email templates for confirmation, magic link, etc.

## 6. Test Your Setup

1. Run your application locally:
   ```
   npm run dev
   ```
2. Try to register a new user
3. Verify that the user is created in the Supabase Auth dashboard
4. Test the purchase flow to ensure purchases are recorded in the database

## 7. Deployment

When deploying to production:

1. Set the environment variables in your hosting provider's dashboard
2. Update the Site URL in Supabase Authentication settings to match your production URL
3. If using a custom domain, update the Site URL in your Supabase project settings

## 8. Troubleshooting

- If authentication is not working, check that your Site URL is correctly set in Supabase
- If database operations fail, check that your Row Level Security policies are correctly configured
- For any issues, check the Supabase logs in the dashboard under Logs

## 9. Backup and Maintenance

- Regularly backup your database using Supabase's backup features
- Monitor your usage to ensure you stay within your plan limits
- Keep your Supabase client library up to date 