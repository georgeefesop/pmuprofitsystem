import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (code) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Redirect to the dashboard or the specified next URL
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // If there's no code or an error occurred, redirect to the login page
  return NextResponse.redirect(new URL('/login', requestUrl.origin));
} 