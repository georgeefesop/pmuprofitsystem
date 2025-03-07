import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName } = await req.json();

    // Validate input
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "Email, password, and full name are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Initialize Supabase service client
    const supabase = await createServiceClient();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email address already exists" },
        { status: 409 }
      );
    }

    // Create user with email confirmation set to true
    const { data, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (signUpError) {
      console.error("Error creating user:", signUpError);
      return NextResponse.json(
        { error: signUpError.message },
        { status: 500 }
      );
    }

    // Automatically sign in the user after account creation
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error("Error signing in after account creation:", signInError);
      // Even if sign-in fails, we'll return success for the account creation
      return NextResponse.json({ 
        success: true, 
        message: "Account created successfully, but automatic sign-in failed. Please sign in manually." 
      });
    }

    // Set cookies for the session
    const cookieStore = cookies();

    // Set the session cookie
    if (signInData.session) {
      console.log('Setting auth cookies for user:', data.user?.email);
      
      cookieStore.set("sb-access-token", signInData.session.access_token, {
        path: "/",
        maxAge: signInData.session.expires_in,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      cookieStore.set("sb-refresh-token", signInData.session.refresh_token, {
        path: "/",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      // Also set a non-HttpOnly cookie that the client can check
      cookieStore.set("auth-status", "authenticated", {
        path: "/",
        maxAge: signInData.session.expires_in,
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
      
      console.log('Auth cookies set successfully');
    } else {
      console.error('No session available to set cookies');
    }

    // Return success response with user data
    return NextResponse.json({
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email,
        fullName: fullName,
      },
    });
  } catch (error) {
    console.error("Unexpected error during signup:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 