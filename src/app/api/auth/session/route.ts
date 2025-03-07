import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }
    
    // Return only necessary user data
    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        user_metadata: session.user.user_metadata
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error getting session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 