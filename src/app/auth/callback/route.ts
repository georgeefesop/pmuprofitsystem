import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServiceSupabase } from '@/lib/supabase';

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
      
      if (!error) {
        // Verification successful - now ensure the account is properly set up
        if (data?.user) {
          // Use the service role client to check and fix account status
          const serviceSupabase = getServiceSupabase();
          
          // Check if the account is banned
          const { data: userData, error: userError } = await serviceSupabase.auth.admin.listUsers();
          
          if (!userError && userData) {
            const user = userData.users.find(u => u.id === data.user.id);
            
            if (user && (user as any).banned_until) {
              // Unban the user
              await serviceSupabase.auth.admin.updateUserById(
                user.id,
                { ban_duration: '0' }
              );
              
              console.log('Fixed banned status for user:', user.id);
            }
          }
        }
        
        // Redirect to the dashboard or the specified next URL
        return NextResponse.redirect(new URL(next, requestUrl.origin));
      } else {
        console.error('Error exchanging code for session:', error);
        
        // Handle specific error types
        if (error.message.includes('expired')) {
          // If the token is expired, redirect to login with a specific error message
          return NextResponse.redirect(
            new URL(`/login?error=${encodeURIComponent('Your verification link has expired. Please request a new verification email from the login page.')}`, 
            requestUrl.origin)
          );
        } else if (error.message.includes('invalid')) {
          // If the token is invalid, redirect to login with a specific error message
          return NextResponse.redirect(
            new URL(`/login?error=${encodeURIComponent('Invalid verification link. Please request a new verification email from the login page.')}`, 
            requestUrl.origin)
          );
        } else {
          // For other errors, redirect to login with a generic error message
          return NextResponse.redirect(
            new URL(`/login?error=${encodeURIComponent('Email verification failed: ' + error.message)}`, 
            requestUrl.origin)
          );
        }
      }
    } catch (error) {
      console.error('Exception during code exchange:', error);
      // Redirect to login with error
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent('An error occurred during email verification. Please try again or request a new verification email.')}`, 
        requestUrl.origin)
      );
    }
  }

  // If there's no code, redirect to the login page
  return NextResponse.redirect(new URL('/login', requestUrl.origin));
} 