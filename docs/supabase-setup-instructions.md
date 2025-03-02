# Supabase Database Setup Instructions

To set up the database schema for the PMU Profit System, follow these steps:

## 1. Access the SQL Editor

1. Log in to your Supabase dashboard at https://app.supabase.com
2. Select your project "pmuprofit"
3. Go to the SQL Editor (in the left sidebar)
4. Create a new query

## 2. Create the Database Schema

Copy and paste the following SQL code into the SQL Editor:

```sql
-- Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own data" 
  ON public.users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" 
  ON public.users FOR UPDATE 
  USING (auth.uid() = id);

-- Purchases Table
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own purchases" 
  ON public.purchases FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Only authenticated users can insert purchases" 
  ON public.purchases FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Email Logs Table
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Only authenticated users can view email logs" 
  ON public.email_logs FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Create a trigger function to automatically add new users to the users table
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

5. Click "Run" to execute the SQL code

## 3. Verify the Database Setup

1. Go to the "Table Editor" in the left sidebar
2. You should see the following tables:
   - `users` - Stores user profile information
   - `purchases` - Records product purchases
   - `email_logs` - Logs email notifications

3. Click on each table to verify the columns and constraints

## 4. Configure Authentication Settings

1. Go to Authentication > Settings in the left sidebar
2. Under "Site URL", enter your production URL (use http://localhost:3000 for development)
3. Under "Redirect URLs", add any additional URLs that users should be redirected to after authentication
4. Enable "Email confirmations" if you want users to verify their email addresses
5. Save the changes

## 5. Test the Authentication Flow

1. Go to Authentication > Users in the left sidebar
2. Click "Create user" to create a test user
3. Verify that a corresponding record is created in the `users` table (check the Table Editor)

## Explanation of the Schema

This SQL script creates the following tables:

1. **users** - Stores user profile information, linked to Supabase Auth users
2. **purchases** - Records product purchases made by users
3. **email_logs** - Logs email notifications sent by the system

It also sets up Row Level Security (RLS) policies to ensure data security and creates a trigger to automatically add new users to the users table when they sign up through Supabase Auth.

## Row Level Security (RLS) Policies

The following RLS policies are created:

1. **Users can view their own data** - Users can only view their own profile information
2. **Users can update their own data** - Users can only update their own profile information
3. **Users can view their own purchases** - Users can only view their own purchases
4. **Only authenticated users can insert purchases** - Only authenticated users can create purchases
5. **Only authenticated users can view email logs** - Only authenticated users can view email logs 