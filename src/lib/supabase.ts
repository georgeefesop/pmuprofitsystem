import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

// Helper function to ensure Supabase URL is using HTTPS in production
export const getSecureSupabaseUrl = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  
  // Only convert to HTTPS if it's not localhost and currently using HTTP
  if (supabaseUrl.startsWith('http://') && !supabaseUrl.includes('localhost')) {
    console.log('Converting Supabase URL from HTTP to HTTPS for security');
    return supabaseUrl.replace('http://', 'https://');
  }
  
  return supabaseUrl;
};

// Create a single supabase client for interacting with your database from the browser
export const supabase = createBrowserClient(
  getSecureSupabaseUrl(),
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    global: {
      fetch: (...args) => {
        // Enhanced fetch with retry logic for DNS resolution issues
        return new Promise((resolve, reject) => {
          const attemptFetch = (retryCount = 0, maxRetries = 3) => {
            if (retryCount === 0) {
              console.log(`Attempting Supabase fetch...`);
            } else {
              console.log(`Retrying Supabase fetch (attempt ${retryCount + 1}/${maxRetries + 1})...`);
            }
            
            fetch(...args)
              .then(response => {
                // Check if the response is ok (status in the range 200-299)
                if (!response.ok && response.status >= 400) {
                  console.warn(`Supabase fetch returned status ${response.status}`);
                  
                  // For 401/403 errors, don't retry as they're auth issues
                  if (response.status === 401 || response.status === 403) {
                    resolve(response);
                    return;
                  }
                  
                  // For 5xx errors, retry
                  if (response.status >= 500 && retryCount < maxRetries) {
                    console.log(`Server error, retrying in ${(retryCount + 1) * 1000}ms...`);
                    setTimeout(() => attemptFetch(retryCount + 1, maxRetries), (retryCount + 1) * 1000);
                    return;
                  }
                }
                
                resolve(response);
              })
              .catch(err => {
                console.error(`Supabase fetch error:`, err);
                
                // Check for specific error types
                const errorMessage = err.toString();
                if (
                  errorMessage.includes('ERR_NAME_NOT_RESOLVED') || 
                  errorMessage.includes('NetworkError') ||
                  errorMessage.includes('Failed to fetch') ||
                  errorMessage.includes('Network request failed')
                ) {
                  console.error('Network error detected. This may be due to network issues or Supabase service availability.');
                  
                  // If we haven't reached max retries, try again
                  if (retryCount < maxRetries) {
                    const delay = Math.min((retryCount + 1) * 1000, 5000);
                    console.log(`Retrying in ${delay}ms...`);
                    setTimeout(() => attemptFetch(retryCount + 1, maxRetries), delay);
                    return;
                  }
                }
                
                // If we've exhausted retries or it's not a retriable error, reject with a user-friendly message
                reject(new Error('Failed to connect to Supabase. Please check your network connection or try again later.'));
              });
          };
          
          // Start the first attempt
          attemptFetch();
        });
      },
      headers: {
        'X-Client-Info': 'PMU Profit System',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    },
    // Increase request timeout for slower connections
    realtime: {
      timeout: 60000 // 60 seconds
    }
  }
);

// For server-side operations that need elevated privileges
export const getServiceSupabase = () => {
  const supabaseUrl = getSecureSupabaseUrl();
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  // Use the standard createClient for server-side operations
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'X-Client-Info': 'PMU Profit System Server',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      fetch: (...args) => {
        // Enhanced fetch with retry logic for server-side operations
        return new Promise((resolve, reject) => {
          const attemptFetch = (retryCount = 0, maxRetries = 3) => {
            if (retryCount === 0) {
              console.log(`Server: Attempting Supabase fetch...`);
            } else {
              console.log(`Server: Retrying Supabase fetch (attempt ${retryCount + 1}/${maxRetries + 1})...`);
            }
            
            fetch(...args)
              .then(response => {
                // Check if the response is ok (status in the range 200-299)
                if (!response.ok && response.status >= 500 && retryCount < maxRetries) {
                  console.log(`Server: Server error, retrying in ${(retryCount + 1) * 1000}ms...`);
                  setTimeout(() => attemptFetch(retryCount + 1, maxRetries), (retryCount + 1) * 1000);
                  return;
                }
                
                resolve(response);
              })
              .catch(err => {
                console.error(`Server: Supabase fetch error:`, err);
                
                // If we haven't reached max retries, try again
                if (retryCount < maxRetries) {
                  const delay = Math.min((retryCount + 1) * 1000, 5000);
                  console.log(`Server: Retrying in ${delay}ms...`);
                  setTimeout(() => attemptFetch(retryCount + 1, maxRetries), delay);
                  return;
                }
                
                // If we've exhausted retries, reject with a detailed error
                reject(err);
              });
          };
          
          // Start the first attempt
          attemptFetch();
        });
      }
    },
    // Increase request timeout
    realtime: {
      timeout: 60000 // 60 seconds
    }
  });
};

// Helper function to get the site URL, ensuring HTTPS for production
export const getSecureSiteUrl = () => {
  // Use the environment variable if available
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    // For local development, use the URL as is (likely http://localhost:3000)
    if (process.env.NEXT_PUBLIC_SITE_URL.includes('localhost')) {
      return process.env.NEXT_PUBLIC_SITE_URL;
    }
    
    // For production, ensure HTTPS
    const url = process.env.NEXT_PUBLIC_SITE_URL;
    if (url.startsWith('http://') && !url.includes('localhost')) {
      return url.replace('http://', 'https://');
    }
    return url;
  }
  
  // Otherwise use the current origin, ensuring HTTPS for production
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    if (origin.startsWith('http://') && !origin.includes('localhost')) {
      return origin.replace('http://', 'https://');
    }
    return origin;
  }
  
  // Fallback for server-side when no environment variable is set
  return 'http://localhost:3000';
}; 