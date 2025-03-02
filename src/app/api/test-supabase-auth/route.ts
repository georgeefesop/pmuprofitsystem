import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configure this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    // Create a Supabase client
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
    
    // Test creating a user
    const testEmail = `test-${Date.now()}@example.com`;
    // Generate a secure random password for testing
    const testPassword = `Test_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
    
    // Create a test user
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });
    
    if (userError) {
      return NextResponse.json({ 
        error: 'Error creating test user', 
        details: userError,
        env: {
          supabaseUrl,
          hasServiceKey: !!supabaseServiceKey
        }
      }, { status: 500 });
    }
    
    // Test authentication
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    
    if (authError) {
      return NextResponse.json({ 
        error: 'Error authenticating test user', 
        details: authError,
        createdUser: userData
      }, { status: 500 });
    }
    
    // Test querying the users table
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    return NextResponse.json({
      success: true,
      message: 'Supabase authentication test successful',
      testUser: {
        email: testEmail,
        id: userData.user.id
      },
      authData,
      usersData,
      usersError
    });
    
  } catch (error) {
    console.error('Error in test-supabase-auth API:', error);
    return NextResponse.json({ 
      error: 'Unexpected error', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 