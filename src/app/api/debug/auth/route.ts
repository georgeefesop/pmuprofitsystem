'use server';

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  // Get all cookies for debugging
  const allCookies = cookieStore.getAll();
  const cookieMap = allCookies.reduce((acc, cookie) => {
    acc[cookie.name] = cookie.value;
    return acc;
  }, {} as Record<string, string>);
  
  // Get the session from Supabase auth
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  // Try to refresh the session
  let refreshResult = null;
  let refreshError = null;
  
  try {
    const { data, error } = await supabase.auth.refreshSession();
    refreshResult = data;
    refreshError = error;
  } catch (e) {
    refreshError = e;
  }
  
  // Get request headers
  const headers = {
    'user-agent': req.headers.get('user-agent'),
    'referer': req.headers.get('referer'),
    'cookie': req.headers.get('cookie'),
    'x-user-id': req.headers.get('x-user-id'),
  };
  
  // Return all the debug information
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    cookies: {
      all: cookieMap,
      count: allCookies.length,
      names: allCookies.map(c => c.name),
    },
    session: {
      exists: !!session,
      user: session ? {
        id: session.user.id,
        email: session.user.email,
        metadata: session.user.user_metadata,
      } : null,
      expires_at: session && session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
      is_expired: session && session.expires_at ? (session.expires_at * 1000 < Date.now()) : null,
      error: sessionError,
    },
    refresh: {
      success: !!refreshResult?.session,
      session: refreshResult?.session ? {
        user_id: refreshResult.session.user.id,
        expires_at: refreshResult.session.expires_at ? new Date(refreshResult.session.expires_at * 1000).toISOString() : null,
      } : null,
      error: refreshError,
    },
    headers,
    localStorage: 'Not available on server',
  });
}

// Force this route to be dynamic since it uses cookies
export const dynamic = 'force-dynamic'; 