'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

// Enhanced logging for debugging
console.log('useEnhancedUser: Initializing hook with singleton Supabase client');

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

// Helper function to log cookies for debugging
function logCookies(prefix: string) {
  if (typeof document !== 'undefined') {
    const cookieObj: Record<string, string> = {};
    document.cookie.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name) {
        cookieObj[name] = value || '';
      }
    });
    
    console.log(`useEnhancedUser: ${prefix} Cookies:`, {
      'sb-access-token': cookieObj['sb-access-token'] ? '✓ Present' : '✗ Missing',
      'sb-refresh-token': cookieObj['sb-refresh-token'] ? '✓ Present' : '✗ Missing',
      'auth-status': cookieObj['auth-status'] || 'Missing',
      cookieCount: Object.keys(cookieObj).length
    });
  }
}

// Helper function to log localStorage for debugging
function logLocalStorage(prefix: string) {
  if (typeof window !== 'undefined') {
    const authItems: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('supabase') || 
        key.includes('sb-') || 
        key.includes('auth') || 
        key.includes('redirect')
      )) {
        authItems[key] = localStorage.getItem(key) || '';
      }
    }
    
    console.log(`useEnhancedUser: ${prefix} LocalStorage:`, {
      'auth_user_id': localStorage.getItem('auth_user_id') || 'Missing',
      'sb-access-token': localStorage.getItem('sb-access-token') ? '✓ Present' : '✗ Missing',
      'sb-refresh-token': localStorage.getItem('sb-refresh-token') ? '✓ Present' : '✗ Missing',
      authItemCount: Object.keys(authItems).length
    });
  }
}

export function useEnhancedUser() {
  console.log('useEnhancedUser: Hook function called');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Function to refresh user data
  const refreshUser = useCallback(async () => {
    console.log('useEnhancedUser: refreshUser called');
    try {
      setIsLoading(true);
      
      // Log current auth state
      logCookies('Before refreshUser');
      logLocalStorage('Before refreshUser');
      
      // Use the singleton client
      console.log('useEnhancedUser: Calling supabase.auth.getUser()');
      const { data: { user: userData }, error: userError } = await supabase.auth.getUser();
      
      if (userData) {
        console.log('useEnhancedUser: User found in refreshUser:', {
          id: userData.id,
          email: userData.email,
          hasMetadata: !!userData.user_metadata
        });
        setUser(userData as User);
        setError(null);
      } else if (userError) {
        console.error('useEnhancedUser: Error fetching user:', userError);
        setError(userError.message);
        setUser(null);
      } else {
        console.log('useEnhancedUser: No user found in refreshUser');
        setUser(null);
        setError(null);
      }
      
      // Log updated auth state
      logCookies('After refreshUser');
    } catch (err) {
      console.error('useEnhancedUser: Unexpected error in refreshUser:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Function to sign out
  const signOut = useCallback(async () => {
    console.log('useEnhancedUser: signOut called');
    try {
      setIsLoading(true);
      
      // Log current auth state
      logCookies('Before signOut');
      logLocalStorage('Before signOut');
      
      // First clear cookies manually to ensure they're removed
      console.log('useEnhancedUser: Clearing cookies manually');
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=');
        if (name) {
          console.log(`useEnhancedUser: Clearing cookie: ${name}`);
          // Clear the cookie with all possible path and domain combinations
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname};`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname};`;
        }
      });
      
      // Clear all Supabase-related local storage items
      console.log('useEnhancedUser: Clearing localStorage items');
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('supabase') || 
          key.includes('sb-') || 
          key.includes('auth') || 
          key.includes('redirect')
        )) {
          console.log(`useEnhancedUser: Removing localStorage item: ${key}`);
          localStorage.removeItem(key);
        }
      }
      
      // Explicitly remove known items
      console.log('useEnhancedUser: Removing specific localStorage items');
      localStorage.removeItem('auth_user_id');
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('redirectTo');
      localStorage.removeItem('loginRedirectUrl');
      localStorage.removeItem('sb-access-token');
      localStorage.removeItem('sb-refresh-token');
      
      // Sign out using the singleton client
      console.log('useEnhancedUser: Calling supabase.auth.signOut()');
      try {
        const { error } = await supabase.auth.signOut({ scope: 'global' });
        if (error) {
          console.error('useEnhancedUser: Error from supabase.auth.signOut():', error);
        } else {
          console.log('useEnhancedUser: supabase.auth.signOut() successful');
        }
      } catch (e) {
        console.error('useEnhancedUser: Exception during supabase.auth.signOut():', e);
      }
      
      console.log('useEnhancedUser: Setting user to null');
      setUser(null);
      
      // Log updated auth state
      logCookies('After signOut');
      logLocalStorage('After signOut');
      
      // Add a delay to ensure everything is cleared before redirecting
      console.log('useEnhancedUser: Waiting before redirect...');
      setTimeout(() => {
        // Force a hard navigation to ensure all state is cleared
        console.log('useEnhancedUser: Redirecting to login page');
        window.location.href = '/login';
      }, 500);
    } catch (err) {
      console.error('useEnhancedUser: Error signing out:', err);
      setError(err instanceof Error ? err.message : 'Error signing out');
      
      // If sign out fails, force a hard navigation to login after a delay
      console.log('useEnhancedUser: Sign out failed, forcing redirect');
      setTimeout(() => {
        window.location.href = '/login';
      }, 500);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check for user on initial load
  useEffect(() => {
    console.log('useEnhancedUser: Initial useEffect running');
    
    const checkUser = async () => {
      console.log('useEnhancedUser: checkUser called');
      try {
        setIsLoading(true);
        
        // Log current auth state
        logCookies('Initial checkUser');
        logLocalStorage('Initial checkUser');
        
        // Use the singleton client
        console.log('useEnhancedUser: Calling supabase.auth.getUser()');
        const { data: { user: userData }, error: userError } = await supabase.auth.getUser();
        
        if (userData) {
          console.log('useEnhancedUser: User found in checkUser:', {
            id: userData.id,
            email: userData.email,
            hasMetadata: !!userData.user_metadata
          });
          
          // Also check session to ensure it's valid
          console.log('useEnhancedUser: Verifying session');
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('useEnhancedUser: Error getting session:', sessionError);
          } else if (!session) {
            console.warn('useEnhancedUser: User exists but no session found, attempting to refresh');
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError) {
              console.error('useEnhancedUser: Error refreshing session:', refreshError);
            } else if (refreshData.session) {
              console.log('useEnhancedUser: Session refreshed successfully');
            }
          } else {
            console.log('useEnhancedUser: Valid session found:', {
              userId: session.user.id,
              expiresAt: new Date(session.expires_at! * 1000).toISOString()
            });
          }
          
          setUser(userData as User);
          setError(null);
        } else if (userError) {
          console.error('useEnhancedUser: Error fetching user:', userError);
          setError(userError.message);
          setUser(null);
        } else {
          console.log('useEnhancedUser: No user found in checkUser');
          setUser(null);
          setError(null);
        }
        
        // Log updated auth state
        logCookies('After checkUser');
      } catch (err) {
        console.error('useEnhancedUser: Unexpected error in checkUser:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
    
    // Set up auth state change listener
    console.log('useEnhancedUser: Setting up auth state change listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('useEnhancedUser: Auth state changed:', event);
        
        if (session?.user) {
          console.log('useEnhancedUser: User from auth state change:', {
            id: session.user.id,
            email: session.user.email,
            event: event
          });
          
          // Log session details
          console.log('useEnhancedUser: Session details:', {
            expiresAt: new Date(session.expires_at! * 1000).toISOString(),
            hasAccessToken: !!session.access_token?.substring(0, 10),
            hasRefreshToken: !!session.refresh_token?.substring(0, 10)
          });
          
          setUser(session.user as User);
          setError(null);
          
          // Store auth status in a cookie for middleware
          if (typeof document !== 'undefined') {
            console.log('useEnhancedUser: Setting auth-status cookie');
            document.cookie = `auth-status=authenticated; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
            
            // Also store user ID in localStorage as a backup
            localStorage.setItem('auth_user_id', session.user.id);
          }
          
          // Log updated auth state
          logCookies('After auth state change');
          logLocalStorage('After auth state change');
        } else {
          console.log('useEnhancedUser: No user in auth state change, setting user to null');
          setUser(null);
          
          // If signed out, clear cookies and localStorage
          if (event === 'SIGNED_OUT') {
            console.log('useEnhancedUser: SIGNED_OUT event, clearing auth data');
            if (typeof document !== 'undefined') {
              document.cookie = `auth-status=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
              localStorage.removeItem('auth_user_id');
            }
          }
        }
        
        setIsLoading(false);
      }
    );

    return () => {
      console.log('useEnhancedUser: Cleaning up - unsubscribing from auth state changes');
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