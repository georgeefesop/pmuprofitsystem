import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase, getSecureSiteUrl } from '@/lib/supabase';

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
    
    console.log('Testing email verification for:', email);
    
    const supabase = getServiceSupabase();
    const redirectUrl = `${getSecureSiteUrl()}/auth/callback`;
    console.log('Using redirect URL:', redirectUrl);
    
    // Check if the user exists
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error checking user:', userError);
      return NextResponse.json(
        { error: 'Failed to check user', details: userError },
        { status: 500 }
      );
    }
    
    const user = userData.users.find(u => u.email === email);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found', email },
        { status: 404 }
      );
    }
    
    console.log('User found:', user.id);
    
    // Check if the email is already verified
    if (user.email_confirmed_at) {
      return NextResponse.json({
        success: true,
        message: 'Email is already verified',
        verified: true,
        verifiedAt: user.email_confirmed_at
      });
    }
    
    // Attempt to resend the verification email
    try {
      // This is a workaround since we don't have direct access to the Supabase admin API
      // to resend verification emails. In a production environment, you would use the
      // Supabase dashboard or API to resend verification emails.
      
      // For now, we'll just return information about the user and the redirect URL
      return NextResponse.json({
        success: true,
        message: 'Email verification test completed',
        user: {
          id: user.id,
          email: user.email,
          verified: false
        },
        redirectUrl,
        instructions: 'Please use the resendVerificationEmail function in the AuthContext to resend the verification email'
      });
    } catch (resendError) {
      console.error('Error resending verification email:', resendError);
      return NextResponse.json(
        { error: 'Failed to resend verification email', details: resendError },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error testing email verification:', error);
    return NextResponse.json(
      { error: 'Failed to test email verification', details: error },
      { status: 500 }
    );
  }
} 