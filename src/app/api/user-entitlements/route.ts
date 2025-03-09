import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { getServiceSupabase } from "@/lib/supabase";
import { supabase as clientSupabase } from "@/utils/supabase/client";

/**
 * API route to fetch user entitlements using the service role client to bypass RLS
 * This provides a more robust way to get entitlements than relying on cookies
 */
export async function GET(req: NextRequest) {
  console.log('API: Fetching user entitlements');
  
  // First get the user session using the regular client
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  try {
    // Get the current user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('API: Error getting session:', sessionError);
      return NextResponse.json({ error: 'Error getting session' }, { status: 500 });
    }
    
    if (!session) {
      console.log('API: No active session found');
      return NextResponse.json({ authenticated: false, message: 'No active session' }, { status: 401 });
    }
    
    const userId = session.user.id;
    console.log(`API: Found authenticated user: ${userId}`);
    
    // Use the service role client to bypass RLS
    const serviceClient = await createServiceClient();
    
    // Get the user's entitlements using the service client
    console.log(`API: Querying entitlements for user ${userId} with service client`);
    const { data: entitlements, error: entitlementsError } = await serviceClient
      .from('user_entitlements')
      .select('*, products:product_id(*)')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (entitlementsError) {
      console.error('API: Error getting entitlements:', entitlementsError);
      return NextResponse.json({ error: 'Error getting entitlements' }, { status: 500 });
    }
    
    console.log(`API: Found ${entitlements?.length || 0} entitlements for user ${userId}`);
    
    // Return the user's entitlements
    return NextResponse.json({
      authenticated: true,
      userId,
      entitlements,
      entitlementCount: entitlements?.length || 0,
    }, { status: 200 });
  } catch (error) {
    console.error('API: Unexpected error in user-entitlements route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 