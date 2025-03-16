import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { type CookieOptions } from '@supabase/ssr';

// Enhanced logging for debugging
console.log('SupabaseMiddleware: Module loaded');

export const createClient = async (request: NextRequest) => {
  console.log('SupabaseMiddleware: Creating Supabase client for middleware');
  
  // Log cookies for debugging - only log essential auth cookies
  const cookieObj: Record<string, string> = {};
  request.cookies.getAll().forEach(cookie => {
    cookieObj[cookie.name] = cookie.value || '';
  });
  
  console.log('SupabaseMiddleware: Request cookies:', {
    'sb-access-token': cookieObj['sb-access-token'] ? '✓ Present' : '✗ Missing',
    'sb-refresh-token': cookieObj['sb-refresh-token'] ? '✓ Present' : '✗ Missing',
    'auth-status': cookieObj['auth-status'] || 'Missing',
    cookieCount: Object.keys(cookieObj).length
  });
  
  // Create a cookies container that works with middleware
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const cookies = {
    get(name: string) {
      // Simplify cookie retrieval - don't log every attempt
      const value = request.cookies.get(name)?.value;
      // Only log for main auth cookies
      if (name === 'sb-access-token' || name === 'sb-refresh-token') {
        console.log(`SupabaseMiddleware: Getting cookie ${name}: ${value ? 'Found' : 'Not found'}`);
      }
      return value;
    },
    set(name: string, value: string, options: CookieOptions) {
      console.log(`SupabaseMiddleware: Setting cookie ${name}`);
      
      // If the cookie is updated, update the cookies for the request and response
      request.cookies.set({
        name,
        value,
        ...options,
      });
      response = NextResponse.next({
        request: {
          headers: request.headers,
        },
      });
      response.cookies.set({
        name,
        value,
        ...options,
      });
      
      // Also set auth-status cookie for our middleware with a longer expiration
      if (name === 'sb-access-token' && value) {
        console.log('SupabaseMiddleware: Setting auth-status cookie for authenticated user');
        response.cookies.set({
          name: 'auth-status',
          value: 'authenticated',
          ...options,
          maxAge: 60 * 60 * 24 * 30, // 30 days
          sameSite: 'lax',
        });
      }
    },
    remove(name: string, options: CookieOptions) {
      console.log(`SupabaseMiddleware: Removing cookie ${name}`);
      
      // If the cookie is being deleted, delete it from the request for subsequent middleware
      request.cookies.delete(name);
      
      // Update the Set-Cookie header to delete the cookie in the browser
      response.cookies.set({
        name,
        value: '',
        ...options,
        maxAge: 0,
      });
      
      // Also remove auth-status cookie if removing access token
      if (name === 'sb-access-token') {
        console.log('SupabaseMiddleware: Removing auth-status cookie as user is signing out');
        response.cookies.set({
          name: 'auth-status',
          value: '',
          ...options,
          maxAge: 0,
        });
      }
    },
  };

  console.log('SupabaseMiddleware: Creating Supabase client with cookie handler');
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies,
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  );

  // Check if we need to refresh the token
  const accessToken = cookies.get('sb-access-token');
  const refreshToken = cookies.get('sb-refresh-token');
  
  if (!accessToken && refreshToken) {
    console.log('SupabaseMiddleware: Access token missing but refresh token present, attempting to refresh');
    try {
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });
      
      if (error) {
        console.error('SupabaseMiddleware: Error refreshing token:', error.message);
      } else if (data?.session) {
        console.log('SupabaseMiddleware: Successfully refreshed token');
        // The cookies will be automatically set by the Supabase client
      }
    } catch (refreshError) {
      console.error('SupabaseMiddleware: Exception refreshing token:', 
        refreshError instanceof Error ? refreshError.message : String(refreshError));
    }
  }

  return { supabase, response };
}; 