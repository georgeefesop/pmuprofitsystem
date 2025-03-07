import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { createEntitlementsFromStripeSession } from '@/lib/entitlements';
import { PRODUCT_IDS } from '@/lib/product-ids';
import { stripe, safeStripeOperation } from '@/lib/stripe';

// Force this route to be dynamic since it uses request.url
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Get the session ID and user ID from the query parameters
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');
    const userId = searchParams.get('user_id');
    
    if (!sessionId || !userId) {
      return NextResponse.json(
        { success: false, message: 'Session ID and User ID are required' },
        { status: 400 }
      );
    }
    
    console.log(`[auto-approve] Auto-approving purchase for session ${sessionId} and user ${userId}`);
    
    // Get the Supabase client
    const supabase = getServiceSupabase();
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client');
    }
    
    // Check if we already have entitlements for this user
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
    
    // Determine if this is a checkout session ID or payment intent ID
    const isPaymentIntent = sessionId.startsWith('pi_');
    
    // If it's a payment intent, get the details to determine what was purchased
    let includeAdGenerator = false;
    let includeBlueprint = false;
    let amount = 3700; // Default to main product price in cents
    
    if (isPaymentIntent) {
      try {
        const paymentIntent = await safeStripeOperation(() => 
          stripe.paymentIntents.retrieve(sessionId, {
            expand: ['metadata']
          })
        );
        
        if (paymentIntent && paymentIntent.metadata) {
          includeAdGenerator = paymentIntent.metadata.includeAdGenerator === 'true';
          includeBlueprint = paymentIntent.metadata.includeBlueprint === 'true';
          amount = paymentIntent.amount || 3700;
        }
      } catch (error) {
        console.error('[auto-approve] Error retrieving payment intent:', error);
        // Continue with default values
      }
    } else {
      try {
        const session = await safeStripeOperation(() => 
          stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['metadata']
          })
        );
        
        if (session && session.metadata) {
          includeAdGenerator = session.metadata.includeAdGenerator === 'true';
          includeBlueprint = session.metadata.includeBlueprint === 'true';
          amount = session.amount_total || 3700;
        }
      } catch (error) {
        console.error('[auto-approve] Error retrieving checkout session:', error);
        // Continue with default values
      }
    }
    
    // Check if we have a purchase record for this session
    const { data: purchaseData, error: purchaseError } = await supabase
      .from('purchases')
      .select('*')
      .or(`stripe_checkout_session_id.eq.${sessionId},stripe_payment_intent_id.eq.${sessionId}`)
      .eq('user_id', userId)
      .single();
      
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
    } else {
      console.log('[auto-approve] No existing purchase found, creating a new one');
      
      // Create a new purchase record with the main product ID
      const { data: newPurchase, error: createError } = await supabase
        .from('purchases')
        .insert({
          user_id: userId,
          product_id: PRODUCT_IDS['pmu-profit-system'], // Always include the main product
          [isPaymentIntent ? 'stripe_payment_intent_id' : 'stripe_checkout_session_id']: sessionId,
          status: 'completed',
          amount: amount / 100, // Convert from cents to dollars
          include_ad_generator: includeAdGenerator,
          include_blueprint: includeBlueprint,
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
    const entitlementResult = await createEntitlementsFromStripeSession(sessionId, userId);
    
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