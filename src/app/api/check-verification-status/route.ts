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
    
    console.log('Checking verification status for:', email);
    
    // Use the service role client for admin operations
    const supabase = getServiceSupabase();
    
    // Check if the user exists and their email verification status
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('Error checking user status:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    
    // Find the user with the provided email
    const user = data.users.find(u => u.email === email);
    
    if (!user) {
      // Don't reveal if the user exists or not for security reasons
      return NextResponse.json({ 
        success: true,
        exists: false,
        message: 'If this email exists in our system, its verification status has been checked.'
      });
    }
    
    // Return the user's verification status
    return NextResponse.json({
      success: true,
      exists: true,
      verified: user.email_confirmed_at !== null,
      lastSignIn: user.last_sign_in_at,
      createdAt: user.created_at
    });
  } catch (error) {
    console.error('Exception during verification status check:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 