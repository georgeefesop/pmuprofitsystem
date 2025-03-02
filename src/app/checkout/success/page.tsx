'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePurchases } from '@/context/PurchaseContext';
import { motion } from 'framer-motion';

// Loading fallback component
function SuccessPageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      <div className="animate-pulse w-full max-w-md">
        <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-8"></div>
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto mb-6"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-8"></div>
            <div className="space-y-4">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main success page component that uses useSearchParams
function SuccessPageContent() {
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

  // Function to handle resending verification email
  const handleResendVerificationEmail = async () => {
    if (isResendingEmail || !email) return;
    
    setIsResendingEmail(true);
    setResendStatus('loading');
    
    try {
      const result = await resendVerificationEmail(email);
      if (result.success) {
        setResendStatus('success');
      } else {
        setResendStatus('error');
        setResendError(result.error || 'Failed to resend verification email');
      }
    } catch (error) {
      setResendStatus('error');
      setResendError('An unexpected error occurred');
      console.error('Error resending verification email:', error);
    } finally {
      setIsResendingEmail(false);
    }
  };

  // Function to get products list based on purchase details
  const getProductsList = () => {
    if (!purchaseDetails) return [];
    
    const products = [
      {
        name: 'PMU Profit System',
        price: '€37.00',
        icon: '📚'
      }
    ];
    
    if (purchaseDetails.includesAdGenerator) {
      products.push({
        name: 'PMU Ad Generator',
        price: '€27.00',
        icon: '🚀'
      });
    }
    
    if (purchaseDetails.includesBlueprint) {
      products.push({
        name: 'Consultation Success Blueprint',
        price: '€33.00',
        icon: '📋'
      });
    }
    
    return products;
  };

  // Function to calculate total amount
  const calculateTotalAmount = (details: typeof purchaseDetails) => {
    if (!details) return '0.00';
    
    let total = 37; // Base price
    
    if (details.includesAdGenerator) {
      total += 27;
    }
    
    if (details.includesBlueprint) {
      total += 33;
    }
    
    return total.toFixed(2);
  };

  // Function to verify purchase
  async function verifyPurchase() {
    try {
      console.log('Verifying purchase with session ID:', sessionId);
      const response = await fetch(`/api/verify-purchase?session_id=${sessionId}`);
      
      if (!response.ok) {
        throw new Error(`Error verifying purchase: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Verification response:', data);
      
      if (data.success) {
        // Set email from session details
        setEmail(data.sessionDetails.customer_email || '');
        
        // Determine which products were purchased based on the amount
        const totalAmount = data.sessionDetails.amount_total || 0;
        
        // Basic logic to determine what was purchased based on price
        // This is a simplified approach - ideally we would have line items
        const includesAdGenerator = totalAmount >= 64; // Base + Ad Generator
        const includesBlueprint = totalAmount >= 70; // Base + Blueprint
        
        setPurchaseDetails({
          email: data.sessionDetails.customer_email || '',
          productName: 'PMU Profit System',
          includesAdGenerator,
          includesBlueprint
        });
        
        // Store the purchase in context if user is logged in
        try {
          await addPurchase('pmu-profit-system', 3700); // $37.00 in cents
          
          if (includesAdGenerator) {
            await addPurchase('pmu-ad-generator', 2700); // $27.00 in cents
          }
          
          if (includesBlueprint) {
            await addPurchase('consultation-success-blueprint', 3300); // $33.00 in cents
          }
        } catch (purchaseError) {
          console.error('Error adding purchase to context:', purchaseError);
          // Continue anyway - this is not critical
        }
      } else {
        throw new Error('Purchase verification failed');
      }
    } catch (error) {
      console.error('Error verifying purchase:', error);
      setError(error instanceof Error ? error.message : 'Failed to verify purchase');
    } finally {
      setIsLoading(false);
    }
  }

  // Effect to verify purchase on component mount
  useEffect(() => {
    if (sessionId) {
      verifyPurchase();
    } else {
      setIsLoading(false);
      setError('No session ID provided');
    }
    
    // If we have a pending registration, try to get the email from localStorage
    if (isPendingRegistration) {
      const storedEmail = localStorage.getItem('pendingPurchaseEmail');
      if (storedEmail) {
        setEmail(storedEmail);
      }
    }
  }, [sessionId, isPendingRegistration]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Order Confirmation</h1>
        <p className="mt-2 text-lg text-gray-600">Thank you for your purchase!</p>
      </div>
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-t-4 border-b-4 border-indigo-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-lg text-gray-700">Verifying your purchase...</p>
        </div>
      ) : error ? (
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="flex justify-center">
              <div className="rounded-full bg-red-100 p-3">
                <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <h1 className="mt-5 text-center text-2xl font-bold text-gray-900">Error</h1>
            <p className="mt-2 text-center text-gray-600">{error}</p>
            <div className="mt-6">
              <Link href="/checkout" className="block w-full text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Return to Checkout
              </Link>
            </div>
          </div>
        </div>
      ) :
        <motion.div
          className="max-w-md w-full"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Test mode banner */}
          <motion.div 
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-3 rounded-lg mb-4 shadow-md"
            variants={itemVariants}
          >
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium">Test Mode - No payment has been processed</p>
            </div>
          </motion.div>
          
          {/* Success card */}
          <motion.div 
            className="bg-white rounded-xl shadow-lg overflow-hidden"
            variants={itemVariants}
          >
            {/* Decorative wave */}
            <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
            
            <div className="p-8">
              {/* Success icon */}
              <motion.div 
                className="flex justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
              >
                <div className="relative">
                  <div className="rounded-full bg-green-100 p-3">
                    <svg className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <motion.div 
                    className="absolute -top-1 -right-1"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1 }}
                  >
                    <svg className="h-6 w-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </motion.div>
                </div>
              </motion.div>
              
              {/* Success message */}
              <motion.h1 
                className="mt-5 text-center text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent"
                variants={itemVariants}
              >
                Thank You for Your Purchase!
              </motion.h1>
              
              <motion.p 
                className="mt-2 text-center text-gray-600"
                variants={itemVariants}
              >
                {isPendingRegistration ? 
                  `Please check ${email} for a verification email to complete your registration.` : 
                  'Your order has been successfully processed.'}
              </motion.p>
              
              {/* Order summary */}
              <motion.div 
                className="mt-8 border border-gray-200 rounded-lg p-4 bg-gray-50"
                variants={itemVariants}
              >
                <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
                
                <div className="space-y-3">
                  {getProductsList().map((product, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-xl mr-2">{product.icon}</span>
                        <span className="text-gray-800">{product.name}</span>
                      </div>
                      <span className="font-medium">{product.price}</span>
                    </div>
                  ))}
                  
                  <div className="pt-3 mt-3 border-t border-gray-200 flex items-center justify-between">
                    <span className="font-medium text-gray-900">Total</span>
                    <span className="font-bold text-lg text-indigo-600">€{calculateTotalAmount(purchaseDetails)}</span>
                  </div>
                </div>
              </motion.div>
              
              {/* What's next section */}
              <motion.div 
                className="mt-8"
                variants={itemVariants}
              >
                <h2 className="text-lg font-medium text-gray-900 mb-4">What's Next?</h2>
                
                <div className="space-y-4">
                  {isPendingRegistration && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                      <div className="flex">
                        <svg className="h-5 w-5 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-sm text-blue-800 font-medium">1. Verify your email address</p>
                          <p className="text-xs text-blue-600 mt-1">
                            We've sent a verification email to <span className="font-medium">{email}</span>. 
                            Click the link in the email to verify your account.
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            <strong>Can't find the email?</strong> Check your spam folder or click the button below to resend.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                    <div className="flex">
                      <svg className="h-5 w-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <div>
                        <p className="text-sm text-green-800 font-medium">
                          {isPendingRegistration ? '2. Access your course' : '1. Access your course'}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          {isPendingRegistration 
                            ? 'After verifying your email, you can log in to access your course materials.' 
                            : 'Your purchase has been processed. You can now access your course materials.'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                    <div className="flex">
                      <svg className="h-5 w-5 text-purple-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="text-sm text-purple-800 font-medium">
                          {isPendingRegistration ? '3. Start learning' : '2. Start learning'}
                        </p>
                        <p className="text-xs text-purple-600 mt-1">
                          Begin your journey to PMU business success with our comprehensive course materials.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* Action buttons */}
              <motion.div 
                className="mt-8 space-y-3"
                variants={itemVariants}
              >
                {isPendingRegistration && (
                  <button
                    onClick={handleResendVerificationEmail}
                    disabled={isResendingEmail}
                    className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isResendingEmail ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : 'Resend Verification Email'}
                  </button>
                )}
                
                <Link href={isPendingRegistration ? "/login" : "/dashboard"} className="w-full block text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  {isPendingRegistration ? 'Go to Login' : 'Go to Dashboard'}
                </Link>
              </motion.div>
              
              {resendStatus === 'success' && (
                <motion.div 
                  className="mt-4 p-3 bg-green-50 text-green-800 rounded-md"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="text-sm">Verification email sent successfully! Please check your inbox and spam folder.</p>
                </motion.div>
              )}
              
              {resendStatus === 'error' && (
                <motion.div 
                  className="mt-4 p-3 bg-red-50 text-red-800 rounded-md"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="text-sm">{resendError || 'Failed to send verification email. Please try again.'}</p>
                </motion.div>
              )}
              
              {/* Test card info */}
              <motion.div 
                className="mt-8 text-center text-xs text-gray-500"
                variants={itemVariants}
              >
                <p>This is a test purchase. No actual payment has been processed.</p>
                <p className="mt-1">For support, contact <a href="mailto:support@pmuprofitsystem.com" className="text-indigo-600 hover:text-indigo-500">support@pmuprofitsystem.com</a></p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      }
    </div>
  );
}

// Export the page component with Suspense
export default function CheckoutSuccess() {
  return (
    <Suspense fallback={<SuccessPageSkeleton />}>
      <SuccessPageContent />
    </Suspense>
  );
} 