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
        { success: false, message: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`[create-entitlements] Creating entitlements for session ${sessionId}${userId ? ` and user ${userId}` : ''}`);
    
    // Call the shared utility function to create entitlements
    const result = await createEntitlementsFromStripeSession(sessionId, userId || undefined);
    
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