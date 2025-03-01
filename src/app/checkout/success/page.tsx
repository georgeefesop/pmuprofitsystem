'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePurchases } from '@/context/PurchaseContext';
import { motion } from 'framer-motion';

export default function CheckoutSuccess() {
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [resendError, setResendError] = useState('');
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const isPendingRegistration = searchParams.get('registration') === 'pending';
  const { resendVerificationEmail } = useAuth();
  const { addPurchase } = usePurchases();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [purchaseDetails, setPurchaseDetails] = useState<{
    email: string;
    productName: string;
    includesAdGenerator: boolean;
    includesBlueprint: boolean;
  } | null>(null);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2,
        duration: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  useEffect(() => {
    async function verifyPurchase() {
      if (!sessionId && !isPendingRegistration) {
        setError('No session ID found');
        setIsLoading(false);
        return;
      }

      // Skip verification if this is just a pending registration
      if (isPendingRegistration) {
        setIsLoading(false);
        return;
      }

      try {
        // Check if this is a direct payment or a checkout session
        const isPaymentIntent = sessionId?.startsWith('pi_');
        
        let response;
        if (isPaymentIntent) {
          // Verify payment intent
          response = await fetch('/api/verify-payment-intent', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ paymentIntentId: sessionId }),
          });
        } else {
          // Verify checkout session
          response = await fetch('/api/verify-session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId }),
          });
        }

        if (!response.ok) {
          throw new Error('Failed to verify purchase');
        }

        const data = await response.json();
        setEmail(data.email);
        
        // Add purchase to context
        addPurchase('pmu-profit-system', calculateTotalAmount(data), data.email);

        setPurchaseDetails({
          email: data.email,
          productName: 'PMU Profit System',
          includesAdGenerator: data.includesAdGenerator,
          includesBlueprint: data.includesBlueprint,
        });

        setIsLoading(false);
      } catch (err) {
        console.error('Error verifying purchase:', err);
        setError('Failed to verify your purchase. Please contact support.');
        setIsLoading(false);
      }
    }

    verifyPurchase();
  }, [sessionId, addPurchase, isPendingRegistration]);

  useEffect(() => {
    // Get the email from localStorage if it exists
    if (typeof window !== 'undefined') {
      const storedEmail = localStorage.getItem('pendingPurchaseEmail');
      if (storedEmail) {
        setEmail(storedEmail);
        console.log('Retrieved email from localStorage:', storedEmail);
      }
    }
  }, []);

  const handleResendVerification = async () => {
    if (!email) {
      setResendError('Email address is missing. Please contact support.');
      setResendStatus('error');
      return;
    }

    setIsResendingEmail(true);
    setResendStatus('loading');
    setResendError('');

    try {
      const result = await resendVerificationEmail(email);
      if (result.success) {
        setResendStatus('success');
      } else {
        setResendError(result.error || 'Failed to resend verification email');
        setResendStatus('error');
      }
    } catch (error) {
      console.error('Error resending verification email:', error);
      setResendError('An unexpected error occurred');
      setResendStatus('error');
    } finally {
      setIsResendingEmail(false);
    }
  };

  // Calculate the total amount based on the purchase details
  const calculateTotalAmount = (details: any) => {
    if (!details) return 37; // Base price
    
    let total = 37; // Base price for PMU Profit System
    if (details.includesAdGenerator) total += 27;
    if (details.includesBlueprint) total += 33;
    
    return total;
  };

  // Get the products purchased
  const getProductsList = () => {
    if (!purchaseDetails) return ['PMU Profit System'];
    
    const products = ['PMU Profit System'];
    if (purchaseDetails.includesAdGenerator) {
      products.push('PMU Ad Generator Tool');
    }
    if (purchaseDetails.includesBlueprint) {
      products.push('Consultation Success Blueprint');
    }
    
    return products;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 pt-20 pb-8 px-4">
      <motion.div 
        className="container-custom"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {isLoading ? (
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
            <div className="flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-6"></div>
              <p className="text-lg text-gray-600">
                {error || 'Verifying your purchase...'}
              </p>
            </div>
          </div>
        ) : (
          <motion.div 
            className="max-w-5xl mx-auto overflow-hidden"
            variants={containerVariants}
          >
            {/* Success Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <div className="p-8 md:p-12">
                {/* Success Icon */}
                <motion.div 
                  className="relative mx-auto mb-8"
                  variants={itemVariants}
                >
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="absolute -right-2 -top-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                </motion.div>
            
            {/* Test Mode Banner */}
                <motion.div 
                  className="bg-indigo-900/80 p-2 rounded-lg mb-5 flex items-center text-sm backdrop-blur-sm"
                  variants={itemVariants}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 flex-shrink-0 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
                  <span className="text-white text-xs">Test Mode - No actual payment was processed</span>
                </motion.div>

                {isPendingRegistration ? (
                  <motion.div variants={itemVariants}>
                    <h1 className="text-3xl md:text-4xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 mb-6">
                      Almost There!
                    </h1>
                    
                    <p className="text-lg text-gray-700 text-center mb-8 max-w-2xl mx-auto">
                      Your order has been successfully placed! To complete your registration and access your purchase, please verify your email address.
                    </p>
                    
                    {email && (
                      <div className="bg-white/20 p-4 rounded-xl mb-4 backdrop-blur-sm border border-indigo-100">
                        <div className="flex items-start">
                          <div className="bg-indigo-100 rounded-full p-2 mr-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-indigo-800 mb-1">Verification Email Sent</h3>
                            <p className="text-indigo-700">
                              We've sent a verification link to: <span className="font-semibold">{email}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Enhanced verification prompt */}
                    <div className="bg-gradient-to-br from-purple-700 to-indigo-800 rounded-xl p-6 mb-8 shadow-md text-white">
                      <div className="flex items-start">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 mr-4 flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white mb-2">Verify Your Email Now</h3>
                          <p className="text-white/90 mb-3">
                            <strong>Important:</strong> You need to verify your email address to unlock your purchase and access all your premium content.
                          </p>
                          <ul className="space-y-2 mb-4">
                            <li className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-white/80" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span>Check your inbox for the verification email</span>
                            </li>
                            <li className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-white/80" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span>Click the verification link in the email</span>
                            </li>
                            <li className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-white/80" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span>Return here to access your purchase</span>
                            </li>
                          </ul>
                          <p className="text-white/90 text-sm">
                            Don't see the email? Check your spam folder or click the button below to resend it.
                          </p>
                        </div>
                      </div>
            </div>

                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-6 mb-8 shadow-sm">
                      <div className="flex items-start">
                        <div className="bg-amber-100 rounded-full p-2 mr-4">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-amber-800 mb-1">Why Verification Matters</h3>
                          <p className="text-amber-700 mb-2">
                            Email verification ensures your account is secure and that you receive important updates about your purchase.
                          </p>
                          <p className="text-amber-700 text-sm">
                            <strong>Note:</strong> Without verification, you won't be able to access your purchased content or receive support.
                          </p>
                        </div>
                      </div>
                </div>

                {resendStatus === 'success' ? (
                      <div className="bg-green-50 border border-green-100 rounded-xl p-6 mb-6 shadow-sm">
                        <div className="flex items-start">
                          <div className="bg-green-100 rounded-full p-2 mr-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-green-800 mb-1">Email Resent Successfully</h3>
                            <p className="text-green-700">
                      Verification email has been resent! Please check your inbox.
                    </p>
                          </div>
                        </div>
                  </div>
                ) : resendStatus === 'error' ? (
                      <div className="bg-red-50 border border-red-100 rounded-xl p-6 mb-6 shadow-sm">
                        <div className="flex items-start">
                          <div className="bg-red-100 rounded-full p-2 mr-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-red-800 mb-1">Error</h3>
                            <p className="text-red-700">
                      {resendError}
                    </p>
                          </div>
                        </div>
                  </div>
                ) : null}

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                <button
                  onClick={handleResendVerification}
                  disabled={isResendingEmail}
                        className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium py-4 px-8 rounded-xl shadow-md transition-all duration-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed text-lg"
                      >
                        {isResendingEmail ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Sending Verification Email...
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Resend Verification Email
                          </>
                        )}
                </button>
                
                      <Link href="/" className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-8 rounded-xl shadow-md border border-gray-200 transition-all duration-200 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Return to Homepage
                      </Link>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-gray-500 mb-2">
                  If you don't receive the email within a few minutes, please check your spam folder or contact our support team.
                </p>
                      <p className="text-sm text-gray-700 font-medium">
                        Need help? Contact us at <a href="mailto:support@pmuprofitsystem.com" className="text-purple-600 hover:text-purple-800 underline">support@pmuprofitsystem.com</a>
                      </p>
              </div>
                  </motion.div>
                ) : (
                  <motion.div variants={itemVariants}>
                    <h1 className="text-3xl md:text-4xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 mb-6">
                      Thank You for Your Purchase!
                    </h1>
                    
                    <p className="text-lg text-gray-700 text-center mb-8 max-w-2xl mx-auto">
                  Your order has been successfully processed! You now have access to the PMU Profit System.
                </p>
                    
                    <div className="bg-green-50 border border-green-100 rounded-xl p-6 mb-8 shadow-sm">
                      <div className="flex items-start">
                        <div className="bg-green-100 rounded-full p-2 mr-4">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-green-800 mb-1">Success!</h3>
                          <p className="text-green-700">
                            Your purchase is complete and your account is ready. You can now access all your purchased products.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 mb-8 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Order Summary
                      </h3>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-3 border-b border-gray-200">
                          <div className="flex items-center">
                            <div className="bg-purple-100 rounded-full p-2 mr-3">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">PMU Profit System</p>
                              <p className="text-xs text-gray-500">Complete system to boost your PMU business</p>
                            </div>
                          </div>
                          <span className="font-medium text-gray-800">€37</span>
                        </div>
                        
                        {purchaseDetails?.includesAdGenerator && (
                          <div className="flex justify-between items-center py-3 border-b border-gray-200">
                            <div className="flex items-center">
                              <div className="bg-indigo-100 rounded-full p-2 mr-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">PMU Ad Generator Tool</p>
                                <p className="text-xs text-gray-500">AI-powered ad creation tool</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-800">€27</p>
                              <p className="text-xs text-gray-500 line-through">€47</p>
                </div>
              </div>
            )}

                        {purchaseDetails?.includesBlueprint && (
                          <div className="flex justify-between items-center py-3 border-b border-gray-200">
                            <div className="flex items-center">
                              <div className="bg-blue-100 rounded-full p-2 mr-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">Consultation Blueprint</p>
                                <p className="text-xs text-gray-500">Convert prospects into clients</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-800">€33</p>
                              <p className="text-xs text-gray-500 line-through">€59</p>
                            </div>
              </div>
                        )}
                        
                        <div className="flex justify-between items-center pt-3">
                          <p className="font-semibold text-gray-800">Total</p>
                          <p className="text-xl font-bold text-purple-700">€{calculateTotalAmount(purchaseDetails)}</p>
              </div>
              </div>
            </div>

                    {/* What's Next Section */}
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 mb-8 shadow-sm">
                      <h3 className="text-lg font-semibold text-indigo-800 mb-4 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        What's Next?
                      </h3>
                      
                      <ul className="space-y-4">
                        <li className="flex items-start">
                          <div className="bg-white rounded-full h-6 w-6 flex items-center justify-center text-indigo-600 font-semibold text-sm mr-3 mt-0.5 shadow-sm">
                            1
                          </div>
                          <div>
                            <p className="font-medium text-indigo-900">Verify Your Email Address</p>
                            <p className="text-sm text-indigo-700">
                              A verification email was sent to your inbox when your account was created. 
                              Please check your email and click the verification link to activate your account.
                            </p>
                            <div className="mt-2 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500 mr-1.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs text-indigo-800 font-medium">
                                Can't find the email? Check your spam folder or click "Resend Verification Email" below.
                              </span>
                            </div>
                          </div>
                        </li>
                        
                        <li className="flex items-start">
                          <div className="bg-white rounded-full h-6 w-6 flex items-center justify-center text-indigo-600 font-semibold text-sm mr-3 mt-0.5 shadow-sm">
                            2
                          </div>
                          <div>
                            <p className="font-medium text-indigo-900">Access Your Dashboard</p>
                            <p className="text-sm text-indigo-700">After verifying your email, visit your dashboard to start exploring the PMU Profit System.</p>
                          </div>
                        </li>
                        
                        <li className="flex items-start">
                          <div className="bg-white rounded-full h-6 w-6 flex items-center justify-center text-indigo-600 font-semibold text-sm mr-3 mt-0.5 shadow-sm">
                            3
                          </div>
                          <div>
                            <p className="font-medium text-indigo-900">Complete Your Profile</p>
                            <p className="text-sm text-indigo-700">Update your profile information to personalize your experience.</p>
                          </div>
                        </li>
                        
                        <li className="flex items-start">
                          <div className="bg-white rounded-full h-6 w-6 flex items-center justify-center text-indigo-600 font-semibold text-sm mr-3 mt-0.5 shadow-sm">
                            4
                          </div>
                          <div>
                            <p className="font-medium text-indigo-900">Start Learning</p>
                            <p className="text-sm text-indigo-700">Begin with Module 1 and work your way through the course materials.</p>
                          </div>
                        </li>
                      </ul>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
                      <Link 
                        href="/dashboard" 
                        className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium py-3 px-8 rounded-lg shadow-md transition-all duration-200 flex items-center justify-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                Go to Dashboard
              </Link>
                      
                      <button
                        onClick={handleResendVerification}
                        disabled={isResendingEmail}
                        className="w-full sm:w-auto bg-white hover:bg-gray-50 text-indigo-700 font-medium py-3 px-8 rounded-lg shadow-md border border-indigo-200 transition-all duration-200 flex items-center justify-center"
                      >
                        {isResendingEmail ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Sending...
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Resend Verification Email
                          </>
                        )}
                      </button>
                    </div>
                    
                    <div className="flex justify-center mb-8">
                      <Link 
                        href="/" 
                        className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-8 rounded-lg shadow-md border border-gray-200 transition-all duration-200 flex items-center justify-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                Return to Homepage
              </Link>
            </div>
            
            {/* Test Card Information */}
                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-6 shadow-sm">
                      <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Test Card Information Used
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">This information is only shown in test mode:</p>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm bg-white p-4 rounded-lg border border-gray-200">
                        <div className="text-gray-600">Card Number:</div>
                        <div className="font-mono text-gray-800">4242 4242 4242 4242</div>
                        <div className="text-gray-600">Expiry Date:</div>
                        <div className="font-mono text-gray-800">12/34</div>
                        <div className="text-gray-600">CVC:</div>
                        <div className="font-mono text-gray-800">123</div>
                        <div className="text-gray-600">ZIP:</div>
                        <div className="font-mono text-gray-800">12345</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </main>
  );
} 