'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

// Conditionally log based on environment
const isDev = process.env.NODE_ENV === 'development';
const shouldLog = isDev && process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true';

// Only log initialization once
if (shouldLog) {
  console.log('useEnhancedUser: Initializing hook with singleton Supabase client');
}

// Add a cache for auth checks with longer TTL
const AUTH_CHECK_CACHE = {
  user: null as any,
  timestamp: 0,
  TTL: 30000 // Increased to 30 seconds
};

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
  if (!shouldLog || typeof document === 'undefined') return;
  
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

// Helper function to log localStorage for debugging
function logLocalStorage(prefix: string) {
  if (!shouldLog || typeof window === 'undefined') return;
  
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

// Create a singleton instance tracker to prevent multiple hook initializations
let hookInstanceCount = 0;

export function useEnhancedUser() {
  // Only log on first call in development
  const instanceId = useRef(++hookInstanceCount).current;
  
  if (shouldLog && instanceId <= 3) {
    console.log(`useEnhancedUser: Hook function called (instance ${instanceId})`);
  }
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Add debounce ref with longer timeout
  const authCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to refresh user data with improved debouncing
  const refreshUser = useCallback(async () => {
    if (shouldLog) console.log('useEnhancedUser: refreshUser called');
    
    // Check if we have a recent cached user
    const now = Date.now();
    if (AUTH_CHECK_CACHE.user && (now - AUTH_CHECK_CACHE.timestamp) < AUTH_CHECK_CACHE.TTL) {
      if (shouldLog) console.log('useEnhancedUser: Using cached user data');
      setUser(AUTH_CHECK_CACHE.user);
      setIsLoading(false);
      return;
    }
    
    // Clear any existing timeout
    if (authCheckTimeoutRef.current) {
      clearTimeout(authCheckTimeoutRef.current);
    }
    
    // Set a timeout to debounce multiple calls with longer delay
    authCheckTimeoutRef.current = setTimeout(async () => {
      try {
        setIsLoading(true);
        
        // Log current auth state
        logCookies('Before refreshUser');
        logLocalStorage('Before refreshUser');
        
        // Use the singleton client
        if (shouldLog) console.log('useEnhancedUser: Calling supabase.auth.getUser()');
        const { data: { user: userData }, error: userError } = await supabase.auth.getUser();
        
        if (userData) {
          if (shouldLog) {
            console.log('useEnhancedUser: User found in refreshUser:', {
              id: userData.id,
              email: userData.email,
              hasMetadata: !!userData.user_metadata
            });
          }
          
          // Update cache
          AUTH_CHECK_CACHE.user = userData;
          AUTH_CHECK_CACHE.timestamp = Date.now();
          
          setUser(userData as User);
          setError(null);
        } else if (userError) {
          console.error('useEnhancedUser: Error fetching user:', userError);
          setError(userError.message);
          setUser(null);
          
          // Clear cache on error
          AUTH_CHECK_CACHE.user = null;
          AUTH_CHECK_CACHE.timestamp = 0;
        } else {
          if (shouldLog) console.log('useEnhancedUser: No user found in refreshUser');
          setUser(null);
          setError(null);
          
          // Clear cache when no user
          AUTH_CHECK_CACHE.user = null;
          AUTH_CHECK_CACHE.timestamp = 0;
        }
        
        // Log updated auth state
        logCookies('After refreshUser');
      } catch (err) {
        console.error('useEnhancedUser: Unexpected error in refreshUser:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setUser(null);
        
        // Clear cache on error
        AUTH_CHECK_CACHE.user = null;
        AUTH_CHECK_CACHE.timestamp = 0;
      } finally {
        setIsLoading(false);
        authCheckTimeoutRef.current = null;
      }
    }, 800); // Increased to 800ms for better debouncing
  }, []);

  // Function to sign out
  const signOut = useCallback(async () => {
    if (shouldLog) console.log('useEnhancedUser: signOut called');
    try {
      setIsLoading(true);
      
      // Log current auth state
      logCookies('Before signOut');
      logLocalStorage('Before signOut');
      
      // First clear cookies manually to ensure they're removed
      if (shouldLog) console.log('useEnhancedUser: Clearing cookies manually');
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=');
        if (name) {
          if (shouldLog) console.log(`useEnhancedUser: Clearing cookie: ${name}`);
          // Clear the cookie with all possible path and domain combinations
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname};`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname};`;
        }
      });
      
      // Clear all Supabase-related local storage items
      if (shouldLog) console.log('useEnhancedUser: Clearing localStorage items');
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('supabase') || 
          key.includes('sb-') || 
          key.includes('auth') || 
          key.includes('redirect')
        )) {
          if (shouldLog) console.log(`useEnhancedUser: Removing localStorage item: ${key}`);
          localStorage.removeItem(key);
        }
      }
      
      // Explicitly remove known items
      if (shouldLog) console.log('useEnhancedUser: Removing specific localStorage items');
      localStorage.removeItem('auth_user_id');
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('redirectTo');
      localStorage.removeItem('loginRedirectUrl');
      localStorage.removeItem('sb-access-token');
      localStorage.removeItem('sb-refresh-token');
      
      // Sign out using the singleton client
      if (shouldLog) console.log('useEnhancedUser: Calling supabase.auth.signOut()');
      try {
        const { error } = await supabase.auth.signOut({ scope: 'global' });
        if (error) {
          console.error('useEnhancedUser: Error from supabase.auth.signOut():', error);
        } else {
          if (shouldLog) console.log('useEnhancedUser: supabase.auth.signOut() successful');
        }
      } catch (e) {
        console.error('useEnhancedUser: Exception during supabase.auth.signOut():', e);
      }
      
      if (shouldLog) console.log('useEnhancedUser: Setting user to null');
      setUser(null);
      
      // Log updated auth state
      logCookies('After signOut');
      logLocalStorage('After signOut');
      
      // Add a delay to ensure everything is cleared before redirecting
      if (shouldLog) console.log('useEnhancedUser: Waiting before redirect...');
      setTimeout(() => {
        // Force a hard navigation to ensure all state is cleared
        if (shouldLog) console.log('useEnhancedUser: Redirecting to login page');
        window.location.href = '/login';
      }, 500);
    } catch (err) {
      console.error('useEnhancedUser: Error signing out:', err);
      setError(err instanceof Error ? err.message : 'Error signing out');
      
      // If sign out fails, force a hard navigation to login after a delay
      if (shouldLog) console.log('useEnhancedUser: Sign out failed, forcing redirect');
      setTimeout(() => {
        window.location.href = '/login';
      }, 500);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check for user on initial load with improved debouncing
  useEffect(() => {
    if (shouldLog) console.log('useEnhancedUser: Initial useEffect running');
    
    // Check if we have a recent cached user
    const now = Date.now();
    if (AUTH_CHECK_CACHE.user && (now - AUTH_CHECK_CACHE.timestamp) < AUTH_CHECK_CACHE.TTL) {
      if (shouldLog) console.log('useEnhancedUser: Using cached user data for initial load');
      setUser(AUTH_CHECK_CACHE.user);
      setIsLoading(false);
      return;
    }
    
    const checkUser = async () => {
      if (shouldLog) console.log('useEnhancedUser: checkUser called');
      try {
        setIsLoading(true);
        
        // Log current auth state
        logCookies('Initial checkUser');
        
        // Use the singleton client to get user directly from Supabase
        if (shouldLog) console.log('useEnhancedUser: Calling supabase.auth.getUser()');
        const { data: { user: userData }, error: userError } = await supabase.auth.getUser();
        
        if (userData) {
          if (shouldLog) {
            console.log('useEnhancedUser: User found in checkUser:', {
              id: userData.id,
              email: userData.email,
              hasMetadata: !!userData.user_metadata
            });
          }
          
          // Also check session to ensure it's valid
          if (shouldLog) console.log('useEnhancedUser: Verifying session');
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('useEnhancedUser: Error getting session:', sessionError);
          } else if (!session) {
            if (shouldLog) console.warn('useEnhancedUser: User exists but no session found, attempting to refresh');
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError) {
              console.error('useEnhancedUser: Error refreshing session:', refreshError);
            } else if (refreshData.session) {
              if (shouldLog) console.log('useEnhancedUser: Session refreshed successfully');
            }
          } else {
            if (shouldLog) {
              console.log('useEnhancedUser: Valid session found:', {
                userId: session.user.id,
                expiresAt: new Date(session.expires_at! * 1000).toISOString()
              });
            }
          }
          
          // Update cache
          AUTH_CHECK_CACHE.user = userData;
          AUTH_CHECK_CACHE.timestamp = Date.now();
          
          setUser(userData as User);
          setError(null);
        } else if (userError) {
          console.error('useEnhancedUser: Error fetching user:', userError);
          setError(userError.message);
          setUser(null);
          
          // Clear cache when no user
          AUTH_CHECK_CACHE.user = null;
          AUTH_CHECK_CACHE.timestamp = 0;
        } else {
          if (shouldLog) console.log('useEnhancedUser: No user found in Supabase');
          setUser(null);
          setError(null);
          
          // Clear cache when no user
          AUTH_CHECK_CACHE.user = null;
          AUTH_CHECK_CACHE.timestamp = 0;
        }
        
        // Log updated auth state
        logCookies('After checkUser');
      } catch (err) {
        console.error('useEnhancedUser: Unexpected error in checkUser:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setUser(null);
        
        // Clear cache when no user
        AUTH_CHECK_CACHE.user = null;
        AUTH_CHECK_CACHE.timestamp = 0;
      } finally {
        setIsLoading(false);
      }
    };
    
    // Clear any existing timeout
    if (authCheckTimeoutRef.current) {
      clearTimeout(authCheckTimeoutRef.current);
    }
    
    // Set a timeout to debounce multiple calls with longer delay
    authCheckTimeoutRef.current = setTimeout(() => {
      checkUser();
      authCheckTimeoutRef.current = null;
    }, 800); // Increased to 800ms for better debouncing
    
    // Cleanup function
    return () => {
      if (authCheckTimeoutRef.current) {
        clearTimeout(authCheckTimeoutRef.current);
      }
    };
  }, []);

  // Memoize the return value to prevent unnecessary re-renders
  const authState = useMemo(() => ({
    user,
    isLoading,
    error,
    refreshUser,
    signOut,
    isAuthenticated: !!user,
  }), [user, isLoading, error, refreshUser, signOut]);

  return authState;
} 