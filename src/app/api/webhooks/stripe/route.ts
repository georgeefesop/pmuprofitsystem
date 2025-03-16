import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { createUserEntitlement } from "@/utils/user-entitlements";
import { stripe } from '@/lib/stripe';
import { getServiceSupabase } from '@/lib/supabase';
import { PRODUCT_IDS, legacyToUuidProductId, isValidLegacyProductId, normalizeProductId } from '@/lib/product-ids';
import { createEntitlementsFromStripeSession } from '@/lib/entitlements';

// Route segment config for Stripe webhooks
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const preferredRegion = 'auto';
export const maxDuration = 60;

// Initialize Stripe without specifying API version to use the latest version
const stripeStripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

// Initialize Supabase with admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Create the SQL function for creating the verified_sessions table
const CREATE_VERIFIED_SESSIONS_TABLE_SQL = 
`CREATE OR REPLACE FUNCTION create_verified_sessions_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the table already exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'verified_sessions'
  ) THEN
    -- Create the table
    CREATE TABLE public.verified_sessions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      session_id TEXT NOT NULL,
      payment_intent_id TEXT,
      user_id UUID,
      customer_email TEXT,
      payment_status TEXT,
      metadata JSONB,
      verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Add indexes
    CREATE INDEX idx_verified_sessions_session_id ON public.verified_sessions(session_id);
    CREATE INDEX idx_verified_sessions_payment_intent_id ON public.verified_sessions(payment_intent_id);
    CREATE INDEX idx_verified_sessions_user_id ON public.verified_sessions(user_id);
    CREATE INDEX idx_verified_sessions_customer_email ON public.verified_sessions(customer_email);
    
    -- Add RLS policies
    ALTER TABLE public.verified_sessions ENABLE ROW LEVEL SECURITY;
    
    -- Allow service role full access
    CREATE POLICY "Service role can do anything with verified_sessions"
      ON public.verified_sessions
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
      
    -- Allow authenticated users to read their own sessions
    CREATE POLICY "Users can read their own verified sessions"
      ON public.verified_sessions
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
      
    -- Allow anon to read sessions by payment_intent_id (for verification)
    CREATE POLICY "Anyone can read sessions by payment_intent_id"
      ON public.verified_sessions
      FOR SELECT
      TO anon
      USING (payment_intent_id IS NOT NULL);
  END IF;
END;
$$`;

// Helper function to create user entitlements based on purchase
async function createUserEntitlements(userId: string, includeAdGenerator: boolean, includeBlueprint: boolean, purchaseId: string) {
  if (!userId) {
    console.error('Cannot create entitlements: No user ID provided');
    return { error: 'No user ID provided' };
  }

  const supabase = getServiceSupabase();
  const now = new Date().toISOString();
  const entitlements = [];

  try {
    // Always create entitlement for the main product (PMU Profit System)
    const { data: mainEntitlement, error: mainError } = await supabase
      .from('user_entitlements')
      .insert({
        user_id: userId,
        product_id: PRODUCT_IDS['pmu-profit-system'],
        source_type: 'purchase',
        source_id: purchaseId,
        valid_from: now,
        is_active: true
      })
      .select()
      .single();

    if (mainError) {
      console.error('Error creating main product entitlement:', mainError);
    } else {
      console.log('Created main product entitlement from webhook:', mainEntitlement);
      entitlements.push(mainEntitlement);
    }

    // Create entitlement for Ad Generator if included
    if (includeAdGenerator) {
      const { data: adEntitlement, error: adError } = await supabase
        .from('user_entitlements')
        .insert({
          user_id: userId,
          product_id: PRODUCT_IDS['pmu-ad-generator'],
          source_type: 'purchase',
          source_id: purchaseId,
          valid_from: now,
          is_active: true
        })
        .select()
        .single();

      if (adError) {
        console.error('Error creating ad generator entitlement:', adError);
      } else {
        console.log('Created ad generator entitlement from webhook:', adEntitlement);
        entitlements.push(adEntitlement);
      }
    }

    // Create entitlement for Blueprint if included
    if (includeBlueprint) {
      const { data: blueprintEntitlement, error: blueprintError } = await supabase
        .from('user_entitlements')
        .insert({
          user_id: userId,
          product_id: PRODUCT_IDS['consultation-success-blueprint'],
          source_type: 'purchase',
          source_id: purchaseId,
          valid_from: now,
          is_active: true
        })
        .select()
        .single();

      if (blueprintError) {
        console.error('Error creating blueprint entitlement:', blueprintError);
      } else {
        console.log('Created blueprint entitlement from webhook:', blueprintEntitlement);
        entitlements.push(blueprintEntitlement);
      }
    }

    // Update purchase status to indicate entitlements were created
    const { error: updateError } = await supabase
      .from('purchases')
      .update({ status: 'completed', entitlements_created: true })
      .eq('id', purchaseId);
    
    if (updateError) {
      console.error('Error updating purchase status in webhook:', updateError);
    }

    return { entitlements };
  } catch (error) {
    console.error('Error creating entitlements in webhook:', error);
    return { error };
  }
}

// Function to create entitlements from legacy purchases
async function createEntitlementsFromLegacyPurchase(purchase: any) {
  if (!purchase || !purchase.user_id) {
    console.error('Cannot create entitlements: Invalid purchase data');
    return { error: 'Invalid purchase data' };
  }

  const supabase = getServiceSupabase();
  const now = new Date().toISOString();
  const entitlements = [];
  const userId = purchase.user_id;

  try {
    // Check if the purchase has a product_id field (legacy format)
    if (purchase.product_id) {
      // Convert legacy product ID to UUID if needed
      let productId = purchase.product_id;
      
      // If it's a legacy string ID, convert to UUID
      if (isValidLegacyProductId(productId)) {
        const uuidProductId = legacyToUuidProductId(productId);
        if (uuidProductId) {
          productId = uuidProductId;
        } else {
          console.error(`Could not convert legacy product ID: ${productId}`);
          return { error: `Invalid product ID: ${productId}` };
        }
      }

      // Create the entitlement
      const { data: entitlement, error: entitlementError } = await supabase
        .from('user_entitlements')
        .insert({
          user_id: userId,
          product_id: productId,
          source_type: 'purchase',
          source_id: purchase.id,
          valid_from: now,
          is_active: true
        })
        .select()
        .single();

      if (entitlementError) {
        console.error('Error creating entitlement from legacy purchase in webhook:', entitlementError);
      } else {
        console.log('Created entitlement from legacy purchase in webhook:', entitlement);
        entitlements.push(entitlement);
      }
    } else {
      // If no product_id, use the include_* fields
      // Create entitlement for the main product (PMU Profit System)
      const { data: mainEntitlement, error: mainError } = await supabase
        .from('user_entitlements')
        .insert({
          user_id: userId,
          product_id: PRODUCT_IDS['pmu-profit-system'],
          source_type: 'purchase',
          source_id: purchase.id,
          valid_from: now,
          is_active: true
        })
        .select()
        .single();

      if (mainError) {
        console.error('Error creating main product entitlement:', mainError);
      } else {
        console.log('Created main product entitlement from legacy purchase in webhook:', mainEntitlement);
        entitlements.push(mainEntitlement);
      }

      // Create entitlement for Ad Generator if included
      if (purchase.include_ad_generator) {
        const { data: adEntitlement, error: adError } = await supabase
          .from('user_entitlements')
          .insert({
            user_id: userId,
            product_id: PRODUCT_IDS['pmu-ad-generator'],
            source_type: 'purchase',
            source_id: purchase.id,
            valid_from: now,
            is_active: true
          })
          .select()
          .single();

        if (adError) {
          console.error('Error creating ad generator entitlement:', adError);
        } else {
          console.log('Created ad generator entitlement from legacy purchase in webhook:', adEntitlement);
          entitlements.push(adEntitlement);
        }
      }

      // Create entitlement for Blueprint if included
      if (purchase.include_blueprint) {
        const { data: blueprintEntitlement, error: blueprintError } = await supabase
          .from('user_entitlements')
          .insert({
            user_id: userId,
            product_id: PRODUCT_IDS['consultation-success-blueprint'],
            source_type: 'purchase',
            source_id: purchase.id,
            valid_from: now,
            is_active: true
          })
          .select()
          .single();

        if (blueprintError) {
          console.error('Error creating blueprint entitlement:', blueprintError);
        } else {
          console.log('Created blueprint entitlement from legacy purchase in webhook:', blueprintEntitlement);
          entitlements.push(blueprintEntitlement);
        }
      }
    }

    // Update purchase status to indicate entitlements were created
    const { error: updateError } = await supabase
      .from('purchases')
      .update({ status: 'completed', entitlements_created: true })
      .eq('id', purchase.id);
    
    if (updateError) {
      console.error('Error updating purchase status in webhook:', updateError);
    }

    return { entitlements };
  } catch (error) {
    console.error('Error creating entitlements from legacy purchase in webhook:', error);
    return { error };
  }
}

// Define return types for better type safety
type EntitlementResult = {
  success: boolean;
  message?: string;
  entitlements?: any[];
  error?: string;
  purchase?: any;
  entitlement?: any;
};

// Function to handle checkout session completed event
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<EntitlementResult> {
  console.log('Processing checkout.session.completed event for session:', {
    id: session.id,
    customerId: session.customer,
    paymentStatus: session.payment_status,
    hasMetadata: !!session.metadata,
    metadata: session.metadata
  });
  
  try {
    // Store the verified session in the database
    try {
      const { data: verifiedSession, error: verifiedSessionError } = await supabaseAdmin
        .from('verified_sessions')
        .insert({
          session_id: session.id,
          payment_intent_id: session.payment_intent as string,
          user_id: session.metadata?.userId || null,
          customer_email: session.customer_details?.email || null,
          payment_status: session.payment_status,
          metadata: {
            productId: session.metadata?.productId || null,
            stateToken: session.metadata?.stateToken || null,
            email: session.metadata?.email || session.customer_details?.email || null,
            purchaseId: session.metadata?.purchaseId || null
          },
          verified_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (verifiedSessionError) {
        console.error('Error storing verified session:', verifiedSessionError);
      } else {
        console.log('Stored verified session:', verifiedSession.id);
      }
    } catch (storeError) {
      console.error('Error storing verified session:', storeError);
      // Continue processing even if storing the verified session fails
    }
    
    // Check if this is an add-on product purchase
    const isAddonPurchase = session.metadata && session.metadata.productId && 
      ['consultation-success-blueprint', 'pricing-template', 'pmu-ad-generator'].includes(session.metadata.productId);
    
    if (isAddonPurchase && session.metadata) {
      console.log('Processing add-on product purchase:', session.metadata.productId);
      
      // Get the user ID from the metadata
      const userId = session.metadata.userId;
      
      if (!userId) {
        console.log('No user ID found in metadata, cannot create entitlements');
        return { success: false, error: 'No user ID found in metadata' };
      }
      
      // Get the product ID
      const productId = session.metadata.productId;
      
      // Normalize the product ID to ensure it's in UUID format
      const normalizedProductId = normalizeProductId(productId);
      
      // Create the entitlement for the add-on product
      try {
        const { data: entitlement, error: entitlementError } = await supabaseAdmin
          .from('user_entitlements')
          .insert({
            user_id: userId,
            product_id: normalizedProductId,
            source_type: 'checkout',
            source_id: session.id,
            valid_from: new Date().toISOString(),
            is_active: true
          })
          .select()
          .single();
          
        if (entitlementError) {
          console.error('Error creating entitlement for add-on product:', entitlementError);
          return { success: false, error: 'Failed to create entitlement for add-on product' };
        } else {
          console.log('Created entitlement for add-on product:', entitlement);
        }
        
        // Update the purchase record if it exists
        if (session.metadata.purchaseId) {
          const { error: updateError } = await supabaseAdmin
            .from('purchases')
            .update({
              status: 'completed',
              entitlements_created: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', session.metadata.purchaseId);
            
          if (updateError) {
            console.error('Error updating purchase record:', updateError);
          } else {
            console.log('Updated purchase record:', session.metadata.purchaseId);
          }
        }
        
        return { success: true, entitlement, message: 'Add-on product entitlement created successfully' };
      } catch (entitlementError) {
        console.error('Error creating entitlement for add-on product:', entitlementError);
        return { success: false, error: 'Failed to create entitlement for add-on product' };
      }
    }
    
    // Continue with the regular checkout flow for the main product
    // Use the createEntitlementsFromStripeSession function from lib/entitlements
    const result = await createEntitlementsFromStripeSession(session.id);
    return result;
  } catch (error) {
    console.error('Error handling checkout.session.completed event:', error);
    return { success: false, error: 'Failed to process checkout session' };
  }
}

// Function to ensure the verified_sessions table exists
async function ensureVerifiedSessionsTableExists() {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) {
      console.error('Failed to initialize Supabase client');
      return false;
    }

    // Check if the table exists
    const { data, error } = await supabase.rpc('create_verified_sessions_table');
    
    if (error) {
      // If the function doesn't exist, create it first
      if (error.message.includes('function "create_verified_sessions_table" does not exist')) {
        console.log('Creating create_verified_sessions_table function...');
        
        // Create the function
        const { error: createFunctionError } = await supabase.rpc(
          'exec_sql', 
          { sql: CREATE_VERIFIED_SESSIONS_TABLE_SQL }
        );
        
        if (createFunctionError) {
          console.error('Error creating function:', createFunctionError);
          
          // Try direct SQL approach
          console.log('Trying direct SQL approach...');
          
          // Check if the table exists
          const { data: tableExists, error: tableCheckError } = await supabase.from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .eq('table_name', 'verified_sessions')
            .single();
            
          if (tableCheckError && !tableCheckError.message.includes('No rows returned')) {
            console.error('Error checking if table exists:', tableCheckError);
            return false;
          }
          
          if (!tableExists) {
            console.log('Table does not exist, creating it...');
            
            // Create the table directly
            const createTableSQL = `
              CREATE TABLE IF NOT EXISTS public.verified_sessions (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                session_id TEXT,
                payment_intent_id TEXT,
                user_id UUID,
                customer_email TEXT,
                payment_status TEXT,
                metadata JSONB,
                verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
              );
              
              CREATE INDEX IF NOT EXISTS idx_verified_sessions_session_id ON public.verified_sessions(session_id);
              CREATE INDEX IF NOT EXISTS idx_verified_sessions_payment_intent_id ON public.verified_sessions(payment_intent_id);
              CREATE INDEX IF NOT EXISTS idx_verified_sessions_user_id ON public.verified_sessions(user_id);
              CREATE INDEX IF NOT EXISTS idx_verified_sessions_customer_email ON public.verified_sessions(customer_email);
              
              ALTER TABLE public.verified_sessions ENABLE ROW LEVEL SECURITY;
              
              DROP POLICY IF EXISTS "Service role can do anything with verified_sessions" ON public.verified_sessions;
              CREATE POLICY "Service role can do anything with verified_sessions"
                ON public.verified_sessions
                FOR ALL
                TO service_role
                USING (true)
                WITH CHECK (true);
                
              DROP POLICY IF EXISTS "Users can read their own verified sessions" ON public.verified_sessions;
              CREATE POLICY "Users can read their own verified sessions"
                ON public.verified_sessions
                FOR SELECT
                TO authenticated
                USING (user_id = auth.uid());
                
              DROP POLICY IF EXISTS "Anyone can read sessions by payment_intent_id" ON public.verified_sessions;
              CREATE POLICY "Anyone can read sessions by payment_intent_id"
                ON public.verified_sessions
                FOR SELECT
                TO anon
                USING (payment_intent_id IS NOT NULL);
            `;
            
            const { error: createTableError } = await supabase.rpc(
              'exec_sql', 
              { sql: createTableSQL }
            );
            
            if (createTableError) {
              console.error('Error creating table:', createTableError);
              return false;
            }
            
            console.log('Table created successfully');
          } else {
            console.log('Table already exists');
          }
        } else {
          // Now call the function
          const { error: callFunctionError } = await supabase.rpc('create_verified_sessions_table');
          
          if (callFunctionError) {
            console.error('Error calling function after creation:', callFunctionError);
            return false;
          }
          
          console.log('Function created and called successfully');
        }
      } else {
        console.error('Error calling create_verified_sessions_table:', error);
        return false;
      }
    } else {
      console.log('Table check completed successfully');
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring verified_sessions table exists:', error);
    return false;
  }
}

// Webhook handler
export async function POST(req: NextRequest) {
  try {
    // Verify the webhook signature
    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
      console.error('No Stripe signature found in webhook request');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }
    
    // Get the raw body
    const rawBody = await req.text();
    
    // Verify the signature
    let event;
    try {
      event = stripeStripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ""
      );
    } catch (err) {
      console.error('Error verifying webhook signature:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
    
    console.log(`Webhook received: ${event.type}`);
    
    // Ensure the verified_sessions table exists
    try {
      await ensureVerifiedSessionsTableExists();
      console.log('Verified sessions table check completed');
    } catch (error) {
      console.error('Error checking/creating verified_sessions table:', error);
      // Continue even if this fails, as the table might already exist
    }
    
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Processing checkout.session.completed event for session:', {
          id: session.id,
          customerId: session.customer,
          paymentStatus: session.payment_status,
          hasMetadata: !!session.metadata,
          metadata: session.metadata
        });
        
        const result = await handleCheckoutSessionCompleted(session);
        
        if (result.success) {
          console.log('Successfully processed checkout.session.completed event:', result.message);
        } else {
          console.error('Failed to process checkout.session.completed event:', result.error);
        }
        break;

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Processing payment_intent.succeeded event for payment intent:', {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          status: paymentIntent.status,
          hasMetadata: !!paymentIntent.metadata,
          metadata: paymentIntent.metadata
        });
        
        // Store the verified session in the database
        try {
          const { data: verifiedSession, error: verifiedSessionError } = await supabaseAdmin
            .from('verified_sessions')
            .insert({
              payment_intent_id: paymentIntent.id,
              user_id: paymentIntent.metadata?.userId || null,
              customer_email: paymentIntent.metadata?.email || null,
              payment_status: paymentIntent.status,
              metadata: {
                productId: paymentIntent.metadata?.productId || null,
                email: paymentIntent.metadata?.email || null,
                includeAdGenerator: paymentIntent.metadata?.includeAdGenerator || null,
                includeBlueprint: paymentIntent.metadata?.includeBlueprint || null
              },
              verified_at: new Date().toISOString()
            })
            .select()
            .single();
            
          if (verifiedSessionError) {
            console.error('Error storing verified session for payment intent:', verifiedSessionError);
          } else {
            console.log('Stored verified session for payment intent:', verifiedSession.id);
          }
        } catch (storeError) {
          console.error('Error storing verified session for payment intent:', storeError);
          // Continue processing even if storing the verified session fails
        }
        
        // Use the createEntitlementsFromStripeSession function with the payment intent ID
        const paymentIntentResult = await createEntitlementsFromStripeSession(paymentIntent.id);
        
        if (paymentIntentResult.success) {
          console.log('Successfully processed payment_intent.succeeded event:', paymentIntentResult.message);
        } else {
          console.error('Failed to process payment_intent.succeeded event:', paymentIntentResult.message || 'Unknown error');
        }
        break;

      // Add other event types as needed
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error(`Error processing webhook: ${error.message}`);
    return NextResponse.json(
      { error: `Error processing webhook: ${error.message}` },
      { status: 500 }
    );
  }
} 