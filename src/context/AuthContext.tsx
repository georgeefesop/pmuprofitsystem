'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { supabase, getSecureSiteUrl } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  full_name: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  sessionCheckFailed: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
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
      try {
        console.log('Checking session...');
        
        // Add a timeout to prevent hanging
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timed out after 15 seconds')), 15000)
        );
        
        // Race the session check against the timeout
        const { data: { session } } = await Promise.race([
          sessionPromise,
          timeoutPromise.then(() => {
            console.warn('Session check timed out - attempting to recover');
            
            // Try to recover by checking local storage directly
            let recoveredSession = null;
            try {
              if (typeof window !== 'undefined') {
                const storedSession = localStorage.getItem('supabase.auth.token');
                if (storedSession) {
                  console.log('Found stored session in local storage');
                  // We found a stored session, but we won't parse it here
                  // Just indicate that we might have a session
                  recoveredSession = true;
                }
              }
            } catch (storageError) {
              console.error('Error accessing local storage:', storageError);
            }
            
            // If we found a stored session, try one more time with a longer timeout
            if (recoveredSession) {
              console.log('Attempting to recover session...');
              return supabase.auth.getSession()
                .catch(error => {
                  console.error('Recovery attempt failed:', error);
                  return { data: { session: null } };
                });
            }
            
            // Log diagnostic information
            if (typeof window !== 'undefined') {
              const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
              console.log('Supabase URL:', supabaseUrl);
              console.log('Current protocol:', window.location.protocol);
              console.log('Current hostname:', window.location.hostname);
              
              // Check if we're using HTTPS in production but HTTP for Supabase
              if (window.location.protocol === 'https:' && supabaseUrl.startsWith('http:')) {
                console.error('Protocol mismatch: Site is using HTTPS but Supabase URL is using HTTP. This may cause connection issues.');
              }
            }
            
            // Return a structure that matches what getSession would return
            return { data: { session: null } };
          }).catch(error => {
            console.error('Timeout promise error:', error);
            return { data: { session: null } };
          })
        ]).catch(error => {
          console.error('Error checking session:', error);
          setSessionCheckFailed(true);
          return { data: { session: null } };
        });
        
        if (session) {
          // We have a session, set the user
          const { user } = session;
          
          if (user) {
            setUser({
              id: user.id,
              email: user.email || '',
              full_name: user.user_metadata?.full_name || ''
            });
          }
        } else {
          // No session, clear the user
          setUser(null);
        }
      } catch (error) {
        console.error('Session check error:', error);
        setSessionCheckFailed(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      
      if (session) {
        const { user } = session;
        setUser({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || ''
        });
      } else {
        setUser(null);
      }
      
      setIsLoading(false);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      console.log('Attempting login with:', email);
      
      // Add a timeout to prevent hanging
      const loginPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login timed out after 15 seconds')), 15000)
      );
      
      // Race the login against the timeout
      const { data, error } = await Promise.race([
        loginPromise,
        timeoutPromise.then(() => {
          console.warn('Login timed out - attempting to recover');
          
          // Try one more time with a longer timeout
          return supabase.auth.signInWithPassword({
            email,
            password,
          }).catch(retryError => {
            console.error('Login retry failed:', retryError);
            return { 
              data: null, 
              error: { 
                message: 'Login timed out after retry. Please check your network connection and try again.' 
              } 
            };
          });
        })
      ]) as any;
      
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
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          full_name: data.user.user_metadata?.full_name || ''
        });
        return { success: true };
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
      console.log('Logging out...');
      await supabase.auth.signOut({ scope: 'global' });
      
      // Clear any potential auth cookies
      if (typeof window !== 'undefined') {
        // Clear localStorage items related to Supabase auth
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('supabase.auth.expires_at');
        localStorage.removeItem('supabase.auth.refresh_token');
        
        // Clear cookies
        Object.keys(Cookies.get()).forEach(cookieName => {
          if (cookieName.includes('supabase') || cookieName.includes('sb-')) {
            Cookies.remove(cookieName, { path: '/' });
          }
        });
      }
      
      // Ensure user state is cleared
      setUser(null);
      
      // Use only one navigation method to prevent conflicts
      // Use window.location for a clean reload that ensures all state is cleared
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, try to clear everything
      setUser(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
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
      
      // Check if email confirmation is required
      if (data.session === null) {
        console.log('Email confirmation required for:', data.user.id);
        // Return success but indicate email confirmation is needed
        return { 
          success: true, 
          error: 'Please check your email for a verification link before logging in.' 
        };
      }
      
      // If user was created, also create a profile
      // But don't wait for this to complete - it can happen asynchronously
      // This prevents the timeout issue
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
        
        // Return success immediately after auth, don't wait for profile creation
        return { success: true };
      } catch (profileError) {
        console.error('Exception during profile creation setup:', profileError);
        // Continue anyway, as auth was successful
        return { success: true };
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