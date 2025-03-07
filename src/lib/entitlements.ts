/**
 * Shared utility functions for creating user entitlements from Stripe sessions
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { PRODUCT_IDS, normalizeProductId, isValidLegacyProductId, isValidUuidProductId } from '@/lib/product-ids';

// Only initialize Stripe on the server side
const stripeServer = typeof window === 'undefined' 
  ? new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-02-24.acacia',
    })
  : null;

// Get Supabase admin client - only on server side
function getServiceSupabase() {
  if (typeof window !== 'undefined') {
    console.error('[entitlements] getServiceSupabase called on client side');
    return null;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Creates entitlements for a user based on a Stripe checkout session
 * @param sessionId The Stripe checkout session ID
 * @param userId Optional user ID to override the one in the session metadata
 * @returns Object with success status and message
 */
export async function createEntitlementsFromStripeSession(
  sessionId: string,
  userId?: string
): Promise<{ success: boolean; message: string; entitlements?: any[] }> {
  // This function should only be called on the server side
  if (typeof window !== 'undefined') {
    console.error('[entitlements] createEntitlementsFromStripeSession called on client side');
    return { 
      success: false, 
      message: 'This function can only be called on the server side' 
    };
  }

  console.log(`[entitlements] Creating entitlements from session ${sessionId}${userId ? ` for user ${userId}` : ''}`);
  
  try {
    if (!stripeServer) {
      throw new Error('Stripe is not initialized');
    }

    // Get session data from Stripe
    const session = await stripeServer.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'line_items.data.price.product']
    });
    
    console.log(`[entitlements] Retrieved session: ${session.id}, payment_status: ${session.payment_status}`);
    
    // Verify session is paid
    if (session.payment_status !== 'paid') {
      console.log(`[entitlements] Session ${session.id} is not paid (status: ${session.payment_status})`);
      return { success: false, message: `Payment not completed (status: ${session.payment_status})` };
    }
    
    // Get user ID from session metadata or parameter
    const metadata = session.metadata || {};
    const customerId = userId || metadata.userId || '';
    
    if (!customerId) {
      console.error('[entitlements] No user ID found in session metadata or parameters');
      return { success: false, message: 'No user ID found' };
    }
    
    // Initialize Supabase client
    const supabase = getServiceSupabase();
    if (!supabase) {
      throw new Error('Supabase client could not be initialized');
    }
    
    // Check if purchase already exists to avoid duplicates
    const { data: existingPurchase, error: purchaseError } = await supabase
      .from('purchases')
      .select('*')
      .eq('stripe_checkout_session_id', sessionId)
      .single();
      
    if (purchaseError && purchaseError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" which is expected if no purchase exists
      console.error('[entitlements] Error checking for existing purchase:', purchaseError);
    }
    
    console.log(`[entitlements] Existing purchase check: ${existingPurchase ? 'Found' : 'Not found'}`);
    
    // If purchase exists, check if entitlements exist
    if (existingPurchase) {
      const { data: existingEntitlements, error: entitlementsError } = await supabase
        .from('user_entitlements')
        .select('*')
        .eq('user_id', customerId)
        .eq('source_id', existingPurchase.id);
        
      if (entitlementsError) {
        console.error('[entitlements] Error checking for existing entitlements:', entitlementsError);
      } else if (existingEntitlements && existingEntitlements.length > 0) {
        console.log(`[entitlements] User already has ${existingEntitlements.length} entitlements for this purchase`);
        return { 
          success: true, 
          message: `User already has ${existingEntitlements.length} entitlements for this purchase`,
          entitlements: existingEntitlements
        };
      }
    }
    
    // Create purchase record if it doesn't exist
    let purchaseId = existingPurchase?.id;
    if (!purchaseId) {
      console.log('[entitlements] Creating new purchase record');
      
      // Extract data from session
      const email = session.customer_email || metadata.email || '';
      const fullName = metadata.fullName || '';
      
      // Determine which products were purchased based on line items or metadata
      const includeAdGenerator = metadata.includeAdGenerator === 'true';
      const includeBlueprint = metadata.includeBlueprint === 'true';
      
      const { data: newPurchase, error: createError } = await supabase
        .from('purchases')
        .insert({
          user_id: customerId,
          stripe_checkout_session_id: sessionId,
          stripe_payment_intent_id: session.payment_intent as string,
          amount: session.amount_total ? session.amount_total / 100 : null,
          currency: session.currency?.toUpperCase() || 'EUR',
          status: 'completed',
          metadata: {
            email,
            fullName,
            includeAdGenerator,
            includeBlueprint
          }
        })
        .select()
        .single();
        
      if (createError || !newPurchase) {
        console.error('[entitlements] Failed to create purchase:', createError);
        return { success: false, message: `Failed to create purchase: ${createError?.message}` };
      }
      
      console.log(`[entitlements] Created purchase record: ${newPurchase.id}`);
      purchaseId = newPurchase.id;
    }
    
    // Process line items to create entitlements
    const now = new Date().toISOString();
    const entitlements = [];
    
    // Always create the main product entitlement
    const mainProductId = normalizeProductId('pmu-profit-system');
    const { data: mainEntitlement, error: mainError } = await supabase
      .from('user_entitlements')
      .insert({
        user_id: customerId,
        product_id: mainProductId,
        source_type: 'purchase',
        source_id: purchaseId,
        valid_from: now,
        is_active: true
      })
      .select()
      .single();
      
    if (mainError) {
      console.error('[entitlements] Error creating main product entitlement:', mainError);
    } else {
      console.log('[entitlements] Created main product entitlement');
      entitlements.push(mainEntitlement);
    }
    
    // Check for add-ons in line items or metadata
    const metadata_includeAdGenerator = metadata.includeAdGenerator === 'true';
    const metadata_includeBlueprint = metadata.includeBlueprint === 'true';
    
    // Create entitlement for Ad Generator if included
    if (metadata_includeAdGenerator) {
      const adGeneratorProductId = normalizeProductId('pmu-ad-generator');
      const { data: adEntitlement, error: adError } = await supabase
        .from('user_entitlements')
        .insert({
          user_id: customerId,
          product_id: adGeneratorProductId,
          source_type: 'purchase',
          source_id: purchaseId,
          valid_from: now,
          is_active: true
        })
        .select()
        .single();
        
      if (adError) {
        console.error('[entitlements] Error creating ad generator entitlement:', adError);
      } else {
        console.log('[entitlements] Created ad generator entitlement');
        entitlements.push(adEntitlement);
      }
    }
    
    // Create entitlement for Blueprint if included
    if (metadata_includeBlueprint) {
      const blueprintProductId = normalizeProductId('consultation-success-blueprint');
      const { data: blueprintEntitlement, error: blueprintError } = await supabase
        .from('user_entitlements')
        .insert({
          user_id: customerId,
          product_id: blueprintProductId,
          source_type: 'purchase',
          source_id: purchaseId,
          valid_from: now,
          is_active: true
        })
        .select()
        .single();
        
      if (blueprintError) {
        console.error('[entitlements] Error creating blueprint entitlement:', blueprintError);
      } else {
        console.log('[entitlements] Created blueprint entitlement');
        entitlements.push(blueprintEntitlement);
      }
    }
    
    return {
      success: entitlements.length > 0,
      message: entitlements.length > 0 
        ? `Created ${entitlements.length} entitlements for user ${customerId}`
        : 'No entitlements were created',
      entitlements
    };
  } catch (error) {
    console.error('[entitlements] Error creating entitlements from Stripe session:', error);
    return { 
      success: false, 
      message: `Error: ${(error as Error).message}` 
    };
  }
} 