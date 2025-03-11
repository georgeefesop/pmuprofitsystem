import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { getServiceSupabase } from "@/lib/supabase";

// Force this route to be dynamic since it uses cookies
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({
        authenticated: false,
        message: "No active session"
      });
    }
    
    // Get user entitlements using service role client
    const serviceClient = getServiceSupabase();
    if (!serviceClient) {
      return NextResponse.json({
        authenticated: true,
        user: session.user,
        error: "Failed to initialize service client"
      });
    }
    
    const { data: entitlements, error } = await serviceClient
      .from("user_entitlements")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("is_active", true);
    
    return NextResponse.json({
      authenticated: true,
      user: session.user,
      entitlements: entitlements || [],
      entitlementsCount: entitlements?.length || 0,
      error: error ? error.message : null
    });
  } catch (error) {
    console.error("Error in auth-state debug endpoint:", error);
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 