import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServiceSupabase } from '@/lib/supabase';

// Maximum age of a state token in milliseconds (10 minutes)
const MAX_STATE_TOKEN_AGE = 10 * 60 * 1000;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { stateToken } = await req.json();
    
    if (!stateToken) {
      return NextResponse.json(
        { error: 'State token is required' },
        { status: 400 }
      );
    }
    
    // Decode the state token
    let decodedState;
    try {
      const decodedString = Buffer.from(stateToken, 'base64').toString();
      decodedState = JSON.parse(decodedString);
    } catch (error) {
      console.error('Error decoding state token:', error);
      return NextResponse.json(
        { error: 'Invalid state token format' },
        { status: 400 }
      );
    }
    
    // Validate the state token
    const { userId, timestamp, randomId } = decodedState;
    
    if (!userId || !timestamp || !randomId) {
      return NextResponse.json(
        { error: 'Invalid state token content' },
        { status: 400 }
      );
    }
    
    // Check if the token is expired
    const now = Date.now();
    if (now - timestamp > MAX_STATE_TOKEN_AGE) {
      return NextResponse.json(
        { error: 'State token has expired' },
        { status: 400 }
      );
    }
    
    // Verify the user exists
    const adminSupabase = getServiceSupabase();
    const { data: user, error: userError } = await adminSupabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (userError || !user) {
      console.error('Error finding user:', userError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Get the user's email
    const email = user.email;
    if (!email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }
    
    // Set a temporary cookie to indicate authentication is in progress
    const cookieStore = cookies();
    cookieStore.set('auth-status', 'authenticated', {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    // Store the user ID in a cookie
    cookieStore.set('user-id', userId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error restoring session:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 