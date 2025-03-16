import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { PRODUCT_IDS } from '@/lib/product-ids';

/**
 * API endpoint to check if a user has entitlements for a specific product
 * 
 * @param req - The Next.js request object
 * @returns A NextResponse with the entitlement status
 */
export async function POST(req: NextRequest) {
  try {
    // Create Supabase client with admin privileges
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    // Parse request body
    const { userId, productId } = await req.json();
    
    // Validate required parameters
    if (!userId || !productId) {
      return NextResponse.json(
        { error: 'Missing required parameters: userId and productId are required' },
        { status: 400 }
      );
    }
    
    console.log(`Checking entitlements for user ${userId} and product ${productId}`);
    
    // Query user_entitlements table for active entitlements
    const { data: entitlements, error } = await supabase
      .from('user_entitlements')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .eq('is_active', true);
    
    if (error) {
      console.error('Error querying entitlements:', error);
      return NextResponse.json(
        { error: 'Failed to check entitlements', details: error.message },
        { status: 500 }
      );
    }
    
    // Check if user has any active entitlements
    const hasEntitlement = entitlements && entitlements.length > 0;
    
    console.log(`User ${userId} has entitlement for product ${productId}: ${hasEntitlement}`);
    
    // Return entitlement status
    return NextResponse.json({
      hasEntitlement,
      entitlementCount: entitlements?.length || 0,
    });
  } catch (error) {
    console.error('Unexpected error in check-entitlements API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
 