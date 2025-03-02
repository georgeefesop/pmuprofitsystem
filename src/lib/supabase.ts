import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

// Create a single supabase client for interacting with your database from the browser
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
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
        return fetch(...args).catch(err => {
          console.error('Supabase fetch error:', err);
          throw new Error('Failed to connect to Supabase. Please check your network connection.');
        });
      },
      headers: {
        'X-Client-Info': 'PMU Profit System',
      }
    },
    // Increase request timeout
    realtime: {
      timeout: 30000
    }
  }
);

// For server-side operations that need elevated privileges
export const getServiceSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
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
      }
    },
    // Increase request timeout
    realtime: {
      timeout: 30000
    }
  });
};

// Helper function to get the site URL, preserving the protocol
export const getSecureSiteUrl = () => {
  // Use the environment variable if available
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  
  // Otherwise use the current origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Fallback for server-side
  return 'http://localhost:3000';
}; 