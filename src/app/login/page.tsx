'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePurchases } from '@/context/PurchaseContext';

export default function Login() {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { success, error } = await login(email, password);
      if (success) {
        // If there are pending purchases, claim them
        if (hasPendingPurchases) {
          await claimPendingPurchases();
        }
        
        // Redirect to the original intended destination or dashboard
        router.push(redirectPath);
      } else {
        setError(error || 'Invalid login credentials');
      }
    } catch (err) {
      setError('An error occurred during login');
      console.error(err);
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
    <main className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
      <div className="container-custom">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="heading-lg mb-2">Welcome Back</h1>
              <p className="text-gray-600">Log in to access your PMU Profit System</p>
            </div>
            
            {justRegistered && (
              <div className="bg-green-50 text-green-700 p-4 rounded-md mb-6">
                <p className="font-medium">Account created successfully!</p>
                <p className="mt-1">Please check your email for a verification link. After verifying your email, log in to complete your purchase.</p>
              </div>
            )}
            
            {hasPendingPurchases && (
              <div className="bg-blue-50 text-blue-700 p-4 rounded-md mb-6">
                <p className="font-medium">You have pending purchases!</p>
                <p className="mt-1">Log in to claim your purchases and access your content.</p>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
                {error}
              </div>
            )}
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  placeholder="your@email.com"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter your password"
                  required
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
                
                <div className="text-sm">
                  <Link href="/forgot-password" className="text-purple-600 hover:text-purple-500">
                    Forgot your password?
                  </Link>
                </div>
              </div>
              
              <div>
                <button
                  type="submit"
                  className="w-full btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Logging in...' : 'Log In'}
                </button>
              </div>
            </form>
            
            {/* Resend Verification Email Section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Didn't receive verification email?</h3>
              
              {resendStatus && (
                <div className={`p-4 rounded-md mb-4 ${resendStatus.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {resendStatus.message}
                  
                  {resendStatus.previewUrl && (
                    <div className="mt-2">
                      <a 
                        href={resendStatus.previewUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        View Test Email
                      </a>
                      <p className="text-sm mt-1 text-gray-600">
                        (This is a test email service. In production, real emails would be sent to your inbox.)
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              <form className="space-y-4" onSubmit={handleResendVerification}>
                <div>
                  <label htmlFor="resend-email" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Email Address
                  </label>
                  <input
                    type="email"
                    id="resend-email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  disabled={isResending}
                >
                  {isResending ? 'Sending...' : 'Resend Verification Email'}
                </button>
              </form>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link href="/checkout" className="text-purple-600 hover:text-purple-500 font-medium">
                  Purchase the course
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 