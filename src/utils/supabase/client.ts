'use client';

import { createClient } from '@supabase/supabase-js';

// Singleton pattern to ensure only one instance of the Supabase client exists
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export const createClientComponentClient = () => {
  if (supabaseInstance) return supabaseInstance;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  
  return supabaseInstance;
};

// Export a ready-to-use instance for direct imports
export const supabase = createClientComponentClient(); 