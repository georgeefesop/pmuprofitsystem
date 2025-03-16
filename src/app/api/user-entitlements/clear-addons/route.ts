import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/server';
import { PRODUCT_IDS } from '@/lib/product-ids';

/**
 * API route to clear addon entitlements for a user
 * This will remove all entitlements except for the main product
 * and completely delete the addon purchases to allow re-purchasing
 * It will also clean up phantom entitlements and purchases
 */
export async function POST(req: NextRequest) {
  try {
    // Get the user ID from the request body
    const { userId } = await req.json();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: 'User ID is required' 
      }, { status: 400 });
    }
    
    console.log(`API: Clearing addon entitlements for user ${userId}`);
    
    // Create a service client to bypass RLS
    const serviceClient = await createServiceClient();
    
    // Get the main product ID to preserve
    const mainProductId = PRODUCT_IDS['pmu-profit-system'];
    
    // Get all addon product IDs
    const addonProductIds = Object.entries(PRODUCT_IDS)
      .filter(([key]) => key !== 'pmu-profit-system')
      .map(([_, value]) => value);
    
    console.log(`API: Preserving main product ID: ${mainProductId}`);
    console.log(`API: Removing addon product IDs: ${addonProductIds.join(', ')}`);
    
    // 1. First, get all user entitlements to analyze them
    const { data: allEntitlements, error: fetchAllError } = await serviceClient
      .from('user_entitlements')
      .select('id, product_id, source_id, source_type')
      .eq('user_id', userId);
    
    if (fetchAllError) {
      console.error('API: Error fetching all entitlements:', fetchAllError);
      return NextResponse.json({ 
        success: false, 
        message: `Error fetching all entitlements: ${fetchAllError.message}` 
      }, { status: 500 });
    }
    
    // 2. Get all user purchases to cross-reference
    const { data: allPurchases, error: fetchPurchasesError } = await serviceClient
      .from('purchases')
      .select('id, product_id, status')
      .eq('user_id', userId);
    
    if (fetchPurchasesError) {
      console.error('API: Error fetching all purchases:', fetchPurchasesError);
      return NextResponse.json({ 
        success: false, 
        message: `Error fetching all purchases: ${fetchPurchasesError.message}` 
      }, { status: 500 });
    }
    
    // Create sets for easier lookup
    const validProductIds = new Set([mainProductId, ...addonProductIds]);
    const purchaseIds = new Set(allPurchases.map(p => p.id));
    
    // Identify phantom entitlements (invalid product IDs or no corresponding purchase)
    const phantomEntitlements = allEntitlements.filter(e => {
      // Check if product ID is valid
      const hasValidProductId = validProductIds.has(e.product_id);
      
      // Check if source_type is purchase and source_id exists in purchases
      const hasValidPurchase = e.source_type !== 'purchase' || purchaseIds.has(e.source_id);
      
      return !hasValidProductId || !hasValidPurchase;
    });
    
    console.log(`API: Found ${phantomEntitlements.length} phantom entitlements to remove`);
    
    // 3. Delete phantom entitlements
    if (phantomEntitlements.length > 0) {
      const phantomIds = phantomEntitlements.map(e => e.id);
      const { error: phantomError } = await serviceClient
        .from('user_entitlements')
        .delete()
        .in('id', phantomIds);
      
      if (phantomError) {
        console.error('API: Error deleting phantom entitlements:', phantomError);
        return NextResponse.json({ 
          success: false, 
          message: `Error deleting phantom entitlements: ${phantomError.message}` 
        }, { status: 500 });
      }
      
      console.log(`API: Successfully removed ${phantomEntitlements.length} phantom entitlements`);
    }
    
    // 4. Get the current addon entitlements to count them (excluding phantoms)
    const { data: currentEntitlements, error: fetchError } = await serviceClient
      .from('user_entitlements')
      .select('id')
      .eq('user_id', userId)
      .in('product_id', addonProductIds);
    
    if (fetchError) {
      console.error('API: Error fetching addon entitlements:', fetchError);
      return NextResponse.json({ 
        success: false, 
        message: `Error fetching addon entitlements: ${fetchError.message}` 
      }, { status: 500 });
    }
    
    const entitlementsCount = currentEntitlements?.length || 0;
    console.log(`API: Found ${entitlementsCount} addon entitlements to remove`);
    
    // 5. Delete the addon entitlements
    const { error: entitlementsError } = await serviceClient
      .from('user_entitlements')
      .delete()
      .eq('user_id', userId)
      .in('product_id', addonProductIds);
    
    if (entitlementsError) {
      console.error('API: Error deleting addon entitlements:', entitlementsError);
      return NextResponse.json({ 
        success: false, 
        message: `Error deleting addon entitlements: ${entitlementsError.message}` 
      }, { status: 500 });
    }
    
    // 6. Identify phantom purchases (invalid product IDs or no corresponding entitlements)
    const validPurchaseProductIds = new Set([mainProductId, ...addonProductIds, 'pmu-profit-system', 'pmu-ad-generator', 'consultation-success-blueprint']);
    const phantomPurchases = allPurchases.filter(p => {
      // Check if product ID is valid (including string IDs)
      return !validPurchaseProductIds.has(p.product_id);
    });
    
    console.log(`API: Found ${phantomPurchases.length} phantom purchases to remove`);
    
    // 7. Delete phantom purchases
    if (phantomPurchases.length > 0) {
      const phantomPurchaseIds = phantomPurchases.map(p => p.id);
      const { error: phantomPurchaseError } = await serviceClient
        .from('purchases')
        .delete()
        .in('id', phantomPurchaseIds);
      
      if (phantomPurchaseError) {
        console.error('API: Error deleting phantom purchases:', phantomPurchaseError);
        return NextResponse.json({ 
          success: false, 
          message: `Error deleting phantom purchases: ${phantomPurchaseError.message}` 
        }, { status: 500 });
      }
      
      console.log(`API: Successfully removed ${phantomPurchases.length} phantom purchases`);
    }
    
    // 8. Get the current addon purchases to count them (excluding phantoms)
    const { data: currentPurchases, error: fetchAddonPurchasesError } = await serviceClient
      .from('purchases')
      .select('id')
      .eq('user_id', userId)
      .neq('product_id', mainProductId)
      .not('product_id', 'eq', 'pmu-profit-system');
    
    if (fetchAddonPurchasesError) {
      console.error('API: Error fetching addon purchases:', fetchAddonPurchasesError);
      return NextResponse.json({ 
        success: false, 
        message: `Error fetching addon purchases: ${fetchAddonPurchasesError.message}` 
      }, { status: 500 });
    }
    
    const purchasesCount = currentPurchases?.length || 0;
    console.log(`API: Found ${purchasesCount} addon purchases to delete`);
    
    // 9. DELETE purchases for addons
    const { error: purchasesError } = await serviceClient
      .from('purchases')
      .delete()
      .eq('user_id', userId)
      .neq('product_id', mainProductId)
      .not('product_id', 'eq', 'pmu-profit-system');
    
    if (purchasesError) {
      console.error('API: Error deleting addon purchases:', purchasesError);
      return NextResponse.json({ 
        success: false, 
        message: `Error deleting addon purchases: ${purchasesError.message}` 
      }, { status: 500 });
    }
    
    // 10. Update the main product purchase to remove addon flags from metadata
    const { error: updateMetadataError } = await serviceClient
      .from('purchases')
      .update({
        metadata: {
          include_ad_generator: false,
          include_blueprint: false
        },
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .or(`product_id.eq.${mainProductId},product_id.eq.pmu-profit-system`);
    
    if (updateMetadataError) {
      console.error('API: Error updating purchase metadata:', updateMetadataError);
      return NextResponse.json({ 
        success: false, 
        message: `Error updating purchase metadata: ${updateMetadataError.message}` 
      }, { status: 500 });
    }
    
    console.log(`API: Successfully removed ${entitlementsCount} addon entitlements, ${phantomEntitlements.length} phantom entitlements, ${purchasesCount} addon purchases, and ${phantomPurchases.length} phantom purchases`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully cleaned up user entitlements and purchases`,
      entitlementsRemoved: entitlementsCount,
      phantomEntitlementsRemoved: phantomEntitlements.length,
      purchasesDeleted: purchasesCount,
      phantomPurchasesDeleted: phantomPurchases.length
    }, { status: 200 });
    
  } catch (error) {
    console.error('API: Unexpected error in clear-addons route:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 