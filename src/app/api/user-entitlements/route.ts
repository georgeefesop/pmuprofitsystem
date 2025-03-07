import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { getServiceSupabase } from "@/lib/supabase";

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
    const { data: { session } } = await supabase.auth.getSession();
    
    // If user is not authenticated, return error
    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    
    // Get the user ID from the session
    const userId = session.user.id;
    
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
          currency
        )
      `)
      .eq("user_id", userId)
      .eq("is_active", true);
    
    if (error) {
      console.error("Error fetching user entitlements:", error);
      return NextResponse.json(
        { error: "Failed to fetch entitlements" },
        { status: 500 }
      );
    }
    
    // Return the entitlements
    return NextResponse.json({
      entitlements,
      count: entitlements?.length || 0
    });
  } catch (error) {
    console.error("Unexpected error in user-entitlements API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 