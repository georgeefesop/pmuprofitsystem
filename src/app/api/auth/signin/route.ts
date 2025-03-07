import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServiceClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Initialize Supabase service client
    const supabase = await createServiceClient();

    // Sign in user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Error signing in:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    // Set cookies for the session
    const cookieStore = cookies();
    
    // Set the session cookie
    if (data.session) {
      cookieStore.set("sb-access-token", data.session.access_token, {
        path: "/",
        maxAge: data.session.expires_in,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
      
      cookieStore.set("sb-refresh-token", data.session.refresh_token, {
        path: "/",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "User signed in successfully",
        user: {
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || "",
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error during signin:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 