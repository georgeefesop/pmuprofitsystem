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
    
    console.log('Attempting to unban user with email:', email);
    
    // Use the service role client for admin operations
    const supabase = getServiceSupabase();
    
    // First, get the user ID from the email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error fetching users:', userError);
      return NextResponse.json(
        { success: false, error: userError.message },
        { status: 400 }
      );
    }
    
    // Find the user with the provided email
    const user = userData.users.find(u => u.email === email);
    
    if (!user) {
      return NextResponse.json({ 
        success: false,
        message: 'User not found with this email address'
      });
    }
    
    // Unban the user
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { ban_duration: '0' }
    );
    
    if (updateError) {
      console.error('Error unbanning user:', updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 400 }
      );
    }
    
    // Also ensure the user has a valid password
    // This is a workaround for accounts that might have been created without a password
    // We'll generate a random password and then immediately create a password reset token
    let resetToken = null;
    
    try {
      // Generate a password reset link
      const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: email,
      });
      
      if (resetError) {
        console.error('Error generating password reset link:', resetError);
      } else if (resetData) {
        resetToken = resetData.properties.action_link;
      }
    } catch (resetError) {
      console.error('Exception generating password reset link:', resetError);
    }
    
    return NextResponse.json({
      success: true,
      message: 'User account has been unbanned',
      userId: user.id,
      resetToken: resetToken
    });
  } catch (error) {
    console.error('Exception during user unban operation:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 