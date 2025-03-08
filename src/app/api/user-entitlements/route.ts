import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { getServiceSupabase } from "@/lib/supabase";
import { supabase as clientSupabase } from "@/utils/supabase/client";

/**
 * API endpoint to fetch user entitlements directly from the database
 * This uses the service role client to bypass RLS policies and ensure
 * we always get the most accurate data
 */
export async function GET(req: NextRequest) {
  try {
    // Get the user's session
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    // Try to get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // If there's a session error, log it but continue with token extraction
    if (sessionError) {
      console.error("Session error:", sessionError);
    }
    
    let userId: string | null = null;
    
    // If we have a session, use it
    if (session?.user?.id) {
      userId = session.user.id;
      console.log("User authenticated via session:", userId);
    } else {
      // Try to get user ID from request headers (set by middleware)
      const userIdHeader = req.headers.get('x-user-id');
      if (userIdHeader) {
        userId = userIdHeader;
        console.log("User authenticated via header:", userId);
      } else {
        // Try to extract user ID from cookies directly
        const accessToken = cookieStore.get('sb-access-token')?.value;
        const refreshToken = cookieStore.get('sb-refresh-token')?.value;
        
        if (accessToken && refreshToken) {
          try {
            // Try to restore the session
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            if (data?.user?.id) {
              userId = data.user.id;
              console.log("User authenticated via token restoration:", userId);
            } else if (error) {
              console.error("Error restoring session from tokens:", error);
            }
          } catch (error) {
            console.error("Error setting session from tokens:", error);
          }
        }
      }
    }
    
    // If user is still not authenticated, return error
    if (!userId) {
      console.error("User not authenticated");
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    
    // Use the service role client to bypass RLS policies
    const serviceClient = getServiceSupabase();
    
    // Check if service client was initialized successfully
    if (!serviceClient) {
      console.error("Failed to initialize service client");
      return NextResponse.json(
        { error: "Failed to initialize database connection" },
        { status: 500 }
      );
    }
    
    console.log("Fetching entitlements for user:", userId);
    
    // Fetch user entitlements with product details
    const { data: entitlements, error } = await serviceClient
      .from("user_entitlements")
      .select(`
        *,
        products:product_id(
          id,
          name,
          description,
          price,
          type,
          currency,
          active,
          metadata
        )
      `)
      .eq("user_id", userId);
    
    if (error) {
      console.error("Error fetching user entitlements:", error);
      return NextResponse.json(
        { error: "Failed to fetch entitlements" },
        { status: 500 }
      );
    }

    console.log(`Found ${entitlements?.length || 0} entitlements for user ${userId}`);
    
    // Fetch user's purchases to include purchase details with entitlements
    const { data: purchases, error: purchasesError } = await serviceClient
      .from("purchases")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    
    if (purchasesError) {
      console.error("Error fetching user purchases:", purchasesError);
    }
    
    // Enhance entitlements with purchase information
    const enhancedEntitlements = entitlements?.map(entitlement => {
      // Find the purchase associated with this entitlement
      const purchase = purchases?.find(p => p.id === entitlement.source_id);
      
      return {
        ...entitlement,
        purchase: purchase ? {
          id: purchase.id,
          amount: purchase.amount,
          currency: purchase.currency,
          created_at: purchase.created_at,
          status: purchase.status
        } : null
      };
    });
    
    // Fetch all active products
    const { data: allProducts, error: productsError } = await serviceClient
      .from("products")
      .select("*")
      .eq("active", true);
      
    if (productsError) {
      console.error("Error fetching products:", productsError);
    }
    
    // Return the entitlements and all products
    return NextResponse.json({
      entitlements: enhancedEntitlements,
      count: enhancedEntitlements?.length || 0,
      purchases: purchases || [],
      products: allProducts || []
    });
  } catch (error) {
    console.error("Unexpected error in user-entitlements API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 