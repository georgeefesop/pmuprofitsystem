'use client';

import { useAuth } from '@/context/AuthContext';
import { useEnhancedUser, User as EnhancedUser } from './useEnhancedUser';
import { useMemo } from 'react';

// Define a combined user type that includes properties from both user types
export interface CombinedUser {
  id: string;
  email?: string;
  full_name?: string;
  user_metadata?: {
    full_name?: string;
    [key: string]: any;
  };
  app_metadata?: {
    [key: string]: any;
  };
}

/**
 * A unified hook that combines AuthContext and useEnhancedUser
 * to provide a single source of truth for authentication state.
 * 
 * This helps prevent duplicate auth checks and unnecessary re-renders.
 */
export function useAuthState() {
  // Get auth state from both sources
  const authContext = useAuth();
  const enhancedUser = useEnhancedUser();
  
  // Combine the state from both hooks, prioritizing AuthContext for user data
  // but using enhanced functionality from useEnhancedUser
  const combinedState = useMemo(() => {
    // Merge user data from both sources
    let combinedUser: CombinedUser | null = null;
    
    if (authContext.user || enhancedUser.user) {
      combinedUser = {
        id: authContext.user?.id || enhancedUser.user?.id || '',
        email: authContext.user?.email || enhancedUser.user?.email || '',
        full_name: authContext.user?.full_name || enhancedUser.user?.user_metadata?.full_name || '',
        user_metadata: enhancedUser.user?.user_metadata || { 
          full_name: authContext.user?.full_name || '' 
        },
        app_metadata: enhancedUser.user?.app_metadata || {}
      };
    }
    
    return {
      // User data (combined from both sources)
      user: combinedUser,
      
      // Loading state (if either is loading, we're loading)
      isLoading: authContext.isLoading || enhancedUser.isLoading,
      
      // Authentication state
      isAuthenticated: authContext.user !== null || enhancedUser.isAuthenticated,
      
      // Error handling
      error: authContext.sessionCheckFailed ? 'Session check failed' : enhancedUser.error,
      
      // Functions (prefer AuthContext functions but fallback to enhanced)
      login: authContext.login,
      logout: authContext.logout,
      register: authContext.register,
      updateProfile: authContext.updateProfile,
      resendVerificationEmail: authContext.resendVerificationEmail,
      
      // Additional functions from useEnhancedUser
      refreshUser: enhancedUser.refreshUser,
      signOut: enhancedUser.signOut,
    };
  }, [
    authContext.user,
    authContext.isLoading,
    authContext.sessionCheckFailed,
    authContext.login,
    authContext.logout,
    authContext.register,
    authContext.updateProfile,
    authContext.resendVerificationEmail,
    enhancedUser.user,
    enhancedUser.isLoading,
    enhancedUser.isAuthenticated,
    enhancedUser.error,
    enhancedUser.refreshUser,
    enhancedUser.signOut,
  ]);
  
  return combinedState;
} 