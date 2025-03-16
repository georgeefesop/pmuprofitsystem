/**
 * Shared utility functions for creating user entitlements from Stripe sessions
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { PRODUCT_IDS, normalizeProductId, isValidLegacyProductId, isValidUuidProductId } from '@/lib/product-ids';
import { stripe, safeStripeOperation } from '@/lib/stripe';

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
 * Creates entitlements for a user based on a Stripe checkout session or payment intent
 * @param sessionId The Stripe checkout session ID
 * @param userId Optional user ID to override the one in the session metadata
 * @param specificProductId Optional specific product ID to create entitlements for
 * @returns Object with success status and message
 */
export async function createEntitlementsFromStripeSession(
  sessionId: string,
  userId?: string,
  specificProductId?: string | null
): Promise<{
  success: boolean;
  message: string;
  entitlements?: any[];
}> {
  try {
    console.log(`[entitlements] Creating entitlements for session ${sessionId}${userId ? ` and user ${userId}` : ''}${specificProductId ? ` for specific product ${specificProductId}` : ''}`);
    
    // Determine if this is a checkout session ID or payment intent ID
    const isPaymentIntent = sessionId.startsWith('pi_');
    
    if (isPaymentIntent) {
      return createEntitlementsFromPaymentIntent(sessionId, userId, specificProductId);
    } else {
      return createEntitlementsFromCheckoutSession(sessionId, userId, specificProductId);
    }
  } catch (error) {
    console.error('[entitlements] Error creating entitlements from session:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error creating entitlements'
    };
  }
}

/**
 * Creates entitlements for a user based on a Stripe payment intent
 * @param paymentIntentId The Stripe payment intent ID
 * @param userId Optional user ID to override the one in the payment intent metadata
 * @param specificProductId Optional specific product ID to create entitlements for
 * @returns Object with success status and message
 */
export async function createEntitlementsFromPaymentIntent(
  paymentIntentId: string,
  userId?: string,
  specificProductId?: string | null
): Promise<{
  success: boolean;
  message: string;
  entitlements?: any[];
}> {
  try {
    console.log(`[entitlements] Creating entitlements from payment intent ${paymentIntentId}${userId ? ` for user ${userId}` : ''}${specificProductId ? ` for specific product ${specificProductId}` : ''}`);
    
    // Initialize Stripe and Supabase clients
    const supabase = getServiceSupabase();
    
    if (!stripe || !supabase) {
      throw new Error('Failed to initialize Stripe or Supabase client');
    }
    
    // Retrieve the payment intent from Stripe
    const paymentIntent = await safeStripeOperation(() => 
      stripe.paymentIntents.retrieve(paymentIntentId)
    );
    
    if (!paymentIntent) {
      throw new Error(`Payment intent ${paymentIntentId} not found`);
    }
    
    // Check if the payment was successful
    if (paymentIntent.status !== 'succeeded') {
      return {
        success: false,
        message: `Payment intent ${paymentIntentId} has status ${paymentIntent.status}, not succeeded`
      };
    }
    
    // Get the user ID from the function parameter or from the payment intent metadata
    const effectiveUserId = userId || paymentIntent.metadata?.userId;
    
    if (!effectiveUserId) {
      return {
        success: false,
        message: 'No user ID provided or found in payment intent metadata'
      };
    }
    
    // Check if we already have a purchase record for this payment intent
    const { data: existingPurchase, error: purchaseError } = await supabase
      .from('purchases')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .eq('user_id', effectiveUserId)
      .single();
      
    if (purchaseError && purchaseError.code !== 'PGRST116') {
      console.error('[entitlements] Error checking for existing purchase:', purchaseError);
    }
    
    // If we found a purchase, check if we already have entitlements for it
    if (existingPurchase) {
      console.log('[entitlements] Found existing purchase:', existingPurchase.id);
      
      // Check for existing entitlements
      const { data: existingEntitlements, error: entitlementsError } = await supabase
        .from('user_entitlements')
        .select('*')
        .eq('source_id', existingPurchase.id)
        .eq('user_id', effectiveUserId)
        .eq('is_active', true);
        
      if (entitlementsError) {
        console.error('[entitlements] Error checking for existing entitlements:', entitlementsError);
      } else if (existingEntitlements && existingEntitlements.length > 0) {
        console.log(`[entitlements] User already has ${existingEntitlements.length} active entitlements for this purchase`);
        return {
          success: true,
          message: `User already has ${existingEntitlements.length} active entitlements for this purchase`,
          entitlements: existingEntitlements
        };
      }
    }
    
    // If we don't have a purchase record or entitlements, create them
    let purchaseId = existingPurchase?.id;
    
    if (!purchaseId) {
      console.log('[entitlements] No existing purchase found, creating a new one');
      
      // Extract user email from payment intent metadata
      const userEmail = paymentIntent.metadata?.email || '';
      
      // Determine the product ID to use
      let productId = specificProductId || PRODUCT_IDS['pmu-profit-system'];
      
      // Check if there's a product ID in the metadata
      if (!specificProductId && paymentIntent.metadata?.productId) {
        productId = paymentIntent.metadata.productId;
        console.log(`[entitlements] Using product ID from metadata: ${productId}`);
      }
      
      // Create a new purchase record
      const { data: newPurchase, error: createError } = await supabase
        .from('purchases')
        .insert({
          user_id: effectiveUserId,
          product_id: productId,
          stripe_payment_intent_id: paymentIntentId,
          status: 'completed',
          amount: paymentIntent.amount ? paymentIntent.amount / 100 : 37, // Convert from cents to dollars
          user_email: userEmail,
          metadata: {
            include_ad_generator: paymentIntent.metadata?.includeAdGenerator === 'true',
            include_blueprint: paymentIntent.metadata?.includeBlueprint === 'true',
            product_id: productId
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (createError) {
        console.error('[entitlements] Error creating purchase record:', createError);
        throw new Error(`Failed to create purchase record: ${createError.message}`);
      }
      
      console.log('[entitlements] Created new purchase record:', newPurchase.id);
      purchaseId = newPurchase.id;
    }
    
    // Create entitlements based on the payment intent metadata
    const entitlements = [];
    const now = new Date().toISOString();
    
    // If a specific product ID is provided, only create an entitlement for that product
    if (specificProductId) {
      console.log(`[entitlements] Creating entitlement for specific product: ${specificProductId}`);
      
      try {
        // Use upsert instead of insert to handle duplicate entitlements gracefully
        const { data: entitlement, error: entitlementError } = await supabase
          .from('user_entitlements')
          .upsert({
            user_id: effectiveUserId,
            product_id: specificProductId,
            source_type: 'purchase',
            source_id: purchaseId,
            valid_from: now,
            is_active: true,
            created_at: now,
            updated_at: now
          }, {
            onConflict: 'user_id,product_id',
            ignoreDuplicates: false
          })
          .select()
          .single();
          
        if (entitlementError) {
          console.error(`[entitlements] Error creating entitlement for product ${specificProductId}:`, entitlementError);
          throw new Error(`Failed to create entitlement for product ${specificProductId}: ${entitlementError.message}`);
        }
        
        console.log(`[entitlements] Created/updated entitlement for product ${specificProductId}:`, entitlement.id);
        entitlements.push(entitlement);
      } catch (error) {
        console.error(`[entitlements] Error creating entitlement for product ${specificProductId}:`, error);
        // Continue with other entitlements even if this one fails
      }
    } else {
      // Otherwise, create entitlements based on the payment intent metadata
      
      // Always include the main product unless specifically told not to
      console.log('[entitlements] Creating entitlement for main product');
      
      try {
        // Use upsert instead of insert to handle duplicate entitlements gracefully
        const { data: mainEntitlement, error: mainEntitlementError } = await supabase
          .from('user_entitlements')
          .upsert({
            user_id: effectiveUserId,
            product_id: PRODUCT_IDS['pmu-profit-system'],
            source_type: 'purchase',
            source_id: purchaseId,
            valid_from: now,
            is_active: true,
            created_at: now,
            updated_at: now
          }, {
            onConflict: 'user_id,product_id',
            ignoreDuplicates: false
          })
          .select()
          .single();
          
        if (mainEntitlementError) {
          console.error('[entitlements] Error creating main product entitlement:', mainEntitlementError);
          throw new Error(`Failed to create main product entitlement: ${mainEntitlementError.message}`);
        }
        
        console.log('[entitlements] Created/updated main product entitlement:', mainEntitlement.id);
        entitlements.push(mainEntitlement);
      } catch (error) {
        console.error('[entitlements] Error creating main product entitlement:', error);
        // Continue with other entitlements even if this one fails
      }
      
      // Check if we should include the ad generator
      if (paymentIntent.metadata?.includeAdGenerator === 'true') {
        console.log('[entitlements] Creating entitlement for ad generator');
        
        try {
          // Use upsert instead of insert to handle duplicate entitlements gracefully
          const { data: adGeneratorEntitlement, error: adGeneratorError } = await supabase
            .from('user_entitlements')
            .upsert({
              user_id: effectiveUserId,
              product_id: PRODUCT_IDS['pmu-ad-generator'],
              source_type: 'purchase',
              source_id: purchaseId,
              valid_from: now,
              is_active: true,
              created_at: now,
              updated_at: now
            }, {
              onConflict: 'user_id,product_id',
              ignoreDuplicates: false
            })
            .select()
            .single();
            
          if (adGeneratorError) {
            console.error('[entitlements] Error creating ad generator entitlement:', adGeneratorError);
            // Don't throw an error, just log it and continue
          } else {
            console.log('[entitlements] Created/updated ad generator entitlement:', adGeneratorEntitlement.id);
            entitlements.push(adGeneratorEntitlement);
          }
        } catch (error) {
          console.error('[entitlements] Error creating ad generator entitlement:', error);
          // Continue with other entitlements even if this one fails
        }
      }
      
      // Check if we should include the blueprint
      if (paymentIntent.metadata?.includeBlueprint === 'true') {
        console.log('[entitlements] Creating entitlement for blueprint');
        
        try {
          // Use upsert instead of insert to handle duplicate entitlements gracefully
          const { data: blueprintEntitlement, error: blueprintError } = await supabase
            .from('user_entitlements')
            .upsert({
              user_id: effectiveUserId,
              product_id: PRODUCT_IDS['consultation-success-blueprint'],
              source_type: 'purchase',
              source_id: purchaseId,
              valid_from: now,
              is_active: true,
              created_at: now,
              updated_at: now
            }, {
              onConflict: 'user_id,product_id',
              ignoreDuplicates: false
            })
            .select()
            .single();
            
          if (blueprintError) {
            console.error('[entitlements] Error creating blueprint entitlement:', blueprintError);
            // Don't throw an error, just log it and continue
          } else {
            console.log('[entitlements] Created/updated blueprint entitlement:', blueprintEntitlement.id);
            entitlements.push(blueprintEntitlement);
          }
        } catch (error) {
          console.error('[entitlements] Error creating blueprint entitlement:', error);
          // Continue with other entitlements even if this one fails
        }
      }
    }
    
    // Update the purchase status to completed and mark entitlements as created
    try {
      const { error: updateError } = await supabase
        .from('purchases')
        .update({ 
          status: 'completed', 
          entitlements_created: true,
          updated_at: now
        })
        .eq('id', purchaseId);
        
      if (updateError) {
        console.error('[entitlements] Error updating purchase status:', updateError);
        // Don't throw an error, just log it and continue
      } else {
        console.log(`[entitlements] Updated purchase status to completed for purchase ${purchaseId}`);
      }
    } catch (error) {
      console.error('[entitlements] Error updating purchase status:', error);
      // Continue even if the update fails
    }
    
    return {
      success: true,
      message: `Created ${entitlements.length} entitlements for user ${effectiveUserId}`,
      entitlements
    };
  } catch (error) {
    console.error('[entitlements] Error creating entitlements from payment intent:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error creating entitlements'
    };
  }
}

/**
 * Creates entitlements for a user based on a Stripe checkout session
 * @param sessionId The Stripe checkout session ID
 * @param userId Optional user ID to override the one in the session metadata
 * @param specificProductId Optional specific product ID to create entitlements for
 * @returns Object with success status and message
 */
export async function createEntitlementsFromCheckoutSession(
  sessionId: string,
  userId?: string,
  specificProductId?: string | null
): Promise<{
  success: boolean;
  message: string;
  entitlements?: any[];
}> {
  console.log(`[entitlements] Creating entitlements from checkout session ${sessionId}${specificProductId ? ` for user ${userId} and specific product ${specificProductId}` : ''}`);
  
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
    
    // Check if this is an add-on purchase
    if (specificProductId) {
      console.log(`[entitlements] Processing add-on purchase for product: ${specificProductId}`);
      
      // Check if we already have a purchase record for this session
      const { data: existingPurchase, error: queryError } = await supabase
        .from('purchases')
        .select('*')
        .eq('stripe_checkout_session_id', sessionId)
        .single();
        
      if (queryError && queryError.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is expected
        console.error('[entitlements] Error checking existing purchase:', queryError);
      }
      
      let purchaseId = existingPurchase?.id;
      
      // If no purchase record exists, create one
      if (!purchaseId) {
        console.log('[entitlements] Creating new purchase record for add-on');
        
        // Determine product details
        const productId = specificProductId;
        let amount = 0;
        
        if (productId === 'consultation-success-blueprint') {
          amount = 33;
        } else if (productId === 'pricing-template') {
          amount = 27;
        } else if (productId === 'pmu-ad-generator') {
          amount = 27;
        } else {
          console.error(`[entitlements] Unknown product ID: ${productId}`);
          return { success: false, message: `Unknown product ID: ${productId}` };
        }
        
        // Create purchase record
        const { data: newPurchase, error: createError } = await supabase
          .from('purchases')
          .insert({
            user_id: customerId,
            product_id: productId,
            amount: amount,
            status: 'completed',
            stripe_checkout_session_id: sessionId,
            stripe_payment_intent_id: session.payment_intent as string,
          })
          .select()
          .single();
          
        if (createError || !newPurchase) {
          console.error('[entitlements] Failed to create purchase record:', createError);
          return { success: false, message: `Failed to create purchase record: ${createError?.message}` };
        }
        
        console.log(`[entitlements] Created purchase record: ${newPurchase.id}`);
        purchaseId = newPurchase.id;
      }
      
      // Create entitlement for the add-on product
      const now = new Date().toISOString();
      const productId = specificProductId;
      const normalizedProductId = normalizeProductId(productId);
      
      console.log(`[entitlements] Creating entitlement for product: ${productId} (normalized: ${normalizedProductId})`);
      
      const { data: entitlement, error: entitlementError } = await supabase
        .from('user_entitlements')
        .insert({
          user_id: customerId,
          product_id: normalizedProductId,
          source_type: 'purchase',
          source_id: purchaseId,
          valid_from: now,
          is_active: true
        })
        .select()
        .single();
        
      if (entitlementError) {
        console.error('[entitlements] Error creating entitlement:', entitlementError);
        return { success: false, message: `Failed to create entitlement: ${entitlementError.message}` };
      }
      
      console.log('[entitlements] Created entitlement:', entitlement);
      
      // Update purchase status to indicate entitlements were created
      const { error: updateError } = await supabase
        .from('purchases')
        .update({ entitlements_created: true })
        .eq('id', purchaseId);
        
      if (updateError) {
        console.error('[entitlements] Error updating purchase status:', updateError);
      }
      
      return { success: true, message: 'Add-on purchase processed successfully', entitlements: [entitlement] };
    }
    
    // Continue with existing code for regular purchases
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
    console.error('[entitlements] Error creating entitlements from checkout session:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
} 