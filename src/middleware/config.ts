/**
 * Middleware Configuration Module
 * 
 * This module provides configuration for the Next.js middleware.
 * It checks for the ENABLE_CUSTOM_MIDDLEWARE environment variable
 * which replaces the deprecated experimental.middleware setting.
 */

/**
 * Check if custom middleware is enabled
 * This replaces the experimental.middleware: true setting
 */
export const isCustomMiddlewareEnabled = (): boolean => {
  // Check environment variable first
  if (process.env.ENABLE_CUSTOM_MIDDLEWARE === 'true') {
    return true;
  }
  
  // Check serverRuntimeConfig if available
  try {
    // @ts-ignore - This is a dynamic import
    const getConfig = require('next/config').default;
    const { serverRuntimeConfig } = getConfig() || { serverRuntimeConfig: {} };
    
    if (serverRuntimeConfig?.enableCustomMiddleware === true) {
      return true;
    }
  } catch (error) {
    // If next/config is not available, ignore the error
    console.warn('Could not load Next.js config, falling back to default middleware behavior');
  }
  
  // Default to true for backward compatibility
  return true;
};

/**
 * Middleware matcher configuration
 * Specifies which paths the middleware should run on
 */
export const middlewareMatcher = [
  /*
   * Match all request paths except:
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   * - public folder
   */
  '/((?!_next/static|_next/image|favicon.ico|public/).*)',
]; 