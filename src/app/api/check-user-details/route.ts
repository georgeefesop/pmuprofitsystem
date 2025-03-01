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
    
    console.log('Checking detailed user information for:', email);
    
    // Use the service role client for admin operations
    const supabase = getServiceSupabase();
    
    // Check if the user exists and get detailed information
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
        success: true,
        exists: false,
        message: 'User not found with this email address'
      });
    }
    
    // Get auth logs for this user if possible
    let authLogs = null;
    try {
      const { data: logs, error: logsError } = await supabase
        .from('auth_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (!logsError && logs) {
        authLogs = logs;
      }
    } catch (logsError) {
      console.error('Error fetching auth logs:', logsError);
      // Continue without logs
    }
    
    // Check if the user has a profile in the users table
    let userProfile = null;
    try {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (!profileError && profile) {
        userProfile = profile;
      }
    } catch (profileError) {
      console.error('Error fetching user profile:', profileError);
      // Continue without profile
    }
    
    // Return detailed user information
    return NextResponse.json({
      success: true,
      exists: true,
      user: {
        id: user.id,
        email: user.email,
        emailConfirmed: user.email_confirmed_at !== null,
        emailConfirmedAt: user.email_confirmed_at,
        lastSignIn: user.last_sign_in_at,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        phone: user.phone,
        phoneConfirmed: user.phone_confirmed_at !== null,
        hasPassword: !!(user as any).encrypted_password,
        identities: user.identities,
        factors: user.factors,
        metadata: user.user_metadata,
        appMetadata: user.app_metadata,
        isBanned: (user as any).banned_until !== null,
        bannedUntil: (user as any).banned_until
      },
      profile: userProfile,
      authLogs: authLogs
    });
  } catch (error) {
    console.error('Exception during user details check:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 