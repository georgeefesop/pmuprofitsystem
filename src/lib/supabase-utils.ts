/**
 * Utility functions for Supabase connection diagnostics
 */

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
            recommendation: 'Update NEXT_PUBLIC_SUPABASE_URL to use https://'
          }
        };
      }
    }
    
    // Extract the domain from the Supabase URL
    const domain = supabaseUrl.replace(/^https?:\/\//, '').split('/')[0];
    
    // Try to fetch the health check endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
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
          }
        };
      } else {
        return {
          success: false,
          message: `Supabase API responded with status ${response.status}`,
          details: {
            status: response.status,
            statusText: response.statusText,
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
            recommendation: 'Check network connectivity and Supabase service status'
          }
        };
      } else if (fetchError.message?.includes('ERR_NAME_NOT_RESOLVED')) {
        return {
          success: false,
          message: 'DNS resolution error - cannot resolve Supabase domain',
          details: {
            domain,
            error: fetchError.toString(),
            possibleCauses: [
              'Network connectivity issues',
              'DNS server problems',
              'Supabase project being paused or deleted',
              'Firewall or security software blocking the connection'
            ],
            recommendation: 'Check network connectivity and Supabase service status'
          }
        };
      } else {
        return {
          success: false,
          message: 'Failed to connect to Supabase',
          details: {
            error: fetchError.toString(),
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
  console.log('Site URL:', process.env.NEXT_PUBLIC_SITE_URL);
  
  // Log browser information if available
  if (typeof window !== 'undefined') {
    console.log('Browser Protocol:', window.location.protocol);
    console.log('Browser Hostname:', window.location.hostname);
    console.log('Browser Origin:', window.location.origin);
    console.log('User Agent:', navigator.userAgent);
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
          message: 'Protocol mismatch detected but cannot be fixed at runtime',
          fixApplied: 'None - environment variables cannot be modified at runtime',
        };
      }
    }
    
    // If we can't fix the issue automatically, provide guidance
    return {
      success: false,
      message: 'Unable to automatically fix Supabase connection issues',
      fixApplied: 'None - manual intervention required',
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Error attempting to fix Supabase connection',
    };
  }
} 