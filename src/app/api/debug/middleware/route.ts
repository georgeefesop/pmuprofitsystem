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
  
  // Check for user entitlements if we have a session
  let entitlements = null;
  let entitlementsError = null;
  
  if (session?.user?.id) {
    try {
      const { data, error } = await supabase
        .from('user_entitlements')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('is_active', true);
      
      entitlements = data;
      entitlementsError = error;
    } catch (e) {
      entitlementsError = e;
    }
  }
  
  // Check for recent purchases if we have a session
  let purchases = null;
  let purchasesError = null;
  
  if (session?.user?.id) {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(5);
      
      purchases = data;
      purchasesError = error;
    } catch (e) {
      purchasesError = e;
    }
  }
  
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
    entitlements: {
      count: entitlements?.length || 0,
      data: entitlements,
      error: entitlementsError,
    },
    purchases: {
      count: purchases?.length || 0,
      data: purchases,
      error: purchasesError,
    },
    headers: {
      user_agent: req.headers.get('user-agent'),
      referer: req.headers.get('referer'),
      cookie: req.headers.get('cookie'),
    },
  });
}

// Force this route to be dynamic since it uses cookies
export const dynamic = 'force-dynamic'; 