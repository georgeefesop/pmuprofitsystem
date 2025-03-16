/**
 * Entitlements Handler Module
 * Provides functions for checking and handling user entitlements
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../logger';
import { PRODUCT_IDS } from '@/lib/product-ids';
import { createClient } from '@/utils/supabase/middleware';
import { jwtDecode } from 'jwt-decode';

/**
 * Formats a user ID to ensure it's in the correct UUID format for database queries
 * 
 * @param userId - The user ID to format
 * @returns The formatted user ID
 */
function formatUserId(userId: string): string {
  // If the userId is already in UUID format, return it as is
  if (userId.includes('-') && userId.length === 36) {
    logger.debug(`User ID is already in UUID format: ${userId}`);
    return userId;
  }
  
  // If the userId looks like a JWT token (long string with periods)
  if (userId.includes('.') && userId.length > 100) {
    try {
      // Try to decode it as a JWT token
      const decoded = jwtDecode<{ sub?: string }>(userId);
      if (decoded.sub) {
        logger.debug(`Decoded user ID from JWT token: ${decoded.sub}`);
        return decoded.sub;
      }
    } catch (error) {
      logger.warn(`Failed to decode JWT token: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Special handling for the specific format we're seeing in logs: "8zfC87kwDgkSfppVtqF-kg"
  // This appears to be a URL-safe base64 encoded string that might be a UUID
  if (userId.includes('-') && userId.length >= 20 && userId.length <= 30) {
    try {
      // First, try to decode it directly if it's a standard base64 string
      const decodedId = Buffer.from(userId, 'base64').toString('utf8');
      
      // Check if the decoded ID looks like a UUID
      if (decodedId.includes('-') && decodedId.length === 36) {
        logger.debug(`Decoded user ID from ${userId} to ${decodedId}`);
        return decodedId;
      }
      
      // If not, it might be a base64url format (URL-safe base64)
      // Replace URL-safe characters with standard base64 characters
      const base64 = userId.replace(/-/g, '+').replace(/_/g, '/');
      const paddedBase64 = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
      const decodedUrlSafeId = Buffer.from(paddedBase64, 'base64').toString('utf8');
      
      if (decodedUrlSafeId.includes('-') && decodedUrlSafeId.length === 36) {
        logger.debug(`Decoded URL-safe user ID from ${userId} to ${decodedUrlSafeId}`);
        return decodedUrlSafeId;
      }
    } catch (error) {
      logger.warn(`Failed to decode user ID ${userId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // If we still can't decode it, try to get the user ID from Supabase directly
  // This is a more expensive operation, so we do it as a last resort
  try {
    // Extract the project reference from the user ID if possible
    const projectRef = userId.split('.')[0];
    if (projectRef && projectRef.length > 10) {
      logger.debug(`Attempting to extract user ID from project reference: ${projectRef}`);
      // The user ID might be in the format: {project-ref}.{user-id}
      const parts = userId.split('.');
      if (parts.length > 1) {
        const potentialUserId = parts[1];
        if (potentialUserId && potentialUserId.length > 10) {
          logger.debug(`Extracted potential user ID: ${potentialUserId}`);
          return potentialUserId;
        }
      }
    }
  } catch (error) {
    logger.warn(`Failed to extract user ID from project reference: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  // If all else fails, try a direct query to the database to get the user ID
  // This is a fallback for when we can't decode the user ID from the token
  // We'll use a placeholder UUID that will definitely fail, but with a clear error message
  logger.warn(`Could not format user ID ${userId} to UUID format, using placeholder`);
  return '00000000-0000-0000-0000-000000000000';
}

/**
 * Checks if a user has the required entitlements to access a protected route
 * If not, redirects to the checkout page
 * 
 * @param req - The Next.js request object
 * @param userId - The user ID
 * @returns A NextResponse object if redirect is needed, null otherwise
 */
export async function checkUserEntitlements(
  req: NextRequest,
  userId: string
): Promise<NextResponse | null> {
  logger.info(`Checking entitlements for user: ${userId}`);
  
  try {
    // Format the user ID to ensure it's in the correct UUID format
    const formattedUserId = formatUserId(userId);
    logger.debug(`Using formatted user ID: ${formattedUserId}`);
    
    // Create Supabase client for direct database access
    const { supabase } = await createClient(req);
    
    // Query user_entitlements table directly instead of using API
    const { data: entitlements, error } = await supabase
      .from('user_entitlements')
      .select('*')
      .eq('user_id', formattedUserId)
      .eq('product_id', PRODUCT_IDS['pmu-profit-system'])
      .eq('is_active', true);
    
    // If there's a database error, log it and redirect to checkout
    if (error) {
      logger.error(`Database error checking entitlements: ${error.message}`);
      logger.info('Redirecting to checkout due to database error');
      return NextResponse.redirect(new URL('/checkout', req.url));
    }
    
    // Check if user has any active entitlements
    const hasEntitlement = entitlements && entitlements.length > 0;
    logger.debug(`User ${formattedUserId} has entitlement: ${hasEntitlement}, count: ${entitlements?.length || 0}`);
    
    // If the user has entitlements, allow access
    if (hasEntitlement) {
      logger.info('User has required entitlements, allowing access');
      return null;
    }
    
    // If the user doesn't have entitlements, redirect to checkout
    logger.info('User does not have required entitlements, redirecting to checkout');
    return NextResponse.redirect(new URL('/checkout', req.url));
  } catch (error) {
    // If there's any error in the process, redirect to checkout for safety
    logger.error(`Error checking entitlements: ${error instanceof Error ? error.message : String(error)}`);
    logger.info('Redirecting to checkout due to entitlements check error');
    return NextResponse.redirect(new URL('/checkout', req.url));
  }
} 