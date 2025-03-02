import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServiceSupabase } from '@/lib/supabase';

// Configure this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';
  const type = requestUrl.searchParams.get('type') || 'signup';
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

  // If there's an error in the URL parameters, handle it
  if (error || error_description) {
    console.error('Error in auth callback:', error, error_description);
    
    let errorMessage = 'Authentication error';
    if (error_description) {
      errorMessage = decodeURIComponent(error_description);
    }
    
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorMessage)}`, 
      requestUrl.origin)
    );
  }

  if (code) {
    try {
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Error exchanging code for session:', error);
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(error.message)}`, 
          requestUrl.origin)
        );
      }
      
      // Successful authentication
      console.log('Authentication successful, redirecting to:', next);
      return NextResponse.redirect(new URL(next, requestUrl.origin));
      
    } catch (err) {
      console.error('Exception in auth callback:', err);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent('Authentication failed')}`, 
        requestUrl.origin)
      );
    }
  }

  // No code provided, redirect to login
  return NextResponse.redirect(new URL('/login', requestUrl.origin));
} 