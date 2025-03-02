# PMU Profit System Database Schema

This document provides a comprehensive overview of the database schema used in the PMU Profit System.

## Table of Contents

1. [Overview](#overview)
2. [Tables](#tables)
   - [Users](#users)
   - [Purchases](#purchases)
   - [Email Logs](#email-logs)
3. [Relationships](#relationships)
4. [Row Level Security](#row-level-security)
5. [Triggers](#triggers)
6. [Indexes](#indexes)
7. [Schema Diagram](#schema-diagram)
8. [Common Queries](#common-queries)

## Overview

The PMU Profit System uses Supabase (PostgreSQL) as its database. The schema is designed to support:

- User authentication and profiles
- Purchase tracking
- Email logging

The database is structured to ensure data integrity, security, and performance. Row Level Security (RLS) policies are implemented to protect user data.

## Tables

### Users

The `users` table stores user profile information. It is linked to Supabase Auth's `auth.users` table.

```sql
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields:**
- `id`: UUID, primary key, references auth.users(id)
- `email`: TEXT, unique, not null
- `full_name`: TEXT, user's full name
- `created_at`: TIMESTAMP WITH TIME ZONE, default NOW()
- `updated_at`: TIMESTAMP WITH TIME ZONE, default NOW()

**Purpose:**
- Stores user profile information
- Links to Supabase Auth for authentication
- Used for displaying user information in the UI

### Purchases

The `purchases` table tracks user purchases of products.

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

**Fields:**
- `id`: UUID, primary key, auto-generated
- `user_id`: UUID, references users(id), not null
- `product_id`: TEXT, not null, identifies the product purchased
- `amount`: DECIMAL(10, 2), not null, purchase amount
- `status`: TEXT, not null, default 'completed'
- `created_at`: TIMESTAMP WITH TIME ZONE, default NOW()
- `updated_at`: TIMESTAMP WITH TIME ZONE, default NOW()

**Purpose:**
- Tracks user purchases
- Used to determine user access to products
- Supports financial reporting

**Product IDs:**
- `pmu-profit-system`: Main course
- `pmu-ad-generator`: Ad generator tool
- `consultation-success-blueprint`: Consultation blueprint

### Email Logs

The `email_logs` table stores records of emails sent by the system.

```sql
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields:**
- `id`: UUID, primary key, auto-generated
- `recipient`: TEXT, not null, email recipient
- `subject`: TEXT, not null, email subject
- `content`: TEXT, not null, email content
- `sent_at`: TIMESTAMP WITH TIME ZONE, default NOW()

**Purpose:**
- Logs all emails sent by the system
- Useful for debugging email issues
- Provides an audit trail for communications

## Relationships

The database has the following relationships:

1. **Users to Auth.Users**: One-to-one relationship
   - `users.id` references `auth.users.id`
   - Ensures that each user profile corresponds to an authenticated user

2. **Purchases to Users**: Many-to-one relationship
   - `purchases.user_id` references `users.id`
   - A user can have multiple purchases
   - When a user is deleted, their purchases are also deleted (CASCADE)

## Row Level Security

Row Level Security (RLS) policies are implemented to protect user data:

### Users Table

```sql
-- Users can view their own data
CREATE POLICY "Users can view their own data" 
  ON public.users FOR SELECT 
  USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update their own data" 
  ON public.users FOR UPDATE 
  USING (auth.uid() = id);
```

### Purchases Table

```sql
-- Users can view their own purchases
CREATE POLICY "Users can view their own purchases" 
  ON public.purchases FOR SELECT 
  USING (auth.uid() = user_id);

-- Only authenticated users can insert purchases
CREATE POLICY "Only authenticated users can insert purchases" 
  ON public.purchases FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');
```

### Email Logs Table

```sql
-- Only authenticated users can view email logs
CREATE POLICY "Only authenticated users can view email logs" 
  ON public.email_logs FOR SELECT 
  USING (auth.role() = 'authenticated');
```

## Triggers

The database uses triggers to automate certain actions:

### New User Trigger

This trigger automatically creates a user profile when a new user is authenticated:

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

## Indexes

The database uses the following indexes to improve query performance:

1. Primary key indexes (automatically created)
2. Foreign key indexes (automatically created)
3. Email index on users table (for faster lookups by email)

## Schema Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    auth.users   │       │  public.users   │       │ public.purchases │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │───┐   │ id (PK)         │◄──┐   │ id (PK)         │
│ email           │   └──►│ email           │   │   │ user_id (FK)     │
│ encrypted_pass  │       │ full_name       │   │   │ product_id       │
│ ...             │       │ created_at      │   │   │ amount           │
└─────────────────┘       │ updated_at      │   │   │ status           │
                          └─────────────────┘   │   │ created_at       │
                                                └───│ updated_at       │
                                                    └─────────────────┘
                          ┌─────────────────┐
                          │public.email_logs│
                          ├─────────────────┤
                          │ id (PK)         │
                          │ recipient       │
                          │ subject         │
                          │ content         │
                          │ sent_at         │
                          └─────────────────┘
```

## Common Queries

### Get User Profile

```sql
SELECT * FROM public.users WHERE id = 'user-uuid';
```

### Get User Purchases

```sql
SELECT * FROM public.purchases WHERE user_id = 'user-uuid';
```

### Check if User Has Access to a Product

```sql
SELECT EXISTS (
  SELECT 1 FROM public.purchases 
  WHERE user_id = 'user-uuid' 
  AND product_id = 'product-id'
  AND status = 'completed'
);
```

### Get Recent Email Logs

```sql
SELECT * FROM public.email_logs 
ORDER BY sent_at DESC 
LIMIT 10;
```

### Get User with Purchases

```sql
SELECT 
  u.id, 
  u.email, 
  u.full_name,
  json_agg(p.*) as purchases
FROM 
  public.users u
LEFT JOIN 
  public.purchases p ON u.id = p.user_id
WHERE 
  u.id = 'user-uuid'
GROUP BY 
  u.id;
``` 