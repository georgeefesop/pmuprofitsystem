import { NextRequest, NextResponse } from 'next/server';
import { createEntitlementsFromStripeSession } from '@/lib/entitlements';
import { updatePurchaseStatus } from '@/lib/purchases';

// Force this route to be dynamic
export const dynamic = 'force-dynamic';

/**
 * API route to create entitlements for a user based on a Stripe session or payment intent
 * @param req The request object
 * @returns A JSON response with the result of the operation
 */
export async function GET(req: NextRequest) {
  try {
    // Get the session ID and user ID from the query parameters
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('session_id');
    const userId = url.searchParams.get('user_id');
    const productId = url.searchParams.get('product_id');
    
    // Validate the required parameters
    if (!sessionId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Session ID is required' 
      }, { status: 400 });
    }
    
    console.log(`API: Creating entitlements for session ${sessionId}${userId ? ` and user ${userId}` : ''}${productId ? ` for product ${productId}` : ''}`);
    
    // Create entitlements for the user
    const result = await createEntitlementsFromStripeSession(
      sessionId,
      userId || undefined,
      productId || undefined
    );
    
    if (!result.success) {
      console.error(`API: Failed to create entitlements: ${result.message}`);
      
      // If the error is about duplicate entitlements, return a 200 response
      // since this is not a critical error (the user already has the entitlement)
      if (result.message.includes('duplicate key value') || 
          result.message.includes('already has') || 
          result.message.includes('already exists')) {
        
        console.log('API: Duplicate entitlement detected, updating purchase status to completed');
        
        // Update the purchase status to completed even if entitlements already exist
        try {
          if (sessionId.startsWith('pi_')) {
            const updateResult = await updatePurchaseStatus(sessionId, 'completed');
            console.log(`API: Purchase status update result: ${updateResult.success ? 'success' : 'failed'}`);
          }
        } catch (updateError) {
          console.error('API: Error updating purchase status:', updateError);
          // Don't fail the whole operation if status update fails
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'User already has the required entitlements',
          entitlements: result.entitlements || []
        });
      }
      
      return NextResponse.json({ 
        success: false, 
        message: result.message 
      }, { status: 500 });
    }
    
    // Update the purchase status to completed
    try {
      if (sessionId.startsWith('pi_')) {
        console.log(`API: Updating purchase status for payment intent ${sessionId}`);
        const updateResult = await updatePurchaseStatus(sessionId, 'completed');
        console.log(`API: Purchase status update result: ${updateResult.success ? 'success' : 'failed'}`);
      }
    } catch (updateError) {
      console.error('API: Error updating purchase status:', updateError);
      // Don't fail the whole operation if status update fails
    }
    
    return NextResponse.json({ 
      success: true, 
      message: result.message,
      entitlements: result.entitlements || []
    });
  } catch (error) {
    console.error('API: Error creating entitlements:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error creating entitlements' 
    }, { status: 500 });
  }
} 