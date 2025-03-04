# Database Schema

This document outlines the database schema for the PMU Profit System.

## Tables Overview

The PMU Profit System uses the following tables:

1. **users** - Stores user profile information, linked to Supabase Auth users
2. **purchases** - Records product purchases made by users
3. **email_logs** - Logs email notifications sent by the system

## Schema Details

### Users Table

The `users` table stores user profile information and is linked to Supabase Auth users.

```sql
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Row Level Security (RLS) Policies

- **Users can view their own data** - Users can only view their own profile information
- **Users can update their own data** - Users can only update their own profile information

### Purchases Table

The `purchases` table records product purchases made by users.

```sql
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Row Level Security (RLS) Policies

- **Users can view their own purchases** - Users can only view their own purchases
- **Only authenticated users can insert purchases** - Only authenticated users can create purchases

### Email Logs Table

The `email_logs` table logs email notifications sent by the system.

```sql
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Row Level Security (RLS) Policies

- **Only authenticated users can view email logs** - Only authenticated users can view email logs

## Triggers

### New User Trigger

This trigger automatically adds new users to the `users` table when they sign up through Supabase Auth.

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

## Setting Up the Database

To set up the database schema for the PMU Profit System, you can use the automated setup scripts:

```bash
npm run setup-db
```

This script will create the necessary tables, set up Row Level Security (RLS) policies, and create triggers.

## Verifying the Database Setup

To verify that the database schema is set up correctly:

```bash
npm run verify-db
```

This script will check that all tables, columns, and constraints are correctly set up.

## Database Relationships

The database has the following relationships:

1. **users.id** → **auth.users.id** (one-to-one)
   - Each user in the `users` table corresponds to a user in Supabase Auth.

2. **purchases.user_id** → **users.id** (many-to-one)
   - Each purchase is associated with a user.

## Data Flow

1. When a user signs up, a record is automatically created in the `users` table via the trigger.
2. When a user makes a purchase, a record is created in the `purchases` table.
3. When the system sends an email, a record is created in the `email_logs` table.

## Security Considerations

- All tables have Row Level Security (RLS) policies to ensure data security.
- Users can only access their own data.
- The trigger function uses `SECURITY DEFINER` to ensure it runs with the necessary permissions. 