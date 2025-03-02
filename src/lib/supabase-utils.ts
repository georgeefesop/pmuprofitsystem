/**
 * Utility functions for Supabase connection diagnostics
 */

import { getSecureSupabaseUrl } from './supabase';

/**
 * Checks if the Supabase URL is correctly configured and accessible
 * @returns Promise with the check result
 */
export async function checkSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  details?: Record<string, any>;
}> {
  try {
    // Get the Supabase URL from environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secureSupabaseUrl = getSecureSupabaseUrl();
    
    if (!supabaseUrl) {
      return {
        success: false,
        message: 'Supabase URL is not configured in environment variables',
      };
    }
    
    // Check if we're using HTTPS in production but HTTP for Supabase
    if (typeof window !== 'undefined') {
      if (window.location.protocol === 'https:' && supabaseUrl.startsWith('http:')) {
        return {
          success: false,
          message: 'Protocol mismatch: Site is using HTTPS but Supabase URL is using HTTP',
          details: {
            siteProtocol: window.location.protocol,
            supabaseProtocol: 'http:',
            secureUrl: secureSupabaseUrl,
            recommendation: 'Update NEXT_PUBLIC_SUPABASE_URL to use https://'
          }
        };
      }
    }
    
    // Extract the domain from the Supabase URL
    const domain = supabaseUrl.replace(/^https?:\/\//, '').split('/')[0];
    
    // First, try to ping the domain to check DNS resolution
    try {
      const dnsCheckUrl = `https://${domain}/favicon.ico`;
      const dnsController = new AbortController();
      const dnsTimeoutId = setTimeout(() => dnsController.abort(), 5000);
      
      await fetch(dnsCheckUrl, {
        method: 'HEAD',
        mode: 'no-cors', // This allows us to check if the domain resolves without CORS issues
        signal: dnsController.signal,
      });
      
      clearTimeout(dnsTimeoutId);
      console.log(`DNS resolution successful for ${domain}`);
    } catch (dnsError: any) {
      if (dnsError.name === 'AbortError') {
        console.error(`DNS resolution timeout for ${domain}`);
      } else if (dnsError.name === 'TypeError' && dnsError.message.includes('Failed to fetch')) {
        return {
          success: false,
          message: 'DNS resolution error - cannot resolve Supabase domain',
          details: {
            domain,
            error: dnsError.toString(),
            possibleCauses: [
              'Network connectivity issues',
              'DNS server problems',
              'Supabase project being paused or deleted',
              'Firewall or security software blocking the connection'
            ],
            recommendation: 'Check network connectivity and Supabase service status'
          }
        };
      }
      // Continue with the API check even if DNS check fails
      console.warn(`DNS check warning: ${dnsError.message}`);
    }
    
    // Try to fetch the health check endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // Longer timeout for API check
    
    try {
      // Use the secure URL for the API check
      const response = await fetch(`${secureSupabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return {
          success: true,
          message: 'Successfully connected to Supabase',
          details: {
            status: response.status,
            statusText: response.statusText,
            url: secureSupabaseUrl
          }
        };
      } else {
        return {
          success: false,
          message: `Supabase API responded with status ${response.status}`,
          details: {
            status: response.status,
            statusText: response.statusText,
            url: secureSupabaseUrl,
            possibleCauses: [
              'Invalid API key',
              'Rate limiting',
              'Supabase service issues'
            ]
          }
        };
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // Check for specific error types
      if (fetchError.name === 'AbortError') {
        return {
          success: false,
          message: 'Connection to Supabase timed out',
          details: {
            error: fetchError.toString(),
            url: secureSupabaseUrl,
            recommendation: 'Check network connectivity and Supabase service status',
            possibleCauses: [
              'Slow network connection',
              'Supabase service is experiencing high latency',
              'Firewall or proxy is delaying the connection'
            ]
          }
        };
      } else if (fetchError.message?.includes('ERR_NAME_NOT_RESOLVED')) {
        return {
          success: false,
          message: 'DNS resolution error - cannot resolve Supabase domain',
          details: {
            domain,
            error: fetchError.toString(),
            url: secureSupabaseUrl,
            possibleCauses: [
              'Network connectivity issues',
              'DNS server problems',
              'Supabase project being paused or deleted',
              'Firewall or security software blocking the connection'
            ],
            recommendation: 'Check network connectivity and Supabase service status'
          }
        };
      } else if (fetchError.message?.includes('NetworkError')) {
        return {
          success: false,
          message: 'Network error when connecting to Supabase',
          details: {
            error: fetchError.toString(),
            url: secureSupabaseUrl,
            possibleCauses: [
              'CORS issues - browser security preventing the connection',
              'Network connectivity problems',
              'VPN or proxy interference'
            ],
            recommendation: 'Try disabling browser extensions, VPNs, or proxies'
          }
        };
      } else {
        return {
          success: false,
          message: 'Failed to connect to Supabase',
          details: {
            error: fetchError.toString(),
            url: secureSupabaseUrl,
            possibleCauses: [
              'Unknown connection issue',
              'Browser security features blocking the connection',
              'Network configuration issues'
            ]
          }
        };
      }
    }
  } catch (error: any) {
    return {
      success: false,
      message: 'Error checking Supabase connection',
      details: {
        error: error.toString(),
      }
    };
  }
}

/**
 * Logs diagnostic information about the current environment and Supabase configuration
 */
export function logSupabaseDiagnostics(): void {
  console.log('=== Supabase Connection Diagnostics ===');
  
  // Log environment information
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Secure Supabase URL:', getSecureSupabaseUrl());
  console.log('Site URL:', process.env.NEXT_PUBLIC_SITE_URL);
  
  // Log browser information if available
  if (typeof window !== 'undefined') {
    console.log('Browser Protocol:', window.location.protocol);
    console.log('Browser Hostname:', window.location.hostname);
    console.log('Browser Origin:', window.location.origin);
    console.log('User Agent:', navigator.userAgent);
    
    // Check for browser features that might affect connectivity
    console.log('Online Status:', navigator.onLine ? 'Online' : 'Offline');
    
    // Check for service worker registration
    if ('serviceWorker' in navigator) {
      console.log('Service Worker Supported: Yes');
    } else {
      console.log('Service Worker Supported: No');
    }
  }
  
  // Check for protocol mismatches
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    if (window.location.protocol === 'https:' && process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('http:')) {
      console.error('WARNING: Protocol mismatch detected. Site is using HTTPS but Supabase URL is using HTTP.');
      console.error('This may cause connection issues due to mixed content restrictions.');
      console.error('Recommendation: Update NEXT_PUBLIC_SUPABASE_URL to use https://');
    }
  }
  
  console.log('======================================');
}

/**
 * Attempts to fix common Supabase connection issues
 * @returns Promise with the fix result
 */
export async function attemptSupabaseConnectionFix(): Promise<{
  success: boolean;
  message: string;
  fixApplied?: string;
}> {
  try {
    // Check the current connection status
    const connectionCheck = await checkSupabaseConnection();
    
    if (connectionCheck.success) {
      return {
        success: true,
        message: 'Supabase connection is already working correctly',
      };
    }
    
    // Try to fix protocol mismatch
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      if (window.location.protocol === 'https:' && process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('http:')) {
        // We can't modify environment variables at runtime, but we can suggest a fix
        return {
          success: false,
          message: 'Protocol mismatch detected. The application is using HTTPS but trying to connect to Supabase via HTTP. This is being automatically handled by the secure URL function, but for optimal performance, update your environment variables.',
          fixApplied: 'Using secure URL function as a temporary fix',
        };
      }
    }
    
    // Check if we're offline
    if (typeof window !== 'undefined' && !navigator.onLine) {
      return {
        success: false,
        message: 'Your device appears to be offline. Please check your internet connection and try again.',
        fixApplied: 'None - internet connection required',
      };
    }
    
    // If we can't fix the issue automatically, provide guidance
    return {
      success: false,
      message: 'Unable to automatically fix Supabase connection issues. Please check your network connection, clear browser cache, or try using a different browser.',
      fixApplied: 'None - manual intervention required',
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Error attempting to fix Supabase connection: ' + error.message,
    };
  }
} 