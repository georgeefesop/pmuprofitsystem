import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { normalizeProductId } from '@/lib/product-ids';

// Force this route to be dynamic
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    const { userId, productId, paymentIntentId, sessionId, purchaseId: existingPurchaseId } = body;
    
    console.log('Creating entitlement directly:', {
      userId,
      productId,
      paymentIntentId,
      sessionId,
      existingPurchaseId
    });
    
    // Validate required fields
    if (!userId || !productId) {
      return NextResponse.json(
        { success: false, error: 'User ID and product ID are required' },
        { status: 400 }
      );
    }
    
    // Initialize Supabase client
    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Failed to initialize Supabase client' },
        { status: 500 }
      );
    }
    
    // Normalize the product ID
    const normalizedProductId = normalizeProductId(productId);
    
    // Check if the entitlement already exists
    const { data: existingEntitlement, error: checkError } = await supabase
      .from('user_entitlements')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', normalizedProductId)
      .single();
      
    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" which is expected if no entitlement exists
      console.error('Error checking for existing entitlement:', checkError);
      return NextResponse.json(
        { success: false, error: 'Error checking for existing entitlement' },
        { status: 500 }
      );
    }
    
    // If entitlement already exists, return success
    if (existingEntitlement) {
      console.log('Entitlement already exists:', existingEntitlement);
      return NextResponse.json({
        success: true,
        message: 'Entitlement already exists',
        entitlement: existingEntitlement
      });
    }
    
    // Create a purchase record if it doesn't exist
    let purchaseId = existingPurchaseId;
    
    // If we have an existing purchase ID, check if it exists
    if (purchaseId) {
      const { data: existingPurchase, error: purchaseCheckError } = await supabase
        .from('purchases')
        .select('*')
        .eq('id', purchaseId)
        .single();
        
      if (purchaseCheckError && purchaseCheckError.code !== 'PGRST116') {
        console.error('Error checking for existing purchase by ID:', purchaseCheckError);
      } else if (existingPurchase) {
        console.log('Found existing purchase by ID:', purchaseId);
      } else {
        // If the purchase ID doesn't exist, set it to null so we'll create a new one
        console.log('Purchase ID provided but not found:', purchaseId);
        purchaseId = null;
      }
    }
    
    // Check if a purchase record already exists for this payment intent or session
    if (!purchaseId && (paymentIntentId || sessionId)) {
      let query = supabase
        .from('purchases')
        .select('*');
        
      if (paymentIntentId) {
        query = query.eq('stripe_payment_intent_id', paymentIntentId);
      } else if (sessionId) {
        query = query.eq('stripe_checkout_session_id', sessionId);
      }
      
      const { data: existingPurchase, error: purchaseCheckError } = await query.single();
        
      if (purchaseCheckError && purchaseCheckError.code !== 'PGRST116') {
        console.error('Error checking for existing purchase:', purchaseCheckError);
      } else if (existingPurchase) {
        purchaseId = existingPurchase.id;
        console.log('Found existing purchase:', purchaseId);
      }
    }
    
    // If no purchase record exists, create one
    if (!purchaseId) {
      console.log('Creating new purchase record');
      
      const { data: newPurchase, error: createPurchaseError } = await supabase
        .from('purchases')
        .insert({
          user_id: userId,
          product_id: productId,
          amount: productId === 'pmu-ad-generator' ? 27 : 
                  productId === 'consultation-success-blueprint' ? 33 : 37,
          status: 'completed',
          stripe_payment_intent_id: paymentIntentId,
          stripe_checkout_session_id: sessionId,
          metadata: {
            created_at: new Date().toISOString(),
            direct_creation: true
          }
        })
        .select()
        .single();
        
      if (createPurchaseError || !newPurchase) {
        console.error('Error creating purchase record:', createPurchaseError);
        return NextResponse.json(
          { success: false, error: 'Failed to create purchase record' },
          { status: 500 }
        );
      }
      
      purchaseId = newPurchase.id;
      console.log('Created new purchase record:', purchaseId);
    }
    
    // Create the entitlement
    const now = new Date().toISOString();
    
    const { data: entitlement, error: entitlementError } = await supabase
      .from('user_entitlements')
      .insert({
        user_id: userId,
        product_id: normalizedProductId,
        source_type: 'purchase',
        source_id: purchaseId,
        valid_from: now,
        is_active: true
      })
      .select()
      .single();
      
    if (entitlementError) {
      console.error('Error creating entitlement:', entitlementError);
      return NextResponse.json(
        { success: false, error: 'Failed to create entitlement' },
        { status: 500 }
      );
    }
    
    console.log('Created entitlement:', entitlement);
    
    // Update purchase status
    const { error: updateError } = await supabase
      .from('purchases')
      .update({ 
        status: 'completed',
        updated_at: now,
        entitlements_created: true
      })
      .eq('id', purchaseId);
      
    if (updateError) {
      console.error('Error updating purchase status:', updateError);
      // Continue anyway, as the entitlement was created successfully
    }
    
    return NextResponse.json({
      success: true,
      message: 'Entitlement created successfully',
      entitlement
    });
  } catch (error) {
    console.error('Error creating entitlement directly:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 