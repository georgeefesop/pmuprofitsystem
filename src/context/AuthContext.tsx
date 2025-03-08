'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { supabase } from '@/utils/supabase/client';
import { getSecureSiteUrl } from '@/lib/utils';
import { useRouter } from 'next/navigation';

// Log that we're using the singleton client
console.log('AuthContext: Using singleton Supabase client');

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionCheckFailed, setSessionCheckFailed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check for active session on initial load
    const checkSession = async () => {
      console.log('Checking session...');
      try {
        // Create a promise that will resolve with the session check result
        const sessionPromise = new Promise<any>(async (resolve, reject) => {
          try {
            console.log('Getting session from Supabase...');
            const { data: { session } } = await supabase.auth.getSession();
            console.log('Session check result:', session ? 'Session found' : 'No session');
            resolve(session);
          } catch (error) {
            console.error('Error getting session:', error);
            reject(error);
          }
        });

        // Create a timeout promise that will reject after 10 seconds (reduced from 30)
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            console.error('Session check timed out after 10 seconds');
            reject(new Error('Session check timed out after 10 seconds'));
          }, 10000);
        });

        // Race the promises
        let session;
        try {
          session = await Promise.race([sessionPromise, timeoutPromise]);
        } catch (error) {
          console.error('Session check race failed:', error);
          // Gracefully handle timeout by assuming no session
          setUser(null);
          setSessionCheckFailed(true);
          setIsLoading(false);
          return null;
        }
        
        if (session) {
          setUser(session.user);
          setSessionCheckFailed(false);
          console.log('User authenticated:', session.user?.email);
          return session;
        } else {
          setSessionCheckFailed(true);
          console.log('No session found');
          return null;
        }
      } catch (error) {
        console.error('Session check failed:', error);
        setSessionCheckFailed(true);
        setIsLoading(false);
        return null;
      }
    };
    
    checkSession();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session ? 'User logged in' : 'No session');
      
      if (session) {
        const { user } = session;
        setUser({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || ''
        });
        
        // Handle redirection on sign in
        if (event === 'SIGNED_IN' && typeof window !== 'undefined') {
          console.log('User signed in, checking for redirect');
          const redirectTo = localStorage.getItem('redirectTo') || '/dashboard';
          console.log('Redirecting to:', redirectTo);
          
          // Clear the redirect before navigating to prevent redirect loops
          localStorage.removeItem('redirectTo');
          
          // Use a small delay to ensure the auth state is fully updated
          setTimeout(() => {
            // Use router.push instead of window.location for better Next.js integration
            if (typeof window !== 'undefined') {
              window.location.href = redirectTo;
            }
          }, 500); // Increased delay to ensure auth state is fully processed
        }
      } else {
        setUser(null);
        
        // Handle redirection on sign out
        if (event === 'SIGNED_OUT' && typeof window !== 'undefined') {
          console.log('User signed out, redirecting to login');
          
          // Use a small delay to ensure the auth state is fully updated
          setTimeout(() => {
            window.location.href = '/login';
          }, 300);
        }
      }
      
      setIsLoading(false);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> => {
    setIsLoading(true);

    try {
      console.log('Attempting login with:', email);

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
        const result = await Promise.race([loginPromise, timeoutPromise]) as { 
          data: any; 
          error: any;
        };
        data = result.data;
        error = result.error;
      } catch (timeoutError) {
        console.warn('Login timed out - attempting to recover');
        
        try {
          // Try one more time with a shorter timeout
          const retryResult = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          data = retryResult.data;
          error = retryResult.error;
        } catch (retryError) {
          console.error('Login retry failed:', retryError);
          setIsLoading(false);
          return {
            success: false,
            error: 'Login timed out. Please check your network connection and try again.'
          };
        }
      }
      
      if (error) {
        console.error('Login error from Supabase:', error);
        
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
        console.log('Login successful, user:', data.user.id);
        
        // Ensure cookies are set properly
        try {
          // Force a session refresh to ensure cookies are set
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.warn('Session refresh after login failed:', refreshError);
            // Continue anyway since the initial login was successful
          } else if (refreshData.session) {
            console.log('Session refreshed successfully after login');
          }
        } catch (refreshError) {
          console.warn('Exception during session refresh after login:', refreshError);
          // Continue anyway since the initial login was successful
        }
        
        // Set the user in the context
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          full_name: data.user.user_metadata?.full_name || ''
        });
        
        // Store auth status in a cookie for middleware with proper settings
        Cookies.set('auth-status', 'authenticated', { 
          expires: 7, 
          path: '/',
          secure: window.location.protocol === 'https:',
          sameSite: 'strict'
        });
        
        // Store session ID in a cookie for middleware
        if (data.session?.access_token) {
          Cookies.set('sb-auth-token', data.session.access_token, {
            expires: 7,
            path: '/',
            secure: window.location.protocol === 'https:',
            sameSite: 'strict'
          });
        }
        
        // Store user ID in localStorage as a backup
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_user_id', data.user.id);
        }
        
        return { 
          success: true,
          user: {
            id: data.user.id,
            email: data.user.email || '',
            full_name: data.user.user_metadata?.full_name || ''
          }
        };
      } else {
        return { 
          success: false, 
          error: 'Login failed: No user data returned' 
        };
      }
    } catch (error: any) {
      console.error('Unexpected login error:', error);
      return { 
        success: false, 
        error: `Login failed: ${error.message || 'Unexpected error'}` 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    
    try {
      console.log('Logging out user...');
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }
      
      // Clear user state
      setUser(null);
      
      // Clear auth cookies
      Cookies.remove('auth-status', { path: '/' });
      Cookies.remove('sb-auth-token', { path: '/' });
      
      // Clear localStorage items
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_user_id');
        localStorage.removeItem('redirectTo');
        localStorage.removeItem('loginRedirectUrl');
      }
      
      console.log('User logged out successfully');
      
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout failed:', error);
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
      
      // Proceed with registration
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
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
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      login, 
      logout, 
      register, 
      updateProfile,
      sessionCheckFailed,
      resendVerificationEmail
    }}>
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