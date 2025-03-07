'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePurchases } from '@/context/PurchaseContext';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

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
  const [entitlementStatus, setEntitlementStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const router = useRouter();

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

  // Function to auto-approve pending purchases and create entitlements
  async function autoApprovePurchase(userId: string, sessionId: string) {
    if (!userId || !sessionId) {
      console.log('Cannot auto-approve purchase: Missing user ID or session ID');
      return;
    }

    try {
      console.log('Auto-approving purchase for user:', userId);
      
      // First, try the auto-approve-purchase API endpoint
      const response = await fetch(`/api/auto-approve-purchase?session_id=${sessionId}&user_id=${userId}`);
      const result = await response.json();
      
      console.log('Auto-approval result:', result);
      
      if (result.success) {
        // Update the entitlement status
        setEntitlementStatus({
          success: true,
          message: result.message || 'Purchase approved and entitlements created successfully'
        });
      } else {
        console.log('Auto-approval failed:', result.message);
        
        // If the API call failed, try to create entitlements directly
        // by calling the create-entitlements API endpoint
        console.log('Trying create-entitlements API as fallback');
        
        // Determine if this is a payment intent ID or checkout session ID
        const isPaymentIntent = sessionId.startsWith('pi_');
        
        // Call the create-entitlements API with the appropriate parameters
        const createResponse = await fetch(`/api/create-entitlements?session_id=${sessionId}&user_id=${userId}`);
        const createResult = await createResponse.json();
        
        console.log('Create entitlements result:', createResult);
        
        if (createResult.success) {
          setEntitlementStatus({
            success: true,
            message: 'Entitlements created successfully using fallback method'
          });
        } else {
          // If both methods failed, try one more approach - verify the purchase
          console.log('Create entitlements failed, trying verify-purchase API');
          
          const verifyResponse = await fetch(`/api/verify-purchase?session_id=${sessionId}`);
          const verifyResult = await verifyResponse.json();
          
          console.log('Verify purchase result:', verifyResult);
          
          if (verifyResult.success && verifyResult.verified) {
            setEntitlementStatus({
              success: true,
              message: 'Purchase verified successfully, please check your dashboard'
            });
          } else {
            setEntitlementStatus({
              success: false,
              message: 'Failed to create entitlements. Please contact support.'
            });
          }
        }
      }
    } catch (error) {
      console.error('Error auto-approving purchase:', error);
      
      try {
        // If there was an error, try the create-entitlements API as a last resort
        console.log('Error in auto-approval, trying create-entitlements API');
        const createResponse = await fetch(`/api/create-entitlements?session_id=${sessionId}&user_id=${userId}`);
        const createResult = await createResponse.json();
        
        console.log('Create entitlements result after error:', createResult);
        
        if (createResult.success) {
          setEntitlementStatus({
            success: true,
            message: 'Entitlements created successfully after error recovery'
          });
        } else {
          setEntitlementStatus({
            success: false,
            message: 'Failed to create entitlements. Please contact support.'
          });
        }
      } catch (fallbackError) {
        console.error('Error in fallback entitlement creation:', fallbackError);
        setEntitlementStatus({
          success: false,
          message: 'Failed to create entitlements. Please contact support.'
        });
      }
    }
  }

  // Function to verify purchase
  async function verifyPurchase() {
    // Prevent duplicate calls
    if (verificationComplete) return;
    
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
        
        // Determine which products were purchased based on the API response
        // Use the explicit values from the API response if available
        const includesAdGenerator = data.includeAdGenerator === true;
        const includesBlueprint = data.includeBlueprint === true;
        
        console.log('Purchase details:', {
          userId: data.userId,
          includesAdGenerator,
          includesBlueprint,
          amount: data.sessionDetails.amount_total
        });
        
        setPurchaseDetails({
          email: data.sessionDetails.customer_email || '',
          productName: 'PMU Profit System',
          includesAdGenerator,
          includesBlueprint
        });
        
        // Store the purchase in context if user is logged in
        try {
          // Always add the main product
          console.log('Adding PMU Profit System to purchases');
          await addPurchase('pmu-profit-system', 3700); // $37.00 in cents
          
          // Only add the add-ons if they were purchased
          if (includesAdGenerator) {
            console.log('Adding Ad Generator to purchases');
            await addPurchase('pmu-ad-generator', 2700); // $27.00 in cents
          }
          
          if (includesBlueprint) {
            console.log('Adding Blueprint to purchases');
            await addPurchase('consultation-success-blueprint', 3300); // $33.00 in cents
          }
        } catch (purchaseError) {
          console.error('Error adding purchase to context:', purchaseError);
          // Continue anyway - this is not critical
        }
        
        // If we have a redirect URL, store it for later use
        if (data.redirectUrl) {
          localStorage.setItem('dashboardRedirectUrl', data.redirectUrl);
        }

        // Auto-approve the purchase and create entitlements immediately
        if (data.userId && sessionId) {
          await autoApprovePurchase(data.userId, sessionId);
        } else {
          // Try to get the user ID from localStorage as a backup
          const backupUserId = localStorage.getItem('checkout_user_id');
          
          if (backupUserId && sessionId) {
            console.log('Using backup user ID from localStorage:', backupUserId);
            await autoApprovePurchase(backupUserId, sessionId);
            
            // Clear the backup user ID after use
            localStorage.removeItem('checkout_user_id');
          } else {
            console.error('No user ID found in verification response or localStorage. Full response:', {
              ...data,
              sessionDetails: {
                ...data.sessionDetails,
                // Exclude any sensitive data
                payment_intent: data.sessionDetails.payment_intent ? '[REDACTED]' : null
              }
            });
            
            setEntitlementStatus({
              success: false,
              message: 'User ID not found. Please contact support if your purchase is not showing up.'
            });
          }
        }
      } else {
        throw new Error('Purchase verification failed');
      }
    } catch (error) {
      console.error('Error verifying purchase:', error);
      setError(error instanceof Error ? error.message : 'Failed to verify purchase');
    } finally {
      setIsLoading(false);
      setVerificationComplete(true);
    }
  }

  // Function to handle dashboard navigation
  const handleDashboardClick = () => {
    const storedRedirectUrl = localStorage.getItem('dashboardRedirectUrl');
    const dashboardUrl = `/dashboard?purchase_success=true&session_id=${sessionId}`;
    
    if (storedRedirectUrl && storedRedirectUrl.startsWith('/dashboard')) {
      // If there's a stored redirect URL and it's for the dashboard,
      // append the purchase_success and session_id parameters if they're not already there
      const url = new URL(storedRedirectUrl, window.location.origin);
      if (!url.searchParams.has('purchase_success')) {
        url.searchParams.set('purchase_success', 'true');
      }
      if (!url.searchParams.has('session_id') && sessionId) {
        url.searchParams.set('session_id', sessionId);
      }
      localStorage.removeItem('dashboardRedirectUrl');
      router.push(url.pathname + url.search);
    } else {
      // If there's no stored redirect URL or it's not for the dashboard,
      // use the default dashboard URL with the parameters
      localStorage.removeItem('dashboardRedirectUrl');
      router.push(dashboardUrl);
    }
  };

  // Effect to verify purchase on component mount
  useEffect(() => {
    if (sessionId && !verificationComplete) {
      console.log('Verifying purchase on component mount');
      verifyPurchase();
    } else if (!sessionId) {
      setIsLoading(false);
      setError('No session ID provided');
      setVerificationComplete(true);
    }
  }, [sessionId]);

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
          className="max-w-2xl w-full"
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
            <div className="p-8">
              <motion.div 
                className="flex justify-center"
                variants={itemVariants}
              >
                <div className="rounded-full bg-green-100 p-3">
                  <svg className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </motion.div>
              
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
                Your order has been successfully processed.
              </motion.p>
              
              {/* Account Information */}
              <motion.div 
                className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mt-8 mb-6 border border-indigo-100"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">Your Account is Ready</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      You can now access your purchase immediately. Your account has been created and you're already logged in.
                    </p>
                    
                    {/* Entitlement status message */}
                    {entitlementStatus && !entitlementStatus.success && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-100 rounded text-sm text-yellow-700">
                        Note: We're still processing your purchase. If you don't see your items in your dashboard, 
                        please wait a few minutes and refresh the page.
                      </div>
                    )}
                    
                    <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                      <motion.button
                        variants={itemVariants}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-300 flex items-center justify-center"
                        onClick={handleDashboardClick}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                        </svg>
                        Go to Dashboard
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* Order summary */}
              <motion.div 
                className="border border-gray-200 rounded-lg p-4 mb-6"
                variants={itemVariants}
              >
                <h2 className="text-lg font-medium text-gray-900 mb-3">Order Summary</h2>
                <div className="space-y-3">
                  {getProductsList().map((product, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="text-xl mr-2">{product.icon}</span>
                        <span className="text-gray-800">{product.name}</span>
                      </div>
                      <span className="text-gray-600 font-medium">{product.price}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-3 mt-3 flex justify-between items-center">
                    <span className="font-medium text-gray-900">Total</span>
                    <span className="font-bold text-indigo-600">€{calculateTotalAmount(purchaseDetails)}</span>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                className="mt-8"
                variants={itemVariants}
              >
                <h2 className="text-lg font-medium text-gray-900 mb-4">What's Next?</h2>
                
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">Access Your Content</h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <p>
                            Your purchase includes immediate access to all course materials. Visit your dashboard to start learning.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-purple-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-purple-800">Get Support</h3>
                        <div className="mt-2 text-sm text-purple-700">
                          <p>
                            If you have any questions or need assistance, please contact our support team at <a href="mailto:support@pmuprofitsystem.com" className="font-medium underline">support@pmuprofitsystem.com</a>.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
              
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