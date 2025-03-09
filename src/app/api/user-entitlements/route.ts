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
  
  // Get user ID from multiple sources for reliability
  let userId: string | null = null;
  
  // 1. Try to get user ID from request headers (set by middleware)
  const userIdHeader = req.headers.get('x-user-id');
  if (userIdHeader) {
    console.log('API: Found user ID in request header:', userIdHeader);
    userId = userIdHeader;
  }
  
  // 2. If no user ID in headers, try to get it from the session
  if (!userId) {
    try {
      const cookieStore = cookies();
      const supabase = createClient(cookieStore);
      
      // Get the current user's session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('API: Error getting session:', sessionError);
      } else if (session?.user?.id) {
        console.log('API: Found user ID in session:', session.user.id);
        userId = session.user.id;
      } else {
        console.log('API: No session found');
      }
    } catch (error) {
      console.error('API: Error checking session:', error);
    }
  }
  
  // 3. If no user ID from headers or session, try to get it from URL query params
  if (!userId) {
    const url = new URL(req.url);
    const queryUserId = url.searchParams.get('userId');
    if (queryUserId) {
      console.log('API: Found user ID in query params:', queryUserId);
      userId = queryUserId;
    }
  }
  
  // 4. If still no user ID, check for access token directly in cookies
  if (!userId) {
    const accessToken = req.cookies.get('sb-access-token')?.value;
    if (accessToken) {
      console.log('API: Found access token in cookies, attempting to decode');
      try {
        // Simple JWT decode to get user ID from token payload
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        if (payload.sub) {
          console.log('API: Extracted user ID from token:', payload.sub);
          userId = payload.sub;
        }
      } catch (error) {
        console.error('API: Error decoding access token:', error);
      }
    }
  }
  
  // If still no user ID, return error
  if (!userId) {
    console.log('API: No user ID found, returning 401');
    return NextResponse.json({ 
      authenticated: false, 
      message: 'No user ID found. Please log in again.' 
    }, { status: 401 });
  }
  
  try {
    // Use the service role client to bypass RLS
    console.log(`API: Creating service client to fetch entitlements for user ${userId}`);
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
      return NextResponse.json({ 
        error: 'Error getting entitlements',
        details: entitlementsError.message
      }, { status: 500 });
    }
    
    console.log(`API: Found ${entitlements?.length || 0} entitlements for user ${userId}`);
    
    // If no entitlements found, check if the user has any purchases that might need entitlements
    if (!entitlements || entitlements.length === 0) {
      console.log(`API: No entitlements found, checking for purchases for user ${userId}`);
      
      const { data: purchases, error: purchasesError } = await serviceClient
        .from('purchases')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });
      
      if (purchasesError) {
        console.error('API: Error checking purchases:', purchasesError);
      } else if (purchases && purchases.length > 0) {
        console.log(`API: Found ${purchases.length} purchases for user ${userId}`);
        
        // Return the purchases so the client can handle them
        return NextResponse.json({
          authenticated: true,
          userId,
          entitlements: [],
          entitlementCount: 0,
          purchases,
          purchaseCount: purchases.length,
          message: 'No active entitlements found, but user has purchases'
        }, { status: 200 });
      }
    }
    
    // Return the user's entitlements
    return NextResponse.json({
      authenticated: true,
      userId,
      entitlements: entitlements || [],
      entitlementCount: entitlements?.length || 0,
    }, { status: 200 });
  } catch (error) {
    console.error('API: Unexpected error in user-entitlements route:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 