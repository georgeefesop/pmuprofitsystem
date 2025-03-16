/**
 * Middleware Module
 * Entry point for the Next.js middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/middleware';
import { PRODUCT_IDS } from '@/lib/product-ids';
import { middlewareMatcher } from './config';

// Import logger
import { logger } from './logger';

// Import utilities
import { logCookies, enhancedAuthCheck, extractUserId } from './utils/auth';
import { injectBrowserErrorLogger } from './utils/browser-logger';
import { 
  isStaticRoute, 
  isPublicRoute, 
  isProtectedRoute, 
  isAuthOnlyRoute 
} from './utils/routes';

// Import handlers
import { 
  handleCheckoutSuccessPage, 
  handleCheckoutAddonPage,
  handleDomainRedirect,
  handleAuthPageRedirect,
  handlePreCheckoutRedirect,
  handleProtectedRouteRedirect,
  handleAuthOnlyRouteRedirect
} from './handlers/special-routes';
import { checkUserEntitlements } from './handlers/entitlements';

/**
 * Next.js middleware function
 * Handles authentication, authorization, and routing
 * 
 * @param req - The Next.js request object
 * @returns A NextResponse object
 */
export async function middleware(req: NextRequest): Promise<NextResponse> {
  logger.info('Starting middleware execution');
  
  // Get the pathname from the URL
  const { pathname, searchParams } = new URL(req.url);
  const path = pathname;
  
  // Handle domain redirects
  const domainRedirect = handleDomainRedirect(req);
  if (domainRedirect) return domainRedirect;
  
  // Log cookies for debugging
  logCookies(req, 'Request');
  
  // Create the response and Supabase client
  const { supabase, response } = await createClient(req);
  
  // Get query parameters
  const sessionId = searchParams.get('session_id');
  const stateToken = searchParams.get('state');
  
  // Log the request for debugging
  logger.info(`Path=${path}, sessionId=${sessionId}, stateToken=${stateToken ? 'present' : 'null'}`);
  
  // Skip middleware for static files, API routes, and other non-page routes
  if (isStaticRoute(path)) {
    logger.debug(`Skipping middleware for non-page route: ${path}`);
    // Optionally inject browser error logger for HTML responses in development
    if (process.env.NODE_ENV === 'development') {
      return await injectBrowserErrorLogger(response);
    }
    return response;
  }
  
  // Special handling for checkout success page
  const checkoutSuccessResult = handleCheckoutSuccessPage(req, path, sessionId, stateToken);
  if (checkoutSuccessResult) return checkoutSuccessResult;
  
  // Special handling for checkout addon page
  const checkoutAddonResult = handleCheckoutAddonPage(req, path);
  if (checkoutAddonResult) return checkoutAddonResult;
  
  // If the path is a public route, allow access regardless of authentication
  if (isPublicRoute(path)) {
    logger.info(`Path ${path} is a public route, allowing access`);
    // Optionally inject browser error logger for HTML responses in development
    if (process.env.NODE_ENV === 'development') {
      return await injectBrowserErrorLogger(response);
    }
    
    return response;
  }
  
  // Check if the user is authenticated
  const isAuthenticated = await enhancedAuthCheck(req, supabase, searchParams);
  
  // Special handling for login/signup pages - redirect to dashboard if authenticated
  const authPageRedirect = handleAuthPageRedirect(path, isAuthenticated, req);
  if (authPageRedirect) return authPageRedirect;
  
  // Special handling for pre-checkout page - redirect to checkout if authenticated
  const preCheckoutRedirect = handlePreCheckoutRedirect(path, isAuthenticated, req, searchParams);
  if (preCheckoutRedirect) return preCheckoutRedirect;
  
  // If user is not authenticated and trying to access a protected route, redirect to login
  if (!isAuthenticated) {
    // Handle protected routes
    const protectedRouteRedirect = handleProtectedRouteRedirect(path, isProtectedRoute(path), req);
    if (protectedRouteRedirect) return protectedRouteRedirect;
    
    // Handle auth-only routes
    const authOnlyRouteRedirect = handleAuthOnlyRouteRedirect(path, isAuthOnlyRoute(path), req, searchParams);
    if (authOnlyRouteRedirect) return authOnlyRouteRedirect;
    
    // For public routes, allow access
    logger.info('Path is public and user is not authenticated, allowing access');
    // Optionally inject browser error logger for HTML responses in development
    if (process.env.NODE_ENV === 'development') {
      return await injectBrowserErrorLogger(response);
    }
    return response;
  }
  
  // User is authenticated, extract user ID
  const userId = extractUserId(req);
  logger.info(`User authenticated: ${userId}`);
  
  // For protected routes, check entitlements
  // Enhanced check to ensure all dashboard routes require entitlements
  if (isProtectedRoute(path) || path.startsWith('/dashboard')) {
    logger.info(`Protected route detected: ${path}, checking entitlements`);
    const entitlementsResult = await checkUserEntitlements(req, userId);
    if (entitlementsResult) return entitlementsResult;
  }
  
  // For all other routes, allow access for authenticated users
  logger.info(`Allowing access to ${path} for authenticated user`);
  
  // Set user ID in request headers
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-user-id', userId);
  
  // Optionally inject browser error logger for HTML responses in development
  if (process.env.NODE_ENV === 'development') {
    const nextResponse = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    return await injectBrowserErrorLogger(nextResponse);
  }
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

/**
 * Middleware configuration
 * Specifies which paths the middleware should run on
 */
export const config = {
  matcher: middlewareMatcher,
}; 