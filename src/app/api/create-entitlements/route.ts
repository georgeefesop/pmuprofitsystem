import { NextRequest, NextResponse } from 'next/server';
import { createEntitlementsFromStripeSession } from '@/lib/entitlements';

// Force this route to be dynamic since it uses request.url
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Get the session ID and user ID from the query parameters
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');
    const userId = searchParams.get('user_id');
    
    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: 'Session ID or Payment Intent ID is required' },
        { status: 400 }
      );
    }
    
    // Determine if it's a payment intent ID or checkout session ID
    const idType = sessionId.startsWith('pi_') ? 'payment intent' : 'checkout session';
    console.log(`[create-entitlements] Creating entitlements for ${idType} ${sessionId}${userId ? ` and user ${userId}` : ''}`);
    
    // Call the shared utility function to create entitlements
    // The function will automatically detect if it's a payment intent ID or checkout session ID
    const result = await createEntitlementsFromStripeSession(sessionId, userId || undefined);
    
    console.log(`[create-entitlements] Result: ${JSON.stringify(result)}`);
    
    // Return the result
    return NextResponse.json(result);
  } catch (error) {
    console.error('[create-entitlements] Error creating entitlements:', error);
    
    let errorMessage = 'Failed to create entitlements';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
} 