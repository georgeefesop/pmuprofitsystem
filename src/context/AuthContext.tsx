'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { supabase } from '@/utils/supabase/client';
import { getSecureSiteUrl } from '@/lib/utils';
import { getCurrentEnvironment, getEnvironmentName } from '@/lib/env-utils';
import { useRouter } from 'next/navigation';

// Enhanced logging for debugging
console.log('AuthContext: Initializing with singleton Supabase client');
console.log('AuthContext: Environment:', {
  isDev: process.env.NODE_ENV === 'development',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 15) + '...',
  hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
});

interface User {
  id: string;
  email: string;
  full_name: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  sessionCheckFailed: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; error?: string; previewUrl?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
    
    console.log(`${prefix} Cookies:`, {
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
    
    console.log(`${prefix} LocalStorage:`, {
      'auth_user_id': localStorage.getItem('auth_user_id') || 'Missing',
      'sb-access-token': localStorage.getItem('sb-access-token') ? '✓ Present' : '✗ Missing',
      'sb-refresh-token': localStorage.getItem('sb-refresh-token') ? '✓ Present' : '✗ Missing',
      authItemCount: Object.keys(authItems).length
    });
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionCheckFailed, setSessionCheckFailed] = useState(false);
  const router = useRouter();

  // Function to clear all auth-related cookies and localStorage items
  const clearAuthData = () => {
    console.log('AuthContext: Clearing all auth data');
    
    // Log cookies before clearing
    logCookies('Before clearing');
    
    // Clear auth cookies
    Cookies.remove('auth-status', { path: '/' });
    Cookies.remove('sb-auth-token', { path: '/' });
    
    // Clear Supabase cookies
    const cookiesToClear = [
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token'
    ];
    
    cookiesToClear.forEach(cookieName => {
      Cookies.remove(cookieName, { path: '/' });
    });
    
    // Clear localStorage items
    if (typeof window !== 'undefined') {
      console.log('AuthContext: Clearing localStorage items');
      localStorage.removeItem('auth_user_id');
      localStorage.removeItem('redirectTo');
      localStorage.removeItem('loginRedirectUrl');
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-access-token');
      localStorage.removeItem('sb-refresh-token');
    }
    
    // Log cookies after clearing
    logCookies('After clearing');
  };

  useEffect(() => {
    // Check for active session on initial load
    const checkSession = async () => {
      console.log('AuthContext: Checking session on initial load...');
      logCookies('Initial load');
      logLocalStorage('Initial load');
      
      try {
        // Create a promise that will resolve with the session check result
        const sessionPromise = new Promise<any>(async (resolve, reject) => {
          try {
            console.log('AuthContext: Getting session from Supabase...');
            const { data: { session } } = await supabase.auth.getSession();
            console.log('AuthContext: Session check result:', session ? 'Session found' : 'No session');
            if (session) {
              console.log('AuthContext: Session details:', {
                userId: session.user.id,
                email: session.user.email,
                expiresAt: new Date(session.expires_at! * 1000).toISOString(),
                hasAccessToken: !!session.access_token?.substring(0, 10),
                hasRefreshToken: !!session.refresh_token?.substring(0, 10)
              });
            }
            resolve(session);
          } catch (error) {
            console.error('AuthContext: Error getting session:', error);
            reject(error);
          }
        });

        // Create a timeout promise that will reject after 10 seconds (reduced from 30)
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            console.error('AuthContext: Session check timed out after 10 seconds');
            reject(new Error('Session check timed out after 10 seconds'));
          }, 10000);
        });

        // Race the promises
        let session;
        try {
          session = await Promise.race([sessionPromise, timeoutPromise]);
        } catch (error) {
          console.error('AuthContext: Session check race failed:', error);
          // Gracefully handle timeout by assuming no session
          setUser(null);
          setSessionCheckFailed(true);
          setIsLoading(false);
          return null;
        }
        
        if (session) {
          console.log('AuthContext: Setting user from session:', {
            id: session.user.id,
            email: session.user.email
          });
          
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name || ''
          });
          setSessionCheckFailed(false);
          console.log('AuthContext: User authenticated:', session.user?.email);
          
          // Set auth-status cookie to ensure middleware recognizes the user
          console.log('AuthContext: Setting auth-status cookie');
          Cookies.set('auth-status', 'authenticated', { 
            expires: 30, // Extend to 30 days for better persistence
            path: '/',
            secure: window.location.protocol === 'https:',
            sameSite: 'lax' // Use lax for better compatibility
          });
          
          // Also store user ID in localStorage as a backup
          localStorage.setItem('auth_user_id', session.user.id);
          
          // Log cookies after setting
          logCookies('After setting auth cookies');
          
          return session;
        } else {
          setSessionCheckFailed(true);
          console.log('AuthContext: No session found, clearing any stale auth data');
          clearAuthData(); // Clear any stale auth data
          return null;
        }
      } catch (error) {
        console.error('AuthContext: Session check failed:', error);
        setSessionCheckFailed(true);
        setIsLoading(false);
        return null;
      }
    };
    
    checkSession().finally(() => {
      setIsLoading(false);
    });
  }, []);

  // Set up auth state change listener
  useEffect(() => {
    console.log('AuthContext: Setting up auth state change listener');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`AuthContext: Auth state changed: ${event}`, {
          hasSession: !!session,
          userId: session?.user?.id || 'none',
          event
        });
        
        if (event === 'SIGNED_IN') {
          console.log('AuthContext: SIGNED_IN event detected');
          
          if (session?.user) {
            console.log('AuthContext: Setting user from SIGNED_IN event:', {
              id: session.user.id,
              email: session.user.email
            });
            
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              full_name: session.user.user_metadata?.full_name || ''
            });
            
            // Set auth-status cookie
            console.log('AuthContext: Setting auth-status cookie from SIGNED_IN event');
            Cookies.set('auth-status', 'authenticated', { 
              expires: 30,
              path: '/',
              secure: window.location.protocol === 'https:',
              sameSite: 'lax'
            });
            
            // Also set a cookie directly for better compatibility with middleware
            document.cookie = `auth-status=authenticated; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
            
            // Store user ID in localStorage
            localStorage.setItem('auth_user_id', session.user.id);
            
            // Check for redirect URL in localStorage
            const redirectTo = localStorage.getItem('loginRedirectUrl') || '/dashboard';
            console.log('AuthContext: Checking for redirect URL:', redirectTo);
            
            // Clear the redirect URL from localStorage
            localStorage.removeItem('loginRedirectUrl');
            
            // Add a delay to ensure cookies are set before redirect
            setTimeout(() => {
              console.log('AuthContext: Executing redirect to:', redirectTo);
              try {
                // Force a hard navigation to ensure cookies are properly set
                window.location.replace(redirectTo);
              } catch (redirectError) {
                console.error('AuthContext: Error during redirect:', redirectError);
                // Fallback to href if replace fails
                window.location.href = redirectTo;
              }
            }, 1000);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('AuthContext: SIGNED_OUT event detected');
          setUser(null);
          clearAuthData();
        }
      }
    );
    
    return () => {
      console.log('AuthContext: Cleaning up auth state change listener');
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> => {
    console.log('AuthContext: Attempting login with email:', email);
    setIsLoading(true);
    
    // Log current auth state before login
    logCookies('Before login');
    logLocalStorage('Before login');

    try {
      // Get current environment
      const currentEnvironment = getCurrentEnvironment();
      console.log('AuthContext: Current environment:', currentEnvironment);

      // Add a shorter timeout to prevent hanging
      const loginPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Login timed out after 8 seconds')), 8000)
      );

      let data, error;
      
      try {
        // Race the login against the timeout
        console.log('AuthContext: Executing login request with timeout');
        const result = await Promise.race([loginPromise, timeoutPromise]) as { 
          data: any; 
          error: any;
        };
        data = result.data;
        error = result.error;
      } catch (timeoutError) {
        console.warn('AuthContext: Login timed out - attempting to recover');
        
        try {
          // Try one more time with a shorter timeout
          console.log('AuthContext: Retrying login after timeout');
          const retryResult = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          data = retryResult.data;
          error = retryResult.error;
        } catch (retryError) {
          console.error('AuthContext: Login retry failed:', retryError);
          setIsLoading(false);
          return {
            success: false,
            error: 'Login timed out. Please check your network connection and try again.'
          };
        }
      }
      
      if (error) {
        console.error('AuthContext: Login error from Supabase:', error);
        
        // Provide more specific error messages based on the error
        if (error.message?.includes('ERR_NAME_NOT_RESOLVED') || 
            error.message?.includes('NetworkError') || 
            error.message?.includes('Failed to fetch')) {
          return { 
            success: false, 
            error: 'Cannot connect to authentication service. Please check your internet connection and try again.' 
          };
        } else if (error.message?.includes('Invalid login credentials')) {
          return { 
            success: false, 
            error: 'Invalid email or password. Please check your credentials and try again.' 
          };
        } else if (error.message?.includes('Email not confirmed')) {
          return { 
            success: false, 
            error: 'Your email has not been verified. Please check your inbox for a verification email or request a new one.' 
          };
        } else {
          return { 
            success: false, 
            error: `Login failed: ${error.message || 'Unknown error'}` 
          };
        }
      }
      
      if (data?.user) {
        console.log('AuthContext: Login successful, user:', data.user.id);
        console.log('AuthContext: Session data:', {
          hasSession: !!data.session,
          hasAccessToken: !!data.session?.access_token,
          hasRefreshToken: !!data.session?.refresh_token,
          expiresAt: data.session ? new Date(data.session.expires_at! * 1000).toISOString() : 'N/A'
        });
        
        // Check if the user was created in the current environment
        const userEnvironment = data.user.app_metadata?.environment;
        console.log('AuthContext: User environment:', userEnvironment);
        
        if (userEnvironment && userEnvironment !== currentEnvironment) {
          console.warn(`AuthContext: User was created in ${userEnvironment} environment but trying to log in from ${currentEnvironment} environment`);
          
          // Sign out the user to clear the session
          await supabase.auth.signOut();
          
          // Return a friendly error message
          const currentEnvName = getEnvironmentName();
          const userEnvName = userEnvironment === 'local' ? 'Local Development' : 'Production';
          
          // Redirect to the environment mismatch page
          if (typeof window !== 'undefined') {
            const errorMessage = `This account was created in the ${userEnvName} environment and cannot be accessed from the ${currentEnvName} environment.`;
            const encodedError = encodeURIComponent(errorMessage);
            window.location.href = `/auth/environment-mismatch?userEnv=${userEnvironment}&currentEnv=${currentEnvironment}&error=${encodedError}`;
          }
          
          return {
            success: false,
            error: `This account was created in the ${userEnvName} environment and cannot be accessed from the ${currentEnvName} environment. Please use the same environment where you created your account.`
          };
        }
        
        // If no environment is set, update the user's metadata with the current environment
        if (!userEnvironment) {
          console.log('AuthContext: User has no environment set, updating with current environment');
          try {
            await supabase.auth.updateUser({
              data: {
                environment: currentEnvironment
              }
            });
          } catch (updateError) {
            console.error('AuthContext: Error updating user environment:', updateError);
            // Continue with login even if update fails
          }
        }
        
        // Ensure cookies are set properly
        try {
          // Force a session refresh to ensure cookies are set
          console.log('AuthContext: Refreshing session to ensure cookies are set');
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.warn('AuthContext: Session refresh after login failed:', refreshError);
            // Continue anyway since the initial login was successful
          } else if (refreshData.session) {
            console.log('AuthContext: Session refreshed successfully after login');
            console.log('AuthContext: Refreshed session details:', {
              userId: refreshData.session.user.id,
              expiresAt: new Date(refreshData.session.expires_at! * 1000).toISOString(),
              hasAccessToken: !!refreshData.session.access_token,
              hasRefreshToken: !!refreshData.session.refresh_token
            });
          }
        } catch (refreshError) {
          console.warn('AuthContext: Exception during session refresh after login:', refreshError);
          // Continue anyway since the initial login was successful
        }
        
        // Set the user in the context
        console.log('AuthContext: Setting user in context after login');
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          full_name: data.user.user_metadata?.full_name || ''
        });
        
        // Store auth status in a cookie for middleware with proper settings
        console.log('AuthContext: Setting auth-status cookie after login');
        Cookies.set('auth-status', 'authenticated', { 
          expires: 30, // Extend to 30 days
          path: '/',
          secure: window.location.protocol === 'https:',
          sameSite: 'lax' // Change to lax for better compatibility
        });
        
        // Also set a cookie directly for better compatibility with middleware
        document.cookie = `auth-status=authenticated; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
        
        // Store user ID in localStorage as a backup
        console.log('AuthContext: Storing user ID in localStorage');
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_user_id', data.user.id);
          
          // Also store the session tokens in localStorage as a backup
          if (data.session) {
            localStorage.setItem('sb-access-token', data.session.access_token);
            localStorage.setItem('sb-refresh-token', data.session.refresh_token);
          }
          
          // Get redirect URL from query params or default to dashboard
          const params = new URLSearchParams(window.location.search);
          const redirectParam = params.get('redirect');
          console.log('AuthContext: Redirect param from URL:', redirectParam);
          
          let redirectUrl = '/dashboard';
          if (redirectParam) {
            // Decode the redirect parameter if it's URL encoded
            redirectUrl = decodeURIComponent(redirectParam);
            console.log('AuthContext: Decoded redirect URL:', redirectUrl);
          }
          
          // Store the redirect URL in localStorage for the auth state change listener
          console.log('AuthContext: Storing redirect URL in localStorage:', redirectUrl);
          localStorage.setItem('loginRedirectUrl', redirectUrl);
        }
        
        // Log auth state after login
        logCookies('After login');
        logLocalStorage('After login');
        
        return { 
          success: true,
          user: {
            id: data.user.id,
            email: data.user.email || '',
            full_name: data.user.user_metadata?.full_name || ''
          }
        };
      } else {
        console.error('AuthContext: Login failed - no user data returned');
        return { 
          success: false, 
          error: 'Login failed: No user data returned' 
        };
      }
    } catch (error: any) {
      console.error('AuthContext: Unexpected login error:', error);
      return { 
        success: false, 
        error: `Login failed: ${error.message || 'Unexpected error'}` 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    console.log('AuthContext: Logging out user...');
    setIsLoading(true);
    
    // Log auth state before logout
    logCookies('Before logout');
    logLocalStorage('Before logout');
    
    try {
      // Sign out from Supabase
      console.log('AuthContext: Calling supabase.auth.signOut()');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('AuthContext: Error signing out:', error);
        throw error;
      }
      
      // Clear user state
      console.log('AuthContext: Setting user to null');
      setUser(null);
      
      // Clear all auth data
      console.log('AuthContext: Clearing all auth data');
      clearAuthData();
      
      console.log('AuthContext: User logged out successfully');
      
      // Log auth state after logout
      logCookies('After logout');
      logLocalStorage('After logout');
      
      // Redirect to login page
      if (typeof window !== 'undefined') {
        console.log('AuthContext: Redirecting to login page');
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('AuthContext: Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      console.log('Registering user:', email);
      
      // First check if the user already exists
      try {
        const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
        
        if (!userError && userData) {
          const existingUser = userData.users.find(u => u.email === email);
          
          if (existingUser) {
            // If the user exists but is banned, unban them
            if ((existingUser as any).banned_until) {
              const { error: updateError } = await supabase.auth.admin.updateUserById(
                existingUser.id,
                { ban_duration: '0' }
              );
              
              if (updateError) {
                console.error('Error unbanning existing user:', updateError);
              } else {
                console.log('Unbanned existing user:', existingUser.id);
              }
            }
            
            // If the user exists but doesn't have a password, we'll proceed with sign-up
            // which will either link the account or return an "already exists" error
            console.log('User already exists, proceeding with sign-up to potentially update account');
          }
        }
      } catch (checkError) {
        console.error('Error checking for existing user:', checkError);
        // Continue with registration attempt
      }
      
      // Get the site URL, preserving the protocol
      const redirectUrl = `${getSecureSiteUrl()}/auth/callback`;
      console.log('Using redirect URL for registration:', redirectUrl);
      
      // Get current environment
      const environment = getCurrentEnvironment();
      console.log('Registering user in environment:', environment);
      
      // Proceed with registration
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            environment: environment, // Add environment to user metadata
          },
          // Explicitly set emailRedirectTo to ensure proper redirect after email verification
          emailRedirectTo: redirectUrl,
        },
      });
      
      console.log('Registration response:', data ? 'Success' : 'Failed', error);
      
      if (error) {
        console.error('Registration error from Supabase:', error);
        
        // If the error is that the user already exists, provide a helpful message
        if (error.message.includes('already exists')) {
          return { 
            success: false, 
            error: 'An account with this email already exists. Please log in or use the "Forgot Password" option if needed.' 
          };
        }
        
        return { success: false, error: error.message };
      }
      
      if (!data.user) {
        console.error('Registration succeeded but no user returned');
        return { success: false, error: 'Registration succeeded but no user was created' };
      }
      
      console.log('Registration successful, user:', data.user.id);
      
      // Create profile in the background
      try {
        console.log('Creating user profile after registration for:', data.user.id);
        
        // Create profile in the background
        (async () => {
          try {
            const { error: profileError } = await supabase
              .from('users')
              .insert({
                id: data.user!.id,
                email: data.user!.email || email, // Fallback to the email parameter if user.email is null
                full_name: name,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
              
            if (profileError) {
              console.error('Error creating user profile after registration:', profileError);
            } else {
              console.log('User profile created successfully');
            }
          } catch (err) {
            console.error('Exception during profile creation:', err);
          }
        })();
      } catch (profileError) {
        console.error('Exception during profile creation setup:', profileError);
      }
      
      // If we have a session, the user is already logged in
      if (data.session) {
        // Set the user in the context
        setUser({
          id: data.user.id,
          email: data.user.email || email,
          full_name: name
        });
        return { success: true };
      }
      
      // If no session, try to log in the user immediately
      try {
        console.log('Attempting to log in user after registration');
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (loginError) {
          console.error('Error logging in after registration:', loginError);
          // Return success anyway since registration was successful
          return { success: true, error: 'Account created successfully, but you need to log in manually.' };
        }
        
        if (loginData.user) {
          // Set the user in the context
          setUser({
            id: loginData.user.id,
            email: loginData.user.email || email,
            full_name: loginData.user.user_metadata?.full_name || name
          });
        }
        
        return { success: true };
      } catch (loginError) {
        console.error('Exception during auto-login after registration:', loginError);
        // Return success anyway since registration was successful
        return { success: true, error: 'Account created successfully, but you need to log in manually.' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }
    
    try {
      console.log('Updating profile for:', user.id, data);
      const { error } = await supabase
        .from('users')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
        
      if (error) {
        console.error('Profile update error:', error);
        return { success: false, error: error.message };
      }
      
      setUser({ ...user, ...data });
      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const resendVerificationEmail = async (email: string): Promise<{ success: boolean; error?: string; previewUrl?: string }> => {
    try {
      console.log('Resending verification email to:', email);
      
      // Get the site URL, preserving the protocol
      const redirectUrl = `${getSecureSiteUrl()}/auth/callback`;
      console.log('Using redirect URL:', redirectUrl);
      
      // We can't check if the user exists from the client side with the regular client
      // So we'll just attempt to resend the verification email
      
      // Attempt to resend the verification email
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });
      
      console.log('Resend response:', data ? 'Success' : 'Failed', error);
      
      if (error) {
        console.error('Error resending verification email:', error);
        
        // Handle specific error cases
        if (error.message.includes('rate limit')) {
          return { 
            success: false, 
            error: 'Too many verification emails sent recently. Please wait a few minutes and try again.' 
          };
        }
        
        // Check if the user doesn't exist
        if (error.message.includes('User not found') || error.message.includes('No user found')) {
          return { 
            success: false, 
            error: 'No account found with this email address. Please check the email or sign up for a new account.' 
          };
        }
        
        return { success: false, error: error.message };
      }
      
      // Try to send a custom email through our API as a backup
      let previewUrl: string | undefined;
      try {
        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: email,
            subject: 'Verification Email Resent',
            text: `A verification email has been resent to your address. Please check your inbox and spam folder for an email from Supabase or PMU Profit System.
            
If you don't receive it within a few minutes, please contact support.

Verification Link: ${redirectUrl}?type=signup&email=${encodeURIComponent(email)}
(Note: This is a backup link. The official verification link in the email from Supabase should be used first.)`
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.previewUrl) {
            console.log('Email preview URL:', data.previewUrl);
            previewUrl = data.previewUrl;
          }
        } else {
          console.warn('Failed to send backup notification email');
        }
      } catch (emailError) {
        console.error('Error sending backup email:', emailError);
        // Continue anyway, as this is just a backup notification
      }
      
      return { 
        success: true,
        previewUrl
      };
    } catch (error) {
      console.error('Exception during resend verification:', error);
      return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        sessionCheckFailed,
        login,
        logout,
        register,
        updateProfile,
        resendVerificationEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 