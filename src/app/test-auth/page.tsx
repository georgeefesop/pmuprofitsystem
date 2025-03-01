'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface DebugInfo {
  supabaseUrl: string | undefined;
  hasAnonKey: boolean;
  timestamp?: string;
}

export default function TestAuth() {
  const { user, isLoading, sessionCheckFailed, login, logout, register } = useAuth();
  
  // Separate state for sign-up form
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // Separate state for sign-in form
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  useEffect(() => {
    setDebugInfo(prevInfo => ({
      ...prevInfo,
      timestamp: new Date().toISOString()
    }));
    
    // Check if user is already authenticated on page load
    if (user) {
      setNotification({
        type: 'success',
        message: `You are signed in as ${user.email}`
      });
    }
  }, [user]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setNotification(null);
    
    try {
      console.log('Attempting to sign up with:', { email: signUpEmail, password: signUpPassword, fullName });
      
      // Add a timeout to prevent hanging
      const signUpPromise = register(signUpEmail, signUpPassword, fullName);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign up timed out after 15 seconds')), 15000)
      );
      
      // Race the sign-up against the timeout
      const { success, error } = await Promise.race([
        signUpPromise,
        timeoutPromise.then(() => ({ success: false, error: 'Sign up timed out after 15 seconds' }))
      ]) as { success: boolean, error?: string };
      
      console.log('Sign up response:', { success, error });
      
      if (success) {
        // Clear the form fields
        setSignUpEmail('');
        setSignUpPassword('');
        setFullName('');
        
        setResult({ 
          action: 'Sign Up',
          success: true,
          message: 'Sign up successful! Please check your email for verification.'
        });
        
        // Show success notification
        setNotification({
          type: 'success',
          message: 'Sign up successful! Please check your email for verification. You can now sign in with your credentials.'
        });
      } else {
        setResult({ 
          action: 'Sign Up',
          success: false,
          error,
          message: error ? `Sign up failed: ${error}` : 'Sign up failed for unknown reason'
        });
        
        // Show error notification
        setNotification({
          type: 'error',
          message: error ? `Sign up failed: ${error}` : 'Sign up failed. Please try again.'
        });
      }
    } catch (error) {
      console.error('Exception during sign up:', error);
      setResult({ 
        action: 'Sign Up',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Sign up failed due to an unexpected error'
      });
      
      // Show error notification
      setNotification({
        type: 'error',
        message: 'Sign up failed due to an unexpected error. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setNotification(null);
    
    try {
      console.log('Attempting to sign in with:', { email: signInEmail, password: signInPassword });
      
      // Import supabase to set up a listener
      const { supabase } = await import('@/lib/supabase');
      
      // Set up a listener for auth state changes
      let authStateChanged = false;
      const authListener = supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state change during context sign-in:', event, session ? 'Session exists' : 'No session');
        if (event === 'SIGNED_IN' && session) {
          authStateChanged = true;
          
          // Update the result state
          setResult({ 
            action: 'Sign In',
            success: true,
            message: 'Sign in successful!'
          });
          
          // Show notification
          setNotification({
            type: 'success',
            message: 'Sign in successful! You are now authenticated.'
          });
        }
      });
      
      // Attempt sign in through context
      const result = await login(signInEmail, signInPassword);
      console.log('Context sign in response:', result);
      
      // If we have an error from the context login, show it
      if (!result.success) {
        setResult({ 
          action: 'Sign In',
          success: false,
          error: result.error,
          message: result.error ? `Sign in failed: ${result.error}` : 'Sign in failed for unknown reason'
        });
      } 
      // If login was successful but no auth state change was detected
      else if (!authStateChanged) {
        setResult({ 
          action: 'Sign In',
          success: true,
          message: 'Sign in successful!'
        });
        
        // Show notification
        setNotification({
          type: 'success',
          message: 'Sign in successful! You are now authenticated.'
        });
      }
      
      // Clean up the listener
      authListener.data.subscription.unsubscribe();
      
    } catch (error) {
      console.error('Exception during sign in:', error);
      setResult({ 
        action: 'Sign In',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Sign in failed due to an unexpected error'
      });
      
      // Show error notification
      setNotification({
        type: 'error',
        message: 'Sign in failed. Please check your credentials and try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Direct sign-in with Supabase
  const handleDirectSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setNotification(null);
    
    try {
      console.log('Attempting direct sign in with:', { email: signInEmail, password: signInPassword });
      
      // Import supabase directly
      const { supabase } = await import('@/lib/supabase');
      
      // Set up a listener for auth state changes
      let authStateChanged = false;
      const authListener = supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state change during sign-in:', event, session ? 'Session exists' : 'No session');
        if (event === 'SIGNED_IN' && session) {
          authStateChanged = true;
          
          // Update the result state
          setResult({ 
            action: 'Direct Sign In',
            success: true,
            session: session,
            message: 'Direct sign in successful!'
          });
          
          // Show notification
          setNotification({
            type: 'success',
            message: 'Sign in successful! You are now authenticated.'
          });
        }
      });
      
      // Attempt sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password: signInPassword,
      });
      
      console.log('Direct sign in API response:', { data, error });
      
      // If we have an error from the API call, show it
      if (error) {
        setResult({ 
          action: 'Direct Sign In',
          success: false,
          error: error.message,
          message: `Direct sign in failed: ${error.message}`
        });
      } 
      // If we have data but no auth state change was detected
      else if (data && !authStateChanged) {
        // Check if we have a session
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData.session) {
          setResult({ 
            action: 'Direct Sign In',
            success: true,
            data,
            session: sessionData.session,
            message: 'Direct sign in successful!'
          });
          
          // Show notification
          setNotification({
            type: 'success',
            message: 'Sign in successful! You are now authenticated.'
          });
        } else {
          setResult({ 
            action: 'Direct Sign In',
            success: true,
            data,
            message: 'Direct sign in appeared successful, but no session was created.'
          });
        }
      }
      
      // Clean up the listener
      authListener.data.subscription.unsubscribe();
      
    } catch (error) {
      console.error('Exception during direct sign in:', error);
      setResult({ 
        action: 'Direct Sign In',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Direct sign in failed due to an unexpected error'
      });
      
      // Show error notification
      setNotification({
        type: 'error',
        message: 'Sign in failed. Please check your credentials and try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    
    try {
      await logout();
      setResult({ 
        action: 'Sign Out',
        message: 'Signed out successfully'
      });
    } catch (error) {
      console.error('Exception during sign out:', error);
      setResult({ 
        action: 'Sign Out',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Sign out failed due to an unexpected error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestQuery = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      // Import supabase directly for this test
      const { supabase } = await import('@/lib/supabase');
      
      // First check if we have a session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setResult({ 
          action: 'Query Users',
          success: false,
          error: 'No active session found',
          message: 'You must be signed in to query the users table'
        });
        return;
      }
      
      // Test query to users table
      const { data, error } = await supabase.from('users').select('*').limit(5);
      
      if (error) {
        console.error('Error querying users table:', error);
        setResult({ 
          action: 'Query Users',
          success: false,
          error: error.message,
          message: `Failed to query users table: ${error.message}`,
          details: error
        });
      } else {
        setResult({ 
          action: 'Query Users',
          success: true,
          data,
          message: data && data.length > 0 
            ? `Successfully retrieved ${data.length} user(s)` 
            : 'Query successful but no users found'
        });
      }
    } catch (error) {
      console.error('Exception during test query:', error);
      setResult({ 
        action: 'Query Users',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Query failed due to an unexpected error'
      });
    } finally {
      setLoading(false);
    }
  };

  const checkAuthStatus = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const emailToCheck = signInEmail || signUpEmail || (user?.email);
      
      if (!emailToCheck) {
        setResult({
          action: 'Check Auth Status',
          success: false,
          error: 'No email provided',
          message: 'Please enter an email address or sign in first'
        });
        return;
      }
      
      const response = await fetch(`/api/test-auth-status?email=${encodeURIComponent(emailToCheck)}`);
      const data = await response.json();
      
      setResult({
        action: 'Check Auth Status',
        success: response.ok,
        data,
        message: response.ok 
          ? 'Successfully retrieved auth status' 
          : `Failed to check auth status: ${data.error}`
      });
    } catch (error) {
      console.error('Exception during auth status check:', error);
      setResult({
        action: 'Check Auth Status',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to check auth status due to an unexpected error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Supabase Auth Test (Using Context)</h1>
      
      {/* Authentication Status Banner */}
      <div className={`mb-6 p-4 rounded flex items-center ${
        user ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
      }`}>
        <div className="mr-4">
          {user ? (
            <div className="bg-green-500 text-white rounded-full w-10 h-10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="bg-gray-500 text-white rounded-full w-10 h-10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex-grow">
          <h2 className="text-lg font-semibold">
            {user ? 'Authenticated' : 'Not Authenticated'}
          </h2>
          <p>
            {user 
              ? `Signed in as ${user.email} (${user.full_name})` 
              : 'Please sign in using one of the methods below'}
          </p>
        </div>
        {user && (
          <button 
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Sign Out'}
          </button>
        )}
      </div>
      
      {sessionCheckFailed && (
        <div className="mb-6 p-4 rounded bg-yellow-100 text-yellow-800">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-medium">Connection to Supabase timed out</p>
              <p className="mt-1">This may indicate connectivity issues with Supabase. You can still try to sign in or sign up, but some features may not work properly.</p>
            </div>
          </div>
        </div>
      )}
      
      {notification && (
        <div className={`mb-6 p-4 rounded flex justify-between items-center ${
          notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span>{notification.message}</span>
          </div>
          <button 
            onClick={() => setNotification(null)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      
      <div className="mb-8 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-semibold mb-2">Debug Information</h2>
        <pre className="whitespace-pre-wrap bg-white p-4 rounded border">
          {JSON.stringify({
            ...debugInfo,
            sessionCheckFailed,
            isAuthenticated: !!user,
            userEmail: user?.email || null
          }, null, 2)}
        </pre>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-6 border rounded">
          <h2 className="text-xl font-semibold mb-4">Sign Up</h2>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label htmlFor="signup-fullname" className="block mb-1">Full Name</label>
              <input
                id="signup-fullname"
                name="fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div>
              <label htmlFor="signup-email" className="block mb-1">Email</label>
              <input
                id="signup-email"
                name="email"
                type="email"
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div>
              <label htmlFor="signup-password" className="block mb-1">Password</label>
              <input
                id="signup-password"
                name="password"
                type="password"
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Sign Up'}
            </button>
          </form>
        </div>
        
        <div className="p-6 border rounded">
          <h2 className="text-xl font-semibold mb-4">Sign In</h2>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label htmlFor="signin-email" className="block mb-1">Email</label>
              <input
                id="signin-email"
                name="email"
                type="email"
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div>
              <label htmlFor="signin-password" className="block mb-1">Password</label>
              <input
                id="signin-password"
                name="password"
                type="password"
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-green-600 text-white rounded"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Sign In (via Context)'}
            </button>
          </form>
          
          <div className="mt-4 pt-4 border-t">
            <h3 className="text-lg font-medium mb-2">Direct Sign In</h3>
            <p className="text-sm text-gray-600 mb-2">Try signing in directly with Supabase</p>
            <button
              onClick={handleDirectSignIn}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Sign In (Direct)'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex space-x-4">
        <button
          onClick={handleTestQuery}
          className="px-4 py-2 bg-purple-600 text-white rounded"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Test Query Users Table'}
        </button>
        
        <button
          onClick={checkAuthStatus}
          className="px-4 py-2 bg-blue-600 text-white rounded"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Check Auth Status'}
        </button>
      </div>
      
      {result && (
        <div className="mt-8 p-4 bg-gray-100 rounded">
          <h2 className="text-xl font-semibold mb-2">Result</h2>
          <pre className="whitespace-pre-wrap bg-white p-4 rounded border overflow-auto max-h-96">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 