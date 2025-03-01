import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    // Create a Supabase client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        error: 'Missing Supabase credentials',
        env: {
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        }
      }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the email from the query string
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }
    
    // Get user from the users table
    const { data: appUsers, error: appError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1);
    
    if (appError) {
      return NextResponse.json({ 
        error: 'Error checking app users', 
        details: appError 
      }, { status: 500 });
    }
    
    // Try to get the user directly from auth API
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    const userData = users?.find(user => user.email === email);
    
    // Check if the user exists in auth
    const userExists = !!userData;
    
    // Check if the user exists in the app's users table
    const profileExists = appUsers && appUsers.length > 0;
    
    // Check if email is confirmed
    const emailConfirmed = userData?.email_confirmed_at ? true : false;
    
    return NextResponse.json({
      success: true,
      userStatus: {
        exists: userExists,
        hasProfile: profileExists,
        emailConfirmed,
        email: email
      },
      appUsers,
      authUser: userData,
      listError
    });
    
  } catch (error) {
    console.error('Error in test-auth-status API:', error);
    return NextResponse.json({ 
      error: 'Unexpected error', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 