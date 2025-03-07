/**
 * Execute SQL Commands Script
 * 
 * This script executes SQL commands to set up the database schema
 * using the Supabase JavaScript client.
 * 
 * Usage: node scripts/database/execute-sql.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Environment variables:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Not set');
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Not set');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// SQL commands to execute
const sqlCommands = [
  // Enable UUID extension
  `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
  
  // Products Table
  `CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_product_id TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    active BOOLEAN DEFAULT TRUE,
    type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );`,
  
  // Product Prices Table
  `CREATE TABLE IF NOT EXISTS public.product_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    stripe_price_id TEXT UNIQUE,
    nickname TEXT,
    unit_amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    recurring BOOLEAN DEFAULT FALSE,
    interval TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );`,
  
  // Modify existing Purchases Table
  `ALTER TABLE public.purchases 
    ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
    ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
    ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
    ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;`,
  
  // Purchase Items Table
  `CREATE TABLE IF NOT EXISTS public.purchase_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID REFERENCES public.purchases(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    price_id UUID REFERENCES public.product_prices(id) ON DELETE SET NULL,
    quantity INTEGER DEFAULT 1,
    unit_amount DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );`,
  
  // Subscriptions Table
  `CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    status TEXT NOT NULL,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at TIMESTAMP WITH TIME ZONE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );`,
  
  // Subscription Items Table
  `CREATE TABLE IF NOT EXISTS public.subscription_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    price_id UUID REFERENCES public.product_prices(id) ON DELETE SET NULL,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );`,
  
  // User Entitlements Table
  `CREATE TABLE IF NOT EXISTS public.user_entitlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL,
    source_id UUID,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
  );`,
  
  // Ad Generator Logs Table
  `CREATE TABLE IF NOT EXISTS public.ad_generator_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    inputs JSONB NOT NULL,
    generated_ads JSONB NOT NULL,
    saved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );`,
  
  // Enable RLS on all tables
  `ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.product_prices ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.subscription_items ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.user_entitlements ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.ad_generator_logs ENABLE ROW LEVEL SECURITY;`,
  
  // RLS Policies
  `CREATE POLICY "Active products are viewable by everyone" 
   ON public.products FOR SELECT USING (active = true);`,
  
  `CREATE POLICY "Active prices are viewable by everyone" 
   ON public.product_prices FOR SELECT USING (active = true);`,
  
  `CREATE POLICY "Users can view their own purchases" 
   ON public.purchases FOR SELECT USING (auth.uid() = user_id);`,
  
  `CREATE POLICY "Users can view their own purchase items" 
   ON public.purchase_items FOR SELECT 
   USING (
     EXISTS (
       SELECT 1 FROM public.purchases 
       WHERE purchases.id = purchase_items.purchase_id 
       AND purchases.user_id = auth.uid()
     )
   );`,
  
  `CREATE POLICY "Users can view their own subscriptions" 
   ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);`,
  
  `CREATE POLICY "Users can view their own subscription items" 
   ON public.subscription_items FOR SELECT 
   USING (
     EXISTS (
       SELECT 1 FROM public.subscriptions 
       WHERE subscriptions.id = subscription_items.subscription_id 
       AND subscriptions.user_id = auth.uid()
     )
   );`,
  
  `CREATE POLICY "Users can view their own entitlements" 
   ON public.user_entitlements FOR SELECT USING (auth.uid() = user_id);`,
  
  `CREATE POLICY "Users can manage their own ad generator logs" 
   ON public.ad_generator_logs FOR ALL USING (auth.uid() = user_id);`,
  
  // Initial Product Data
  `INSERT INTO public.products (id, name, description, price, type, active)
   VALUES 
     (uuid_generate_v4(), 'PMU Profit System', 'Learn how to increase your Permanent Makeup business profits through marketing and consultation techniques', 3700.00, 'course', true),
     (uuid_generate_v4(), 'PMU Ad Generator', 'AI-powered tool to generate advertisement copies for your PMU business', 997.00, 'tool', true),
     (uuid_generate_v4(), 'Consultation Success Blueprint', 'Downloadable resource with proven consultation techniques', 497.00, 'resource', true)
   ON CONFLICT (id) DO NOTHING;`,
  
  // Migration for existing purchases
  `INSERT INTO public.user_entitlements (user_id, product_id, source_type, source_id, is_active)
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
     );`
];

async function executeSQL() {
  try {
    console.log('Starting SQL execution...');
    
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      console.log(`Executing command ${i + 1}/${sqlCommands.length}...`);
      
      try {
        // Execute SQL directly using the Supabase client
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: command });
        
        if (error) {
          console.error(`Error executing command ${i + 1}:`, error);
        } else {
          console.log(`Command ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.error(`Exception executing command ${i + 1}:`, err);
      }
    }
    
    console.log('SQL execution completed!');
  } catch (error) {
    console.error('Error executing SQL:', error);
    process.exit(1);
  }
}

executeSQL(); 