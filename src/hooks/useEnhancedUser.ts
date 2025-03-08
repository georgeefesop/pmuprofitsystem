'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/utils/supabase/client';
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

  // Function to refresh user data
  const refreshUser = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Use the singleton client
      const { data: { user: userData }, error: userError } = await supabase.auth.getUser();
      
      if (userData) {
        setUser(userData as User);
        setError(null);
      } else if (userError) {
        console.error('Error fetching user:', userError);
        setError(userError.message);
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
  }, []);

  // Function to sign out
  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // First clear cookies manually to ensure they're removed
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=');
        if (name) {
          // Clear the cookie with all possible path and domain combinations
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname};`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname};`;
        }
      });
      
      // Clear all Supabase-related local storage items
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('supabase') || 
          key.includes('sb-') || 
          key.includes('auth') || 
          key.includes('redirect')
        )) {
          localStorage.removeItem(key);
        }
      }
      
      // Explicitly remove known items
      localStorage.removeItem('auth_user_id');
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('redirectTo');
      localStorage.removeItem('loginRedirectUrl');
      
      // Sign out using the singleton client
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (e) {
        console.error('Error signing out:', e);
      }
      
      setUser(null);
      
      // Add a delay to ensure everything is cleared before redirecting
      setTimeout(() => {
        // Force a hard navigation to ensure all state is cleared
        window.location.href = '/login';
      }, 500);
    } catch (err) {
      console.error('Error signing out:', err);
      setError(err instanceof Error ? err.message : 'Error signing out');
      
      // If sign out fails, force a hard navigation to login after a delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 500);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check for user on initial load
  useEffect(() => {
    const checkUser = async () => {
      try {
        setIsLoading(true);
        
        // Use the singleton client
        const { data: { user: userData }, error: userError } = await supabase.auth.getUser();
        
        if (userData) {
          setUser(userData as User);
          setError(null);
        } else if (userError) {
          console.error('Error fetching user:', userError);
          setError(userError.message);
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
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
  }, []);

  return {
    user,
    isLoading,
    error,
    refreshUser,
    signOut,
    isAuthenticated: !!user,
  };
} 