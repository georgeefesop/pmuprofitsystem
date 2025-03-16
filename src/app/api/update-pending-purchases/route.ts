import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { normalizeProductId } from '@/lib/product-ids';

// Force this route to be dynamic
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    const { userId, paymentIntentId, productId } = body;
    
    console.log('Updating pending purchases:', {
      userId,
      paymentIntentId,
      productId
    });
    
    // Validate required fields
    if (!userId || !paymentIntentId) {
      return NextResponse.json(
        { success: false, error: 'User ID and payment intent ID are required' },
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
    
    // Find pending purchases with this payment intent ID
    const { data: pendingPurchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', userId)
      .eq('stripe_payment_intent_id', paymentIntentId)
      .eq('status', 'pending');
    
    if (purchasesError) {
      console.error('Error finding pending purchases:', purchasesError);
      return NextResponse.json(
        { success: false, error: 'Error finding pending purchases' },
        { status: 500 }
      );
    }
    
    console.log(`Found ${pendingPurchases.length} pending purchases`);
    
    if (pendingPurchases.length === 0) {
      // No pending purchases found, check if there are any completed purchases
      const { data: completedPurchases, error: completedError } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', userId)
        .eq('stripe_payment_intent_id', paymentIntentId)
        .eq('status', 'completed');
      
      if (completedError) {
        console.error('Error finding completed purchases:', completedError);
      } else if (completedPurchases && completedPurchases.length > 0) {
        console.log(`Found ${completedPurchases.length} already completed purchases`);
        
        // Check if entitlements exist for these purchases
        const purchaseIds = completedPurchases.map(p => p.id);
        const { data: existingEntitlements, error: entitlementsError } = await supabase
          .from('user_entitlements')
          .select('*')
          .eq('user_id', userId)
          .in('source_id', purchaseIds);
        
        if (entitlementsError) {
          console.error('Error checking for existing entitlements:', entitlementsError);
        } else if (existingEntitlements && existingEntitlements.length > 0) {
          console.log(`Found ${existingEntitlements.length} existing entitlements`);
          return NextResponse.json({
            success: true,
            message: 'Purchases already completed and entitlements exist',
            purchases: completedPurchases,
            entitlements: existingEntitlements
          });
        } else {
          // Purchases are completed but no entitlements exist, create them
          console.log('Purchases are completed but no entitlements exist, creating them');
          const entitlements = await createEntitlementsForPurchases(supabase, completedPurchases, userId, productId);
          
          return NextResponse.json({
            success: true,
            message: 'Created entitlements for already completed purchases',
            purchases: completedPurchases,
            entitlements
          });
        }
      }
      
      // If we get here, no pending or completed purchases were found
      return NextResponse.json(
        { success: false, error: 'No pending purchases found' },
        { status: 404 }
      );
    }
    
    // Update the pending purchases to completed
    const now = new Date().toISOString();
    const updatedPurchases = [];
    
    for (const purchase of pendingPurchases) {
      const { data: updatedPurchase, error: updateError } = await supabase
        .from('purchases')
        .update({
          status: 'completed',
          updated_at: now,
          entitlements_created: true
        })
        .eq('id', purchase.id)
        .select()
        .single();
      
      if (updateError) {
        console.error(`Error updating purchase ${purchase.id}:`, updateError);
      } else {
        console.log(`Updated purchase ${purchase.id} to completed`);
        updatedPurchases.push(updatedPurchase);
      }
    }
    
    // Create entitlements for the updated purchases
    const entitlements = await createEntitlementsForPurchases(supabase, updatedPurchases, userId, productId);
    
    return NextResponse.json({
      success: true,
      message: `Updated ${updatedPurchases.length} purchases and created ${entitlements.length} entitlements`,
      purchases: updatedPurchases,
      entitlements
    });
  } catch (error) {
    console.error('Error updating pending purchases:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to create entitlements for purchases
 */
async function createEntitlementsForPurchases(supabase: any, purchases: any[], userId: string, specificProductId?: string) {
  const entitlements = [];
  const now = new Date().toISOString();
  
  for (const purchase of purchases) {
    // Determine which product ID to use
    let productId = specificProductId || purchase.product_id;
    
    // Normalize the product ID
    const normalizedProductId = normalizeProductId(productId);
    
    // Check if an entitlement already exists
    const { data: existingEntitlement, error: checkError } = await supabase
      .from('user_entitlements')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', normalizedProductId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking for existing entitlement:', checkError);
      continue;
    }
    
    if (existingEntitlement) {
      console.log(`Entitlement already exists for product ${normalizedProductId}`);
      entitlements.push(existingEntitlement);
      continue;
    }
    
    // Create the entitlement
    const { data: entitlement, error: entitlementError } = await supabase
      .from('user_entitlements')
      .insert({
        user_id: userId,
        product_id: normalizedProductId,
        source_type: 'purchase',
        source_id: purchase.id,
        valid_from: now,
        is_active: true
      })
      .select()
      .single();
    
    if (entitlementError) {
      console.error(`Error creating entitlement for product ${normalizedProductId}:`, entitlementError);
    } else {
      console.log(`Created entitlement for product ${normalizedProductId}`);
      entitlements.push(entitlement);
    }
  }
  
  return entitlements;
} 