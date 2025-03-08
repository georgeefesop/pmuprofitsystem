import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { type CookieOptions } from '@supabase/ssr';

export const createClient = (request: NextRequest) => {
  // Create a cookies container that works with middleware
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const cookies = {
    get(name: string) {
      return request.cookies.get(name)?.value;
    },
    set(name: string, value: string, options: CookieOptions) {
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
      
      // Also set auth-status cookie for our middleware
      if (name === 'sb-access-token' && value) {
        response.cookies.set({
          name: 'auth-status',
          value: 'authenticated',
          ...options,
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });
      }
    },
    remove(name: string, options: CookieOptions) {
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
        response.cookies.set({
          name: 'auth-status',
          value: '',
          ...options,
          maxAge: 0,
        });
      }
    },
  };

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

  return { supabase, response };
}; 