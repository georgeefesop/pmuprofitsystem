import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;
  
  // Define protected routes that require authentication
  const isProtectedRoute = path.startsWith('/dashboard');
  
  // Create a Supabase client
  const { supabase, response } = createClient(request);
  
  // Get the user's session
  const { data: { session } } = await supabase.auth.getSession();
  
  // If the route is protected and the user is not authenticated,
  // redirect to the login page with the original URL as a redirect parameter
  if (isProtectedRoute && !session) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', path);
    return NextResponse.redirect(url);
  }
  
  // If the user is authenticated and trying to access the dashboard,
  // check if they have purchased the main product
  if (isProtectedRoute && session) {
    try {
      // Check if the user has purchased the main product
      const { data: purchases } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('product_id', 'pmu-profit-system')
        .eq('status', 'completed');
      
      // If the user hasn't purchased the main product, redirect to checkout
      if (!purchases || purchases.length === 0) {
        console.log('User has not purchased the main product, redirecting to checkout');
        return NextResponse.redirect(new URL('/checkout', request.url));
      }
    } catch (error) {
      console.error('Error checking purchases:', error);
      // If there's an error, allow access to avoid blocking legitimate users
    }
  }
  
  // Continue with the request if authenticated or not a protected route
  return response;
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    // Match all dashboard routes
    '/dashboard/:path*',
  ],
}; 