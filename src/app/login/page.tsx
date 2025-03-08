'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePurchases } from '@/context/PurchaseContext';
import { motion } from 'framer-motion';
import { ConnectionStatus } from '@/components/ui/connection-status';
// Import commented out to reduce console noise
// import { AuthDebug } from '@/components/AuthDebug';

// Loading fallback component
function LoginFormSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-gray-200 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-8"></div>
        </div>
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main login component that uses useSearchParams
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState<{ success?: boolean; message?: string; previewUrl?: string } | null>(null);
  const [isResending, setIsResending] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';
  const justRegistered = searchParams.get('registered') === 'true';
  const urlError = searchParams.get('error');
  const { login, resendVerificationEmail } = useAuth();
  const { claimPendingPurchases } = usePurchases();
  const [hasPendingPurchases, setHasPendingPurchases] = useState(false);
  const [connectionError, setConnectionError] = useState<boolean>(false);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  // Set error from URL if present
  useEffect(() => {
    if (urlError) {
      setError(decodeURIComponent(urlError));
    }
    
    // Check if there are pending purchases
    if (typeof window !== 'undefined') {
      const pendingPurchasesJson = localStorage.getItem('pendingPurchases');
      if (pendingPurchasesJson) {
        try {
          const pendingPurchases = JSON.parse(pendingPurchasesJson);
          if (pendingPurchases.length > 0) {
            setHasPendingPurchases(true);
          }
        } catch (error) {
          console.error('Error parsing pending purchases:', error);
        }
      }
      
      // Check if there's a pending purchase email to pre-fill the resend form
      const pendingEmail = localStorage.getItem('pendingPurchaseEmail');
      if (pendingEmail) {
        setResendEmail(pendingEmail);
      }
    }
  }, [urlError]);

  useEffect(() => {
    // Get the redirect URL from the query parameters
    const params = new URLSearchParams(window.location.search);
    const redirectTo = params.get('redirect');
    
    if (redirectTo) {
      console.log('Storing redirect URL:', redirectTo);
      localStorage.setItem('redirectTo', redirectTo);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setConnectionError(false);

    try {
      const { success, error, user } = await login(email, password);
      if (success) {
        // Store the user ID in localStorage for middleware
        localStorage.setItem('auth_user_id', user?.id || '');
        
        // Set the auth-status cookie with a long expiration
        document.cookie = `auth-status=authenticated; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
        
        // If there's a redirect URL in the query params, go there
        const redirectUrl = searchParams.get('redirect') || '/dashboard';
        console.log('Redirecting to:', redirectUrl);
        
        // Store the redirect URL in localStorage to ensure it's available after navigation
        localStorage.setItem('loginRedirectUrl', redirectUrl);
        
        // Add a longer delay to ensure cookies are set before redirecting
        setTimeout(() => {
          // Force a hard navigation to ensure cookies are properly set
          window.location.href = redirectUrl;
        }, 500);
      } else {
        // Check if the error is related to connection issues
        if (error && (
          error.includes('connect to authentication service') || 
          error.includes('network connection') ||
          error.includes('ERR_NAME_NOT_RESOLVED') ||
          error.includes('timed out')
        )) {
          setConnectionError(true);
        }
        
        setError(error || 'Invalid login credentials');
      }
    } catch (err) {
      setError('An error occurred during login');
      console.error(err);
      
      // Check if the error is related to connection issues
      if (err instanceof Error && (
        err.message.includes('connect to authentication service') || 
        err.message.includes('network connection') ||
        err.message.includes('ERR_NAME_NOT_RESOLVED') ||
        err.message.includes('timed out')
      )) {
        setConnectionError(true);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendStatus(null);
    setIsResending(true);
    
    try {
      if (!resendEmail || !resendEmail.includes('@')) {
        setResendStatus({ success: false, message: 'Please enter a valid email address' });
        setIsResending(false);
        return;
      }
      
      console.log('Attempting to resend verification email to:', resendEmail);
      
      // First check the verification status
      try {
        const statusResponse = await fetch('/api/check-verification-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: resendEmail }),
        });
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          console.log('Verification status response:', statusData);
          
          if (statusData.exists && statusData.verified) {
            // If the email is already verified, check if there might be account issues
            try {
              const detailsResponse = await fetch('/api/check-user-details', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: resendEmail }),
              });
              
              if (detailsResponse.ok) {
                const detailsData = await detailsResponse.json();
                
                if (detailsData.exists && detailsData.user.isBanned) {
                  // If the account is banned, try to fix it
                  const unbanResponse = await fetch('/api/unban-user', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email: resendEmail }),
                  });
                  
                  if (unbanResponse.ok) {
                    const unbanData = await unbanResponse.json();
                    
                    if (unbanData.resetToken) {
                      setResendStatus({ 
                        success: true, 
                        message: `Your account has been fixed. Please check your email for a password reset link or use this link: ${unbanData.resetToken}` 
                      });
                    } else {
                      setResendStatus({ 
                        success: true, 
                        message: `Your account has been fixed. You can now log in with your credentials.` 
                      });
                    }
                    setIsResending(false);
                    return;
                  }
                } else if (detailsData.exists && !detailsData.user.hasPassword) {
                  // If the user doesn't have a password, generate a reset link
                  const resetResponse = await fetch('/api/unban-user', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email: resendEmail }),
                  });
                  
                  if (resetResponse.ok) {
                    const resetData = await resetResponse.json();
                    
                    if (resetData.resetToken) {
                      setResendStatus({ 
                        success: true, 
                        message: `Your email is already verified, but you need to set a password. Please use this link: ${resetData.resetToken}` 
                      });
                    } else {
                      setResendStatus({ 
                        success: true, 
                        message: `Your email is already verified. Please try logging in or use the "Forgot Password" link.` 
                      });
                    }
                    setIsResending(false);
                    return;
                  }
                }
              }
            } catch (detailsError) {
              console.error('Error checking user details:', detailsError);
            }
            
            // Default message if we couldn't check for account issues
            setResendStatus({ 
              success: true, 
              message: `Your email ${resendEmail} is already verified. You can log in with your credentials.` 
            });
            setIsResending(false);
            return;
          }
        }
      } catch (statusError) {
        console.error('Error checking verification status:', statusError);
        // Continue with resend attempt even if status check fails
      }
      
      // Proceed with resending the verification email
      console.log('Calling resendVerificationEmail function');
      const { success, error, previewUrl } = await resendVerificationEmail(resendEmail);
      console.log('Resend result:', success ? 'Success' : 'Failed', error);
      
      if (success) {
        setResendStatus({ 
          success: true, 
          message: `Verification email sent to ${resendEmail}. Please check your inbox and spam folder.${previewUrl ? ' You can also view the test email using the link below.' : ''}`,
          previewUrl
        });
      } else {
        setResendStatus({ 
          success: false, 
          message: error || 'Failed to send verification email. Please try again.' 
        });
      }
    } catch (err) {
      console.error('Exception during resend verification:', err);
      setResendStatus({ 
        success: false, 
        message: 'An unexpected error occurred. Please try again.' 
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">PMU Profit System</h2>
          <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
        </div>

        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Show connection status component if there's a connection error */}
          {connectionError && (
            <div className="mb-4 rounded-md bg-yellow-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Connection issue detected. Please check your internet connection and try again.
                    <ConnectionStatus />
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Show error message if there's an error */}
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Show success message if just registered */}
          {justRegistered && !error && (
            <div className="mb-4 rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">Registration successful! You can now log in with your credentials.</p>
                </div>
              </div>
            </div>
          )}

          {/* Login form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Need access? Purchase the PMU Profit System to create an account.{' '}
                <Link href="/" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Learn more
                </Link>
              </p>
            </div>
          </div>

          {/* Add AuthDebug component */}
          <div className="mt-8">
            {/* AuthDebug component is commented out */}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Export the page component with Suspense
export default function Login() {
  return (
    <Suspense fallback={<LoginFormSkeleton />}>
      <LoginForm />
    </Suspense>
  );
} 