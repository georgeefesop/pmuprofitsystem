/**
 * Authentication Utilities Module
 * Provides functions for authentication checks and token handling
 */

import { NextRequest } from 'next/server';
import { logger } from '../logger';

// Cache for authentication checks to prevent repeated checks in a short time
const authCheckCache = new Map();
const AUTH_CHECK_CACHE_TTL = 5000; // 5 seconds

/**
 * Helper function to log cookies for debugging
 * Extracts and formats cookie information from the request
 * 
 * @param req - The Next.js request object
 * @param prefix - A prefix to identify the log context (e.g., 'Request', 'Response')
 */
export function logCookies(req: NextRequest, prefix: string): void {
  const cookieObj: Record<string, string> = {};
  req.cookies.getAll().forEach(cookie => {
    cookieObj[cookie.name] = cookie.value || '';
  });
  
  logger.debug(`${prefix} Cookies:`, {
    'sb-access-token': cookieObj['sb-access-token'] ? '✓ Present' : '✗ Missing',
    'sb-refresh-token': cookieObj['sb-refresh-token'] ? '✓ Present' : '✗ Missing',
    'auth-status': cookieObj['auth-status'] || 'Missing',
    cookieCount: Object.keys(cookieObj).length
  });
}

/**
 * Enhanced authentication check with caching
 * Performs a series of checks to determine if the user is authenticated
 * Uses a cache to avoid repeated checks in a short time
 * 
 * @param req - The Next.js request object
 * @param supabase - The Supabase client
 * @param searchParams - URL search parameters
 * @returns A boolean indicating whether the user is authenticated
 */
export async function enhancedAuthCheck(
  req: NextRequest,
  supabase: any,
  searchParams: URLSearchParams
): Promise<boolean> {
  try {
    // Check cache first to avoid repeated auth checks
    const cacheKey = `auth-${req.cookies.get('sb-refresh-token')?.value || 'no-token'}-${Date.now()}`;
    const cachedResult = authCheckCache.get(cacheKey);
    if (cachedResult && (Date.now() - cachedResult.timestamp) < AUTH_CHECK_CACHE_TTL) {
      logger.info('Using cached auth check result:', cachedResult.isAuthenticated);
      return cachedResult.isAuthenticated;
    }

    // Check for auth-status cookie first (faster)
    const hasAuthCookie = req.cookies.has('auth-status') && req.cookies.get('auth-status')?.value === 'authenticated';
    logger.info('Auth cookie check:', hasAuthCookie ? 'Present' : 'Missing');
    
    // If we have the auth cookie, we can consider the user authenticated for most routes
    if (hasAuthCookie) {
      logger.info('Auth cookie found, considering user authenticated');
      // Cache the result
      authCheckCache.set(cacheKey, { isAuthenticated: true, timestamp: Date.now() });
      return true;
    }
    
    // Check for state token in URL
    const stateToken = searchParams.get('state');
    if (stateToken) {
      logger.info('Found state token in URL');
      try {
        const decodedState = JSON.parse(Buffer.from(stateToken, 'base64').toString());
        if (decodedState.userId) {
          logger.info('Extracted user ID from state token:', decodedState.userId);
          return true;
        }
      } catch (error) {
        logger.error('Error decoding state token:', error);
      }
    }
    
    // Check for user ID in cookies or query params as a secondary verification
    const hasUserIdCookie = req.cookies.has('auth_user_id') && req.cookies.get('auth_user_id')?.value;
    const hasUserIdParam = searchParams.has('auth_user_id') && searchParams.get('auth_user_id');
    
    logger.info('User ID verification:', {
      fromCookie: hasUserIdCookie ? 'Present' : 'Missing',
      fromParam: hasUserIdParam ? 'Present' : 'Missing'
    });
    
    // If we have either user ID source, consider authenticated
    if (hasUserIdCookie || hasUserIdParam) {
      logger.info('User ID found, considering user authenticated');
      return true;
    }
    
    // Check for Supabase tokens
    const hasAccessToken = req.cookies.has('sb-access-token');
    const hasRefreshToken = req.cookies.has('sb-refresh-token');
    
    logger.info('Supabase tokens check:', {
      accessToken: hasAccessToken ? 'Present' : 'Missing',
      refreshToken: hasRefreshToken ? 'Present' : 'Missing'
    });
    
    if (hasAccessToken || hasRefreshToken) {
      logger.info('Supabase tokens found, considering user authenticated');
      return true;
    }
    
    // If no auth cookie or user ID, try to get the session from Supabase
    logger.info('Checking Supabase session');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      logger.error('Error fetching session:', sessionError.message);
      return false;
    }
    
    if (session) {
      logger.info('Valid Supabase session found');
      return true;
    }
    
    // Try to restore session from tokens if available
    if (req.cookies.has('sb-access-token') && req.cookies.has('sb-refresh-token')) {
      logger.info('Attempting to restore session from tokens');
      try {
        const accessToken = req.cookies.get('sb-access-token')?.value;
        const refreshToken = req.cookies.get('sb-refresh-token')?.value;
        
        if (accessToken && refreshToken) {
          const { data: { session: restoredSession }, error: restoreError } = 
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
          
          if (restoreError) {
            logger.error('Error restoring session:', restoreError.message);
            return false;
          }
          
          if (restoredSession) {
            logger.info('Session restored successfully');
            return true;
          }
        }
      } catch (error) {
        logger.error('Exception during session restoration:', error);
        return false;
      }
    }
    
    logger.info('No valid authentication found');
    return false;
  } catch (error) {
    logger.error('Unexpected error in enhancedAuthCheck:', error);
    return false;
  }
}

/**
 * Extracts the user ID from various sources in the request
 * 
 * @param req - The Next.js request object
 * @returns The user ID or an empty string if not found
 */
export function extractUserId(req: NextRequest): string {
  // First, try to get the user ID from the auth_user_id cookie
  const authUserId = req.cookies.get('auth_user_id')?.value;
  if (authUserId) {
    logger.debug('Extracted user ID from auth_user_id cookie:', authUserId);
    return authUserId;
  }
  
  // If not found, try to get it from the Supabase cookie
  // Supabase stores the user ID in a cookie named sb-{project-ref}-auth-token
  const supabaseCookies = req.cookies.getAll()
    .filter(cookie => cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token'));
  
  if (supabaseCookies.length > 0) {
    try {
      // The cookie value is a JSON string
      const cookieValue = supabaseCookies[0].value;
      const parsedValue = JSON.parse(cookieValue);
      
      if (parsedValue && parsedValue.user && parsedValue.user.id) {
        const userId = parsedValue.user.id;
        logger.debug('Extracted user ID from Supabase auth cookie:', userId);
        return userId;
      }
    } catch (error) {
      logger.warn('Failed to parse Supabase auth cookie:', error);
    }
  }
  
  // If still not found, try to get it from the x-user-id header
  // This might be set by other middleware or server components
  const userIdHeader = req.headers.get('x-user-id');
  if (userIdHeader) {
    logger.debug('Extracted user ID from x-user-id header:', userIdHeader);
    return userIdHeader;
  }
  
  // As a last resort, return a placeholder value that will be handled by formatUserId
  // This will likely be the refresh token value, which needs to be decoded
  const refreshToken = req.cookies.get('sb-refresh-token')?.value;
  if (refreshToken) {
    logger.debug('Using refresh token as fallback for user ID extraction');
    return refreshToken;
  }
  
  logger.warn('Could not extract user ID from any source');
  return '';
}

/**
 * Decodes a state token from the URL
 * 
 * @param stateToken - The state token to decode
 * @returns The decoded state or null if decoding fails
 */
export function decodeStateToken(stateToken: string): { userId?: string } | null {
  try {
    return JSON.parse(Buffer.from(stateToken, 'base64').toString());
  } catch (error) {
    logger.error('Error decoding state token:', error);
    return null;
  }
} 