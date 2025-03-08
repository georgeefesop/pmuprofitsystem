'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/utils/supabase/client';
import { createEnhancedBrowserClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  email?: string; // Optional to match Supabase's User type
  user_metadata?: {
    full_name?: string;
    [key: string]: any;
  };
  app_metadata?: {
    [key: string]: any;
  };
}

export function useEnhancedUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Enhanced Supabase client with better session handling
  const enhancedClient = createEnhancedBrowserClient();

  // Function to refresh user data
  const refreshUser = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // First try the enhanced client
      const { data: { user: enhancedUser }, error: enhancedError } = await enhancedClient.auth.getUser();
      
      if (enhancedUser) {
        setUser(enhancedUser as User);
        setError(null);
        return;
      }
      
      // Fallback to regular client
      const { data: { user: regularUser }, error: regularError } = await supabase.auth.getUser();
      
      if (regularUser) {
        setUser(regularUser as User);
        setError(null);
      } else if (regularError) {
        console.error('Error fetching user:', regularError);
        setError(regularError.message);
        setUser(null);
      } else {
        setUser(null);
        setError(null);
      }
    } catch (err) {
      console.error('Unexpected error in refreshUser:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [enhancedClient]);

  // Function to sign out
  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Sign out from both clients to ensure all cookies are cleared
      await enhancedClient.auth.signOut();
      await supabase.auth.signOut();
      
      // Clear cookies manually to ensure they're removed
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=');
        if (name.includes('sb-') || name === 'auth-status') {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
        }
      });
      
      // Clear local storage items
      localStorage.removeItem('auth_user_id');
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('redirectTo');
      localStorage.removeItem('loginRedirectUrl');
      
      setUser(null);
      
      // Force a hard navigation to ensure all state is cleared
      window.location.href = '/login';
    } catch (err) {
      console.error('Error signing out:', err);
      setError(err instanceof Error ? err.message : 'Error signing out');
      
      // If sign out fails, force a hard navigation to login
      window.location.href = '/login';
    } finally {
      setIsLoading(false);
    }
  }, [enhancedClient]);

  // Check for user on initial load
  useEffect(() => {
    const checkUser = async () => {
      try {
        setIsLoading(true);
        
        // First try the enhanced client
        const { data: { user: enhancedUser }, error: enhancedError } = await enhancedClient.auth.getUser();
        
        if (enhancedUser) {
          setUser(enhancedUser as User);
          setError(null);
          return;
        }
        
        // Fallback to regular client
        const { data: { user: regularUser }, error: regularError } = await supabase.auth.getUser();
        
        if (regularUser) {
          setUser(regularUser as User);
          setError(null);
        } else if (regularError) {
          console.error('Error fetching user:', regularError);
          setError(regularError.message);
          setUser(null);
        } else {
          setUser(null);
          setError(null);
        }
      } catch (err) {
        console.error('Unexpected error in checkUser:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
    
    // Set up auth state change listener
    const { data: { subscription } } = enhancedClient.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event);
        
        if (session?.user) {
          setUser(session.user as User);
          setError(null);
        } else {
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [enhancedClient]);

  return {
    user,
    isLoading,
    error,
    refreshUser,
    signOut,
    isAuthenticated: !!user,
  };
} 