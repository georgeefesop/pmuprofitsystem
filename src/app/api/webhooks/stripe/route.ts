// "use server";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { createUserEntitlement } from "@/utils/user-entitlements";
import { stripe } from '@/lib/stripe';
import { getServiceSupabase } from '@/lib/supabase';
import { PRODUCT_IDS, legacyToUuidProductId, isValidLegacyProductId } from '@/lib/product-ids';
import { createEntitlementsFromStripeSession } from '@/lib/entitlements';

// Add the route segment config at the top of the file
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// This tells Next.js to not parse the request body so we can handle it ourselves for Stripe
export const preferredRegion = 'auto';

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

// Function to handle checkout.session.completed event
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('[webhook] Processing checkout.session.completed event:', session.id);
  
  try {
    // Use the shared utility function to create entitlements
    const result = await createEntitlementsFromStripeSession(session.id);
    
    if (result.success) {
      console.log(`[webhook] Successfully created entitlements for session ${session.id}: ${result.message}`);
    } else {
      console.error(`[webhook] Failed to create entitlements for session ${session.id}: ${result.message}`);
    }
    
    return result;
  } catch (error) {
    console.error('[webhook] Error handling checkout.session.completed event:', error);
    return { success: false, message: `Error: ${(error as Error).message}` };
  }
}

// Main webhook handler
export async function POST(req: NextRequest) {
  try {
    // Get the raw request body for signature verification
    const rawBody = await req.text();
    
    // Get the Stripe signature from headers
    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
      console.error('[webhook] Missing Stripe signature');
      return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
    }
    
    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (err) {
      console.error('[webhook] Error verifying webhook signature:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
    
    console.log(`[webhook] Received event type: ${event.type}`);
    
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      // Add other event types as needed
      
      default:
        console.log(`[webhook] Unhandled event type: ${event.type}`);
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[webhook] Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
} 