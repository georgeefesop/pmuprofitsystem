import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  try {
    // Get the current user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session:', sessionError);
      return NextResponse.json({ error: sessionError.message }, { status: 500 });
    }
    
    if (!session) {
      return NextResponse.json({ 
        authenticated: false,
        message: 'No active session found'
      }, { status: 200 });
    }
    
    // Get user entitlements
    const { data: entitlements, error: entitlementsError } = await supabase
      .from('user_entitlements')
      .select(`
        *,
        products:product_id(
          id,
          name,
          description,
          price,
          type
        )
      `)
      .eq('user_id', session.user.id)
      .eq('is_active', true);
    
    if (entitlementsError) {
      console.error('Error fetching entitlements:', entitlementsError);
      return NextResponse.json({ 
        error: entitlementsError.message,
        user: {
          id: session.user.id,
          email: session.user.email
        }
      }, { status: 500 });
    }
    
    // Get all products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('active', true);
    
    if (productsError) {
      console.error('Error fetching products:', productsError);
      return NextResponse.json({ 
        error: productsError.message,
        user: {
          id: session.user.id,
          email: session.user.email
        },
        entitlements
      }, { status: 500 });
    }
    
    // Return the debug information
    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        user_metadata: session.user.user_metadata
      },
      entitlements,
      products,
      entitlementsCount: entitlements?.length || 0,
      productsCount: products?.length || 0
    }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in debug endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 