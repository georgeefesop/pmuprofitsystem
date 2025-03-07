-- PMU Profit System Database Schema Setup
-- This script sets up the database schema for the PMU Profit System
-- It creates the necessary tables and relationships for users, products, purchases, and more

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stripe_product_id TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  active BOOLEAN DEFAULT TRUE,
  type TEXT NOT NULL, -- 'course', 'tool', 'resource', etc.
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product Prices Table (for products with multiple price points)
CREATE TABLE IF NOT EXISTS public.product_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  stripe_price_id TEXT UNIQUE,
  nickname TEXT,
  unit_amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  recurring BOOLEAN DEFAULT FALSE,
  interval TEXT, -- 'month', 'year', null for one-time
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Modify existing Purchases Table to add Stripe-related fields
ALTER TABLE public.purchases 
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Purchase Items Table (for line items in a purchase)
CREATE TABLE IF NOT EXISTS public.purchase_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id UUID REFERENCES public.purchases(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  price_id UUID REFERENCES public.product_prices(id) ON DELETE SET NULL,
  quantity INTEGER DEFAULT 1,
  unit_amount DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions Table (for subscription-based products)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status TEXT NOT NULL, -- 'active', 'canceled', 'past_due', etc.
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription Items Table (for line items in a subscription)
CREATE TABLE IF NOT EXISTS public.subscription_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  price_id UUID REFERENCES public.product_prices(id) ON DELETE SET NULL,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Entitlements Table (for tracking what products a user has access to)
CREATE TABLE IF NOT EXISTS public.user_entitlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL, -- 'purchase', 'subscription', 'manual', etc.
  source_id UUID, -- reference to purchase_id or subscription_id
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE, -- NULL for lifetime access
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Ad Generator Logs Table (for tracking ad generator usage)
CREATE TABLE IF NOT EXISTS public.ad_generator_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  inputs JSONB NOT NULL,
  generated_ads JSONB NOT NULL,
  saved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_generator_logs ENABLE ROW LEVEL SECURITY;

-- Products: Anyone can view active products
CREATE POLICY "Active products are viewable by everyone" 
ON public.products FOR SELECT USING (active = true);

-- Product Prices: Anyone can view active prices
CREATE POLICY "Active prices are viewable by everyone" 
ON public.product_prices FOR SELECT USING (active = true);

-- Purchases: Users can only view their own purchases
CREATE POLICY "Users can view their own purchases" 
ON public.purchases FOR SELECT USING (auth.uid() = user_id);

-- Purchase Items: Users can view items from their purchases
CREATE POLICY "Users can view their own purchase items" 
ON public.purchase_items FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.purchases 
    WHERE purchases.id = purchase_items.purchase_id 
    AND purchases.user_id = auth.uid()
  )
);

-- Subscriptions: Users can only view their own subscriptions
CREATE POLICY "Users can view their own subscriptions" 
ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Subscription Items: Users can view items from their subscriptions
CREATE POLICY "Users can view their own subscription items" 
ON public.subscription_items FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.subscriptions 
    WHERE subscriptions.id = subscription_items.subscription_id 
    AND subscriptions.user_id = auth.uid()
  )
);

-- User Entitlements: Users can only view their own entitlements
CREATE POLICY "Users can view their own entitlements" 
ON public.user_entitlements FOR SELECT USING (auth.uid() = user_id);

-- Ad Generator Logs: Users can only view and manage their own logs
CREATE POLICY "Users can manage their own ad generator logs" 
ON public.ad_generator_logs FOR ALL USING (auth.uid() = user_id);

-- Initial Product Data
-- Insert the PMU Profit System course
INSERT INTO public.products (id, name, description, price, type, active)
VALUES 
  (uuid_generate_v4(), 'PMU Profit System', 'Learn how to increase your Permanent Makeup business profits through marketing and consultation techniques', 3700.00, 'course', true),
  (uuid_generate_v4(), 'PMU Ad Generator', 'AI-powered tool to generate advertisement copies for your PMU business', 997.00, 'tool', true),
  (uuid_generate_v4(), 'Consultation Success Blueprint', 'Downloadable resource with proven consultation techniques', 497.00, 'resource', true)
ON CONFLICT (id) DO NOTHING;

-- Migration for existing purchases
-- This will create user entitlements for existing purchases
INSERT INTO public.user_entitlements (user_id, product_id, source_type, source_id, is_active)
SELECT 
  p.user_id,
  (SELECT id FROM public.products WHERE name = 'PMU Profit System' LIMIT 1),
  'purchase',
  p.id,
  true
FROM 
  public.purchases p
WHERE 
  p.status = 'completed'
AND 
  NOT EXISTS (
    SELECT 1 FROM public.user_entitlements ue 
    WHERE ue.user_id = p.user_id 
    AND ue.product_id = (SELECT id FROM public.products WHERE name = 'PMU Profit System' LIMIT 1)
  ); 