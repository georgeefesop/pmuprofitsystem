"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase"; // Import the shared Supabase client

// Define user type
export interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

/**
 * Hook to access the current authenticated user
 */
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Initial session check and auth state listener
  useEffect(() => {
    // Check current session
    const checkUser = async () => {
      try {
        console.log("Checking user session...");
        
        // First try the API endpoint
        try {
          const response = await fetch('/api/auth/session');
          if (response.ok) {
            const data = await response.json();
            console.log("Session API response:", data);
            if (data.authenticated && data.user) {
              console.log("User authenticated via API:", data.user);
              setUser(data.user);
              setIsLoading(false);
              return;
            }
          }
        } catch (apiError) {
          console.error("Error fetching from session API:", apiError);
          // Continue to fallback
        }
        
        // Fallback to direct Supabase check
        console.log("Falling back to direct Supabase check");
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log("User authenticated via Supabase:", session.user);
          setUser(session.user);
        } else {
          console.log("No authenticated user found");
          setUser(null);
        }
      } catch (error) {
        console.error("Error checking auth session:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event);
        if (session?.user) {
          console.log("User from auth state change:", session.user);
          setUser(session.user);
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

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      console.error("Error signing in:", error);
      return { error };
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });
      return { error };
    } catch (error) {
      console.error("Error signing up:", error);
      return { error };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      console.log("Refreshing user data...");
      
      // First try the API endpoint
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated && data.user) {
            console.log("Refreshed user via API:", data.user);
            setUser(data.user);
            return;
          }
        }
      } catch (apiError) {
        console.error("Error refreshing from session API:", apiError);
        // Continue to fallback
      }
      
      // Fallback to direct Supabase check
      console.log("Falling back to direct Supabase getUser");
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        console.log("Refreshed user via Supabase:", data.user);
        setUser(data.user);
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  };

  // Resend verification email
  const resendVerificationEmail = async (email: string) => {
    try {
      console.log("Resending verification email to:", email);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      
      if (error) {
        console.error("Error resending verification email:", error);
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (error) {
      console.error("Exception resending verification email:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  };

  return {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    refreshUser,
    resendVerificationEmail,
  };
} 