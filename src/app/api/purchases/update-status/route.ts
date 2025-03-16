import { NextRequest, NextResponse } from 'next/server';
import { updatePurchaseStatus } from '@/lib/purchases';

// Force this route to be dynamic
export const dynamic = 'force-dynamic';

/**
 * API route to update the status of a purchase
 * @param req The request object
 * @returns A JSON response with the result of the operation
 */
export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    const { paymentIntentId, status } = body;
    
    // Validate the required parameters
    if (!paymentIntentId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Payment intent ID is required' 
      }, { status: 400 });
    }
    
    if (!status) {
      return NextResponse.json({ 
        success: false, 
        message: 'Status is required' 
      }, { status: 400 });
    }
    
    // Validate the status value
    const validStatuses = ['pending', 'completed', 'failed', 'refunded'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        success: false, 
        message: `Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}` 
      }, { status: 400 });
    }
    
    // Update the purchase status
    const result = await updatePurchaseStatus(
      paymentIntentId, 
      status as 'pending' | 'completed' | 'failed' | 'refunded'
    );
    
    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        message: result.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: result.message,
      purchase: result.purchase
    });
  } catch (error) {
    console.error('Error updating purchase status:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error updating purchase status' 
    }, { status: 500 });
  }
} 