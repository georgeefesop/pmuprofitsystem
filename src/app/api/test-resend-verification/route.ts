import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    console.log('Testing resend verification email to:', email);
    
    // Use the service role client for admin operations
    const supabase = getServiceSupabase();
    
    // Attempt to resend the verification email
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${req.nextUrl.origin}/auth/callback`,
      },
    });
    
    console.log('Resend response:', data, error);
    
    if (error) {
      console.error('Error resending verification email:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    
    // Check if the user exists and their email verification status
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    let userInfo = null;
    if (!userError && userData) {
      const user = userData.users.find(u => u.email === email);
      if (user) {
        userInfo = {
          id: user.id,
          email: user.email,
          emailConfirmed: user.email_confirmed_at !== null,
          lastSignIn: user.last_sign_in_at,
          createdAt: user.created_at
        };
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Verification email resend initiated',
      userInfo
    });
  } catch (error) {
    console.error('Exception during resend verification test:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 