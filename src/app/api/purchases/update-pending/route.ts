import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

// Force this route to be dynamic
export const dynamic = 'force-dynamic';

/**
 * API route to update all pending purchases to completed for a specific user
 * @param req The request object
 * @returns A JSON response with the result of the operation
 */
export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    const { userId } = body;
    
    // Validate the required parameters
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: 'User ID is required' 
      }, { status: 400 });
    }
    
    // Initialize Supabase client
    const supabase = getServiceSupabase();
    
    if (!supabase) {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to initialize Supabase client' 
      }, { status: 500 });
    }
    
    // Update all pending purchases to completed
    const { data, error } = await supabase
      .from('purchases')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('status', 'pending')
      .select();
    
    if (error) {
      console.error('Error updating pending purchases:', error);
      return NextResponse.json({ 
        success: false, 
        message: `Failed to update pending purchases: ${error.message}` 
      }, { status: 500 });
    }
    
    console.log(`Updated ${data?.length || 0} pending purchases to completed for user ${userId}`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Updated ${data?.length || 0} pending purchases to completed`,
      updatedCount: data?.length || 0,
      purchases: data
    });
  } catch (error) {
    console.error('Error updating pending purchases:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error updating pending purchases' 
    }, { status: 500 });
  }
} 