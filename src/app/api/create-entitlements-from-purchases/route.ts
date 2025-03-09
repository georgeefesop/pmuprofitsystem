import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/server';
import { PRODUCT_IDS } from '@/lib/product-ids';

/**
 * API route to create entitlements from purchases
 * This is called asynchronously when a user has purchases but no entitlements
 */
export async function POST(req: NextRequest) {
  console.log('API: Creating entitlements from purchases');
  
  // Get user ID from request headers or query params
  const userIdHeader = req.headers.get('x-user-id');
  const url = new URL(req.url);
  const queryUserId = url.searchParams.get('userId');
  const userId = userIdHeader || queryUserId;
  
  if (!userId) {
    console.error('API: No user ID provided');
    return NextResponse.json({ error: 'No user ID provided' }, { status: 400 });
  }
  
  console.log(`API: Creating entitlements for user: ${userId}`);
  
  try {
    // Use the service role client to bypass RLS
    const serviceClient = await createServiceClient();
    
    // Get the user's purchases
    const { data: purchases, error: purchasesError } = await serviceClient
      .from('purchases')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });
    
    if (purchasesError) {
      console.error('API: Error getting purchases:', purchasesError);
      return NextResponse.json({ error: 'Error getting purchases' }, { status: 500 });
    }
    
    if (!purchases || purchases.length === 0) {
      console.log(`API: No purchases found for user ${userId}`);
      return NextResponse.json({ message: 'No purchases found' }, { status: 200 });
    }
    
    console.log(`API: Found ${purchases.length} purchases for user ${userId}`);
    
    // Check if user already has entitlements
    const { data: existingEntitlements, error: entitlementsError } = await serviceClient
      .from('user_entitlements')
      .select('*')
      .eq('user_id', userId);
    
    if (entitlementsError) {
      console.error('API: Error checking existing entitlements:', entitlementsError);
      return NextResponse.json({ error: 'Error checking existing entitlements' }, { status: 500 });
    }
    
    if (existingEntitlements && existingEntitlements.length > 0) {
      console.log(`API: User already has ${existingEntitlements.length} entitlements`);
      return NextResponse.json({ 
        message: 'User already has entitlements',
        entitlementCount: existingEntitlements.length
      }, { status: 200 });
    }
    
    // Create entitlements for each purchase
    const createdEntitlements = [];
    const now = new Date().toISOString();
    
    for (const purchase of purchases) {
      console.log(`API: Processing purchase ${purchase.id}`);
      
      // Determine which products to create entitlements for
      let productIds = [];
      
      // If purchase has a product_id, use that
      if (purchase.product_id) {
        productIds.push(purchase.product_id);
      } else {
        // Otherwise, use the main product ID
        productIds.push(PRODUCT_IDS['pmu-profit-system']);
        
        // Check metadata for add-ons
        const metadata = purchase.metadata || {};
        if (metadata.include_ad_generator === true || metadata.includeAdGenerator === 'true') {
          productIds.push(PRODUCT_IDS['pmu-ad-generator']);
        }
        if (metadata.include_blueprint === true || metadata.includeBlueprint === 'true') {
          productIds.push(PRODUCT_IDS['consultation-success-blueprint']);
        }
      }
      
      // Create entitlements for each product
      for (const productId of productIds) {
        console.log(`API: Creating entitlement for product ${productId}`);
        
        const { data: entitlement, error: entitlementError } = await serviceClient
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
          console.error(`API: Error creating entitlement for product ${productId}:`, entitlementError);
        } else {
          console.log(`API: Created entitlement ${entitlement.id} for product ${productId}`);
          createdEntitlements.push(entitlement);
        }
      }
      
      // Update the purchase to mark entitlements as created
      const { error: updateError } = await serviceClient
        .from('purchases')
        .update({
          entitlements_created: true,
          updated_at: now
        })
        .eq('id', purchase.id);
      
      if (updateError) {
        console.error(`API: Error updating purchase ${purchase.id}:`, updateError);
      }
    }
    
    console.log(`API: Created ${createdEntitlements.length} entitlements for user ${userId}`);
    
    return NextResponse.json({
      success: true,
      entitlements: createdEntitlements,
      entitlementCount: createdEntitlements.length
    }, { status: 200 });
  } catch (error) {
    console.error('API: Error creating entitlements:', error);
    return NextResponse.json({ 
      error: 'Error creating entitlements',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 