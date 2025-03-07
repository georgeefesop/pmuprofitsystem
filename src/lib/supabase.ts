import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { supabase as singletonClient } from '@/utils/supabase/client';

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

// Use the singleton Supabase client instead of creating a new one
export const supabase = singletonClient;

// Create a Supabase client with custom auth for a specific user
export const createUserSpecificSupabaseClient = (userId: string) => {
  if (!userId) {
    console.error('No user ID provided to createUserSpecificSupabaseClient');
    return supabase;
  }

  // Create a custom client with the user's ID in the JWT claims
  const customClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          'X-User-ID': userId,
        },
      },
    }
  );

  return customClient;
};

// Create a Supabase client with service role for admin operations
export const getServiceSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials for service client. Please check your environment variables.');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
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