/**
 * Route Configuration Module
 * Defines the different types of routes and their handling in the middleware
 */

/**
 * Protected routes require both authentication and valid product entitlements
 * Users without entitlements will be redirected to the checkout page
 */
export const PROTECTED_ROUTES = [
  '/dashboard',
  '/dashboard/modules',
  '/dashboard/blueprint',
  '/dashboard/handbook',
  '/dashboard/profile',
  '/dashboard/ad-generator',
  // Catch-all for any dashboard route to ensure complete protection
  '/dashboard/'
  // Add other protected routes here
];

/**
 * Auth-only routes require authentication but not entitlements
 * Unauthenticated users will be redirected to login or pre-checkout
 */
export const AUTH_ONLY_ROUTES = [
  '/checkout',
  '/checkout/success',
  // Add other auth-only routes here
];

/**
 * Public routes are accessible to all users regardless of authentication status
 * No redirects will be applied for these routes
 */
export const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/pre-checkout',
  '/checkout/success',
  '/forgot-password',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/cookies',
  // Add other public routes here
];

/**
 * Static routes that should be skipped by the middleware
 * These routes are for static assets, API endpoints, etc.
 */
export const STATIC_ROUTES = [
  '/_next',
  '/api',
  '/static',
  '/favicon.ico'
];

/**
 * Checks if a path is a static route that should be skipped by the middleware
 * @param path - The path to check
 * @returns True if the path is a static route or contains a file extension
 */
export function isStaticRoute(path: string): boolean {
  return (
    STATIC_ROUTES.some(route => path.startsWith(route)) ||
    path.includes('.')
  );
}

/**
 * Checks if a path is a public route
 * @param path - The path to check
 * @returns True if the path is a public route
 */
export function isPublicRoute(path: string): boolean {
  // First, explicitly exclude dashboard routes
  if (path.startsWith('/dashboard')) {
    return false;
  }
  
  // Then check if it matches any public route
  return PUBLIC_ROUTES.some(route => {
    // For root path, require exact match to prevent matching all paths
    if (route === '/') {
      return path === '/';
    }
    
    // For other routes, check if path starts with the route
    return path.startsWith(route);
  });
}

/**
 * Checks if a path is a protected route
 * @param path - The path to check
 * @returns True if the path is a protected route
 */
export function isProtectedRoute(path: string): boolean {
  // More strict check to ensure all dashboard routes are protected
  if (path.startsWith('/dashboard')) {
    return true;
  }
  return PROTECTED_ROUTES.some(route => path.startsWith(route));
}

/**
 * Checks if a path is an auth-only route
 * @param path - The path to check
 * @returns True if the path is an auth-only route
 */
export function isAuthOnlyRoute(path: string): boolean {
  return AUTH_ONLY_ROUTES.some(route => path.startsWith(route));
}

/**
 * Checks if a path is a checkout route
 * @param path - The path to check
 * @returns True if the path is a checkout route but not a success page
 */
export function isCheckoutRoute(path: string): boolean {
  return path.startsWith('/checkout') && !path.includes('/success');
}

/**
 * Checks if a path is a login or signup route
 * @param path - The path to check
 * @returns True if the path is a login or signup route
 */
export function isLoginOrSignupRoute(path: string): boolean {
  return path === '/login' || path === '/signup';
}

/**
 * Checks if a path is a pre-checkout route
 * @param path - The path to check
 * @returns True if the path is a pre-checkout route
 */
export function isPreCheckoutRoute(path: string): boolean {
  return path === '/pre-checkout';
} 