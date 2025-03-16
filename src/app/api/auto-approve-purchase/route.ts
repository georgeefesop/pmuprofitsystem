import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { createEntitlementsFromStripeSession } from '@/lib/entitlements';
import { PRODUCT_IDS, normalizeProductId } from '@/lib/product-ids';
import { stripe, safeStripeOperation } from '@/lib/stripe';

// Force this route to be dynamic since it uses request.url
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Get the session ID and user ID from the query parameters
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');
    const paymentIntentId = searchParams.get('payment_intent_id');
    const userId = searchParams.get('user_id');
    const productId = searchParams.get('product_id');
    
    // We need either a session ID or a payment intent ID
    if ((!sessionId && !paymentIntentId) || !userId) {
      return NextResponse.json(
        { success: false, message: 'Session ID or Payment Intent ID, and User ID are required' },
        { status: 400 }
      );
    }
    
    // Use payment intent ID if provided, otherwise use session ID
    const id = paymentIntentId || sessionId;
    const idType = paymentIntentId ? 'payment intent' : 'session';
    
    console.log(`[auto-approve] Auto-approving purchase for ${idType} ${id} and user ${userId}${productId ? ` for product ${productId}` : ''}`);
    
    // Get the Supabase client
    const supabase = getServiceSupabase();
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client');
    }
    
    // If a specific product ID is provided, check if the user already has an entitlement for it
    if (productId) {
      const normalizedProductId = normalizeProductId(productId);
      
      console.log(`[auto-approve] Checking for existing entitlement for product ${productId} (normalized: ${normalizedProductId})`);
      
      const { data: existingEntitlement, error: entitlementError } = await supabase
        .from('user_entitlements')
        .select('*')
        .eq('user_id', userId)
        .eq('product_id', normalizedProductId)
        .eq('is_active', true)
        .single();
        
      if (entitlementError && entitlementError.code !== 'PGRST116') {
        console.error('[auto-approve] Error checking for existing entitlement:', entitlementError);
      } else if (existingEntitlement) {
        console.log(`[auto-approve] User already has an active entitlement for product ${productId}`);
        return NextResponse.json({
          success: true,
          message: `User already has an active entitlement for product ${productId}`,
          entitlement: existingEntitlement
        });
      }
    } else {
      // If no specific product ID, check for any active entitlements
      const { data: existingEntitlements, error: entitlementsError } = await supabase
        .from('user_entitlements')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);
        
      if (entitlementsError) {
        console.error('[auto-approve] Error checking for existing entitlements:', entitlementsError);
      } else if (existingEntitlements && existingEntitlements.length > 0) {
        console.log(`[auto-approve] User already has ${existingEntitlements.length} active entitlements`);
        return NextResponse.json({
          success: true,
          message: `User already has ${existingEntitlements.length} active entitlements`,
          entitlements: existingEntitlements
        });
      }
    }
    
    // Determine if this is a checkout session ID or payment intent ID
    const isPaymentIntent = paymentIntentId !== null || (sessionId && sessionId.startsWith('pi_'));
    const actualId = isPaymentIntent ? (paymentIntentId || sessionId) : sessionId;
    
    // If it's a payment intent, get the details to determine what was purchased
    let includeAdGenerator = false;
    let includeBlueprint = false;
    let amount = 3700; // Default to main product price in cents
    let specificProductId = productId || null;
    
    if (isPaymentIntent) {
      try {
        const paymentIntent = await safeStripeOperation(() => 
          stripe.paymentIntents.retrieve(actualId!)
        );
        
        if (paymentIntent && paymentIntent.metadata) {
          includeAdGenerator = paymentIntent.metadata.includeAdGenerator === 'true';
          includeBlueprint = paymentIntent.metadata.includeBlueprint === 'true';
          amount = paymentIntent.amount || 3700;
          
          // Check if there's a specific product ID in the metadata
          if (paymentIntent.metadata.productId && !specificProductId) {
            specificProductId = paymentIntent.metadata.productId;
            console.log(`[auto-approve] Found product ID in payment intent metadata: ${specificProductId}`);
          }
        }
      } catch (error) {
        console.error('[auto-approve] Error retrieving payment intent:', error);
        // Continue with default values
      }
    } else {
      try {
        const session = await safeStripeOperation(() => 
          stripe.checkout.sessions.retrieve(actualId!)
        );
        
        if (session && session.metadata) {
          includeAdGenerator = session.metadata.includeAdGenerator === 'true';
          includeBlueprint = session.metadata.includeBlueprint === 'true';
          amount = session.amount_total || 3700;
          
          // Check if there's a specific product ID in the metadata
          if (session.metadata.productId && !specificProductId) {
            specificProductId = session.metadata.productId;
            console.log(`[auto-approve] Found product ID in session metadata: ${specificProductId}`);
          }
        }
      } catch (error) {
        console.error('[auto-approve] Error retrieving checkout session:', error);
        // Continue with default values
      }
    }
    
    // Check if we have a purchase record for this session/payment intent
    let query = supabase
      .from('purchases')
      .select('*')
      .eq('user_id', userId);
      
    if (isPaymentIntent) {
      query = query.eq('stripe_payment_intent_id', actualId!);
    } else {
      query = query.eq('stripe_checkout_session_id', actualId!);
    }
    
    const { data: purchaseData, error: purchaseError } = await query.single();
      
    if (purchaseError && purchaseError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" which is expected if no purchase exists
      console.error('[auto-approve] Error checking for existing purchase:', purchaseError);
    }
    
    // If we found a purchase, update its status and create entitlements
    if (purchaseData) {
      console.log('[auto-approve] Found existing purchase:', purchaseData.id);
      
      // Update the purchase status to completed
      const { error: updateError } = await supabase
        .from('purchases')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', purchaseData.id);
        
      if (updateError) {
        console.error('[auto-approve] Error updating purchase status:', updateError);
        return NextResponse.json({
          success: false,
          message: `Failed to update purchase status: ${updateError.message}`
        }, { status: 500 });
      }
      
      console.log('[auto-approve] Updated purchase status to completed');
      
      // If we have a specific product ID, use it for the purchase record
      if (specificProductId && purchaseData.product_id !== specificProductId) {
        const { error: productUpdateError } = await supabase
          .from('purchases')
          .update({ 
            product_id: specificProductId
          })
          .eq('id', purchaseData.id);
          
        if (productUpdateError) {
          console.error('[auto-approve] Error updating purchase product ID:', productUpdateError);
        } else {
          console.log(`[auto-approve] Updated purchase product ID to ${specificProductId}`);
        }
      }
    } else {
      console.log('[auto-approve] No existing purchase found, creating a new one');
      
      // Determine the product ID to use
      const purchaseProductId = specificProductId || PRODUCT_IDS['pmu-profit-system'];
      
      // Create a new purchase record
      const { data: newPurchase, error: createError } = await supabase
        .from('purchases')
        .insert({
          user_id: userId,
          product_id: purchaseProductId,
          [isPaymentIntent ? 'stripe_payment_intent_id' : 'stripe_checkout_session_id']: actualId,
          status: 'completed',
          amount: amount / 100, // Convert from cents to dollars
          metadata: {
            include_ad_generator: includeAdGenerator,
            include_blueprint: includeBlueprint,
            product_id: specificProductId
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (createError) {
        console.error('[auto-approve] Error creating purchase record:', createError);
        return NextResponse.json({
          success: false,
          message: `Failed to create purchase record: ${createError.message}`
        }, { status: 500 });
      }
      
      console.log('[auto-approve] Created new purchase record:', newPurchase.id);
    }
    
    // Create entitlements using the shared utility function
    console.log('[auto-approve] Creating entitlements for user');
    
    // If we have a specific product ID, pass it to the entitlement creation function
    const entitlementResult = await createEntitlementsFromStripeSession(
      actualId!, 
      userId,
      specificProductId
    );
    
    if (!entitlementResult.success) {
      console.error('[auto-approve] Error creating entitlements:', entitlementResult.message);
      return NextResponse.json({
        success: false,
        message: `Failed to create entitlements: ${entitlementResult.message}`
      }, { status: 500 });
    }
    
    console.log('[auto-approve] Successfully created entitlements');
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Purchase approved and entitlements created successfully',
      entitlements: entitlementResult.entitlements
    });
  } catch (error) {
    console.error('[auto-approve] Error auto-approving purchase:', error);
    
    let errorMessage = 'Failed to auto-approve purchase';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
} 