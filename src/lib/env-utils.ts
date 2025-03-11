/**
 * Environment utility functions for the PMU Profit System
 * These functions help control behavior based on the current environment
 */

/**
 * Check if the current environment is development
 * @returns {boolean} True if in development environment
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if the current environment is production
 * @returns {boolean} True if in production environment
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if test and diagnostic features should be enabled
 * @returns {boolean} True if test features should be enabled
 */
export function enableTestFeatures(): boolean {
  // Enable test features in development or if explicitly enabled in production
  return isDevelopment() || process.env.NEXT_PUBLIC_ENABLE_TEST_FEATURES === 'true';
}

/**
 * Check if a test or diagnostic page should be accessible
 * This can be used in page components to conditionally render content
 * or in middleware to block access to test pages in production
 * 
 * @returns {boolean} True if the test page should be accessible
 */
export function allowTestPage(): boolean {
  return enableTestFeatures();
}

/**
 * Determines the current environment based on the hostname
 * @returns 'local' for localhost, 'production' for pmuprofitsystem.com
 */
export function getCurrentEnvironment(): 'local' | 'production' {
  if (typeof window === 'undefined') {
    // Server-side - use environment variables
    return process.env.NODE_ENV === 'development' ? 'local' : 'production';
  }
  
  // Client-side - use hostname
  const hostname = window.location.hostname;
  return hostname.includes('localhost') || hostname.includes('127.0.0.1') 
    ? 'local' 
    : 'production';
}

/**
 * Gets the environment name for display purposes
 * @returns A user-friendly environment name
 */
export function getEnvironmentName(): string {
  return getCurrentEnvironment() === 'local' 
    ? 'Local Development' 
    : 'Production';
} 