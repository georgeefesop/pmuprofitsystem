/**
 * Special Route Handlers Module
 * Provides handlers for special routes that require custom processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../logger';
import { decodeStateToken } from '../utils/auth';

/**
 * Handle checkout success page
 * Special handling for the checkout success page with session ID or state token
 * 
 * @param req - The Next.js request object
 * @param path - The current path
 * @param sessionId - The session ID from query parameters
 * @param stateToken - The state token from query parameters
 * @returns A NextResponse or undefined if no special handling is needed
 */
export function handleCheckoutSuccessPage(
  req: NextRequest,
  path: string,
  sessionId: string | null,
  stateToken: string | null
): NextResponse | undefined {
  if (path === '/checkout/success' && (sessionId || stateToken)) {
    logger.info('Allowing access to checkout success page with session ID or state token');
    
    // If we have a state token, try to extract user ID from it
    if (stateToken) {
      const decodedState = decodeStateToken(stateToken);
      if (decodedState?.userId) {
        logger.info('Extracted user ID from state token:', decodedState.userId);
        // Set the user ID in request headers
        const requestHeaders = new Headers(req.headers);
        requestHeaders.set('x-user-id', decodedState.userId);
        requestHeaders.set('x-state-token', stateToken);
        
        if (sessionId) {
          requestHeaders.set('x-session-id', sessionId);
        }
        
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      }
    }
    
    // If we have auth_user_id in the URL, use it
    const authUserId = new URL(req.url).searchParams.get('auth_user_id');
    if (authUserId) {
      logger.info('Found auth_user_id in URL:', authUserId);
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-user-id', authUserId);
      
      if (sessionId) {
        requestHeaders.set('x-session-id', sessionId);
      }
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
    
    return NextResponse.next();
  }
  
  return undefined;
}

/**
 * Handle checkout addon page
 * Special handling for the checkout addon page with authentication parameters
 * 
 * @param req - The Next.js request object
 * @param path - The current path
 * @returns A NextResponse or undefined if no special handling is needed
 */
export function handleCheckoutAddonPage(
  req: NextRequest,
  path: string
): NextResponse | undefined {
  if (path.startsWith('/checkout/addon')) {
    logger.info('Special handling for checkout/addon route');
    
    // Check for state token or auth_user_id in URL
    const searchParams = new URL(req.url).searchParams;
    const stateToken = searchParams.get('state');
    const authUserId = searchParams.get('auth_user_id');
    
    if (stateToken || authUserId) {
      logger.info('Found authentication parameters in URL for checkout/addon');
      
      // Set headers with user information
      const requestHeaders = new Headers(req.headers);
      
      if (stateToken) {
        const decodedState = decodeStateToken(stateToken);
        if (decodedState?.userId) {
          logger.info('Setting user ID from state token:', decodedState.userId);
          requestHeaders.set('x-user-id', decodedState.userId);
          requestHeaders.set('x-state-token', stateToken);
        }
      }
      
      if (authUserId) {
        logger.info('Setting user ID from auth_user_id:', authUserId);
        requestHeaders.set('x-user-id', authUserId);
      }
      
      // Allow access with the updated headers
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
    
    // If no authentication parameters, proceed with normal auth check
    logger.info('No authentication parameters found for checkout/addon, proceeding with normal auth check');
  }
  
  return undefined;
}

/**
 * Handle domain redirects
 * Redirects from non-www to www domain
 * 
 * @param req - The Next.js request object
 * @returns A NextResponse redirect or undefined if no redirect is needed
 */
export function handleDomainRedirect(req: NextRequest): NextResponse | undefined {
  const hostname = req.headers.get('host') || '';
  
  // Redirect from non-www to www instead of the other way around
  if (hostname && !hostname.startsWith('www.') && !hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
    logger.info('Redirecting from non-www to www domain');
    const newUrl = new URL(req.url);
    newUrl.host = 'www.' + hostname;
    return NextResponse.redirect(newUrl, { status: 301 });
  }
  
  return undefined;
}

/**
 * Handle login/signup redirect for authenticated users
 * Redirects authenticated users from login/signup pages to dashboard
 * 
 * @param path - The current path
 * @param isAuthenticated - Whether the user is authenticated
 * @param req - The Next.js request object
 * @returns A NextResponse redirect or undefined if no redirect is needed
 */
export function handleAuthPageRedirect(
  path: string,
  isAuthenticated: boolean,
  req: NextRequest
): NextResponse | undefined {
  if ((path === '/login' || path === '/signup') && isAuthenticated) {
    logger.info('User is already authenticated and trying to access login/signup page, redirecting to dashboard');
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  
  return undefined;
}

/**
 * Handle pre-checkout redirect for authenticated users
 * Redirects authenticated users from pre-checkout to checkout
 * 
 * @param path - The current path
 * @param isAuthenticated - Whether the user is authenticated
 * @param req - The Next.js request object
 * @param searchParams - URL search parameters
 * @returns A NextResponse redirect or undefined if no redirect is needed
 */
export function handlePreCheckoutRedirect(
  path: string,
  isAuthenticated: boolean,
  req: NextRequest,
  searchParams: URLSearchParams
): NextResponse | undefined {
  if (path === '/pre-checkout' && isAuthenticated) {
    logger.info('User is already authenticated and trying to access pre-checkout, redirecting to checkout');
    const redirectUrl = new URL('/checkout', req.url);
    
    // Preserve any product parameters
    const products = searchParams.get('products');
    if (products) {
      redirectUrl.searchParams.set('products', products);
    }
    
    return NextResponse.redirect(redirectUrl);
  }
  
  return undefined;
}

/**
 * Handle protected route redirect for unauthenticated users
 * Redirects unauthenticated users from protected routes to login
 * 
 * @param path - The current path
 * @param isProtectedRoute - Whether the path is a protected route
 * @param req - The Next.js request object
 * @returns A NextResponse redirect or undefined if no redirect is needed
 */
export function handleProtectedRouteRedirect(
  path: string,
  isProtectedRoute: boolean,
  req: NextRequest
): NextResponse | undefined {
  if (isProtectedRoute) {
    logger.info('User not authenticated, redirecting to login');
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirect', path);
    logger.info(`Redirecting to ${redirectUrl.toString()} with redirect param: ${path}`);
    return NextResponse.redirect(redirectUrl);
  }
  
  return undefined;
}

/**
 * Handle auth-only route redirect for unauthenticated users
 * Redirects unauthenticated users from auth-only routes to login or pre-checkout
 * 
 * @param path - The current path
 * @param isAuthOnlyRoute - Whether the path is an auth-only route
 * @param req - The Next.js request object
 * @param searchParams - URL search parameters
 * @returns A NextResponse redirect or undefined if no redirect is needed
 */
export function handleAuthOnlyRouteRedirect(
  path: string,
  isAuthOnlyRoute: boolean,
  req: NextRequest,
  searchParams: URLSearchParams
): NextResponse | undefined {
  if (isAuthOnlyRoute) {
    // For checkout, redirect to pre-checkout to create an account first
    if (path.startsWith('/checkout') && !path.includes('/success')) {
      logger.info('User not authenticated, redirecting to pre-checkout');
      const redirectUrl = new URL('/pre-checkout', req.url);
      
      // Preserve any product parameters
      const products = searchParams.get('products');
      if (products) {
        redirectUrl.searchParams.set('products', products);
      }
      
      return NextResponse.redirect(redirectUrl);
    }
    
    // For other auth-only routes, redirect to login
    logger.info('User not authenticated, redirecting to login');
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(redirectUrl);
  }
  
  return undefined;
} 