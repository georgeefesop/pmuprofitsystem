/**
 * Checkout Success Page
 * 
 * This page is shown after a successful checkout. It verifies the purchase and creates entitlements.
 * 
 * Key improvements:
 * 1. Enhanced error handling and logging for better debugging
 * 2. Fixed authentication race condition by waiting for user authentication before verification
 * 3. Improved verification flow to ensure entitlements are created properly
 * 4. Better handling of verification states with clear status tracking
 * 5. Normalized product IDs to ensure consistent handling
 * 
 * The page flow:
 * 1. User is redirected here after checkout with payment_intent_id, product, and purchase_id params
 * 2. The page waits for user authentication to complete
 * 3. Once authenticated, it calls auto-create-entitlements API to ensure entitlements are created
 * 4. If successful, it shows a success message and links to access the purchased content
 * 5. If unsuccessful, it provides clear error messages and fallback options
 */

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePurchases } from '@/context/PurchaseContext';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { normalizeProductId } from '@/lib/product-ids';

// Define the PurchaseDetails type
interface PurchaseDetails {
  email: string;
  productName: string;
  includesAdGenerator: boolean;
  includesBlueprint: boolean;
}

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
  const paymentIntentId = searchParams.get('payment_intent_id');
  const productParam = searchParams.get('product');
  const purchaseId = searchParams.get('purchase_id');
  const stateToken = searchParams.get('state');
  const authUserId = searchParams.get('auth_user_id');
  const { user, resendVerificationEmail } = useAuth();
  const { addPurchase, recordSuccessfulPayment } = usePurchases();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [purchaseDetails, setPurchaseDetails] = useState<PurchaseDetails | null>(null);
  const [entitlementStatus, setEntitlementStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(false);
  const [sessionRestored, setSessionRestored] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [apiCallStatus, setApiCallStatus] = useState<'not_started' | 'in_progress' | 'success' | 'failed'>('not_started');
  const [authStatus, setAuthStatus] = useState<'not_checked' | 'checking' | 'authenticated' | 'not_authenticated'>('not_checked');
  const router = useRouter();

  // Function to force refresh entitlements
  const forceRefreshEntitlements = async (userId: string) => {
    console.log('Forcing refresh of entitlements for user:', userId);
    try {
      // Add a timestamp to prevent caching
      const timestamp = new Date().getTime();
      const refreshUrl = `/api/user-entitlements?userId=${userId}&_force_refresh=true&_t=${timestamp}`;
      
      // Make the request to refresh entitlements
      const response = await fetch(refreshUrl);
      const result = await response.json();
      
      console.log('Entitlements refreshed successfully:', result);
      return true;
    } catch (error) {
      console.error('Error refreshing entitlements:', error);
      return false;
    }
  };

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

  // Effect to set purchase details based on product parameter
  useEffect(() => {
    // If we have a specific product parameter, set the purchase details based on that
    if (productParam) {
      console.log('Setting purchase details based on product parameter:', productParam);
      
      // Default purchase details - don't include main product for addon purchases
      const details: PurchaseDetails = {
        email: user?.email || '',
        productName: '',
        includesAdGenerator: false,
        includesBlueprint: false
      };
      
      // Update based on product parameter
      if (productParam === 'pmu-ad-generator') {
        details.productName = 'PMU Ad Generator';
        details.includesAdGenerator = true;
      } else if (productParam === 'consultation-success-blueprint') {
        details.productName = 'Consultation Success Blueprint';
        details.includesBlueprint = true;
      } else if (productParam === 'pricing-template') {
        details.productName = 'Premium Pricing Template';
      } else {
        // Only set main product if not an addon
        details.productName = 'PMU Profit System';
      }
      
      setPurchaseDetails(details);
    }
  }, [productParam, user?.email]);

  // Function to get products list based on purchase details
  const getProductsList = () => {
    // If we don't have purchase details but have a product parameter, create a list based on that
    if (!purchaseDetails && productParam) {
      if (productParam === 'pmu-ad-generator') {
        return [{
          name: 'PMU Ad Generator',
          price: '€27.00',
          icon: '🚀'
        }];
      } else if (productParam === 'consultation-success-blueprint') {
        return [{
          name: 'Consultation Success Blueprint',
          price: '€33.00',
          icon: '📋'
        }];
      } else if (productParam === 'pricing-template') {
        return [{
          name: 'Premium Pricing Template',
          price: '€27.00',
          icon: '📊'
        }];
      }
    }
    
    if (!purchaseDetails) return [];
    
    // For add-on purchases, only include the specific add-on product
    if (productParam === 'pmu-ad-generator' || productParam === 'consultation-success-blueprint' || productParam === 'pricing-template') {
      if (productParam === 'pmu-ad-generator') {
        return [{
          name: 'PMU Ad Generator',
          price: '€27.00',
          icon: '🚀'
        }];
      } else if (productParam === 'consultation-success-blueprint') {
        return [{
          name: 'Consultation Success Blueprint',
          price: '€33.00',
          icon: '📋'
        }];
      } else if (productParam === 'pricing-template') {
        return [{
          name: 'Premium Pricing Template',
          price: '€27.00',
          icon: '📊'
        }];
      }
      
      return [];
    }
    
    // For main product purchase
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
    // If we don't have purchase details but have a product parameter, calculate based on that
    if (!details && productParam) {
      if (productParam === 'pmu-ad-generator') {
        return '27.00';
      } else if (productParam === 'consultation-success-blueprint') {
        return '33.00';
      } else if (productParam === 'pricing-template') {
        return '27.00';
      }
    }
    
    if (!details) return '0.00';
    
    // For add-on purchases, only include the specific add-on price
    if (productParam === 'pmu-ad-generator') {
      return '27.00';
    } else if (productParam === 'consultation-success-blueprint') {
      return '33.00';
    } else if (productParam === 'pricing-template') {
      return '27.00';
    }
    
    // For main product purchase
    let total = 37; // Base price for PMU Profit System
    
    if (details.includesAdGenerator) {
      total += 27;
    }
    
    if (details.includesBlueprint) {
      total += 33;
    }
    
    return total.toFixed(2);
  };

  // Helper function to verify purchase without authentication
  async function verifyPurchaseWithoutAuth(identifier: string, productParam?: string | null) {
    console.log('Verifying purchase without auth:', { identifier, productParam });
    try {
      let verifyUrl = '/api/verify-purchase?';
      
      // Determine if the identifier is a payment intent ID, session ID, or purchase ID
      if (identifier.startsWith('pi_')) {
        verifyUrl += `payment_intent_id=${identifier}`;
      } else if (identifier.startsWith('cs_')) {
        verifyUrl += `session_id=${identifier}`;
      } else {
        verifyUrl += `purchase_id=${identifier}`;
      }
      
      if (productParam) {
        verifyUrl += `&product=${productParam}`;
      }
      
      const verifyResponse = await fetch(verifyUrl);
        const verifyResult = await verifyResponse.json();
      
      console.log('Purchase verification result:', verifyResult);
        
        if (verifyResult.success && verifyResult.verified) {
          setEntitlementStatus({
            success: true,
            message: verifyResult.message || 'Purchase verified successfully'
          });
          
          // If the API provides a redirect URL, store it
          if (verifyResult.redirectUrl) {
            setRedirectUrl(verifyResult.redirectUrl);
          }
        
        // Set purchase details based on the product parameter if available
        if (productParam) {
          if (productParam === 'pmu-ad-generator') {
            setPurchaseDetails({
              email: verifyResult.customerEmail || user?.email || '',
              productName: 'PMU Ad Generator',
              includesAdGenerator: true,
              includesBlueprint: false
            });
          } else if (productParam === 'consultation-success-blueprint') {
            setPurchaseDetails({
              email: verifyResult.customerEmail || user?.email || '',
              productName: 'Consultation Success Blueprint',
              includesAdGenerator: false,
              includesBlueprint: true
            });
          }
          }
          
          return true;
        } else {
        console.error('Purchase verification failed:', verifyResult.error);
        setError('Failed to verify purchase. Please try again or contact support.');
        return false;
        }
      } catch (verifyError) {
        console.error('Error verifying purchase:', verifyError);
      setError('An error occurred while verifying your purchase. Please try again or contact support.');
      return false;
    }
  }

  // Helper function to restore user session
  async function restoreUserSession() {
    console.log('Attempting to restore user session');
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
        console.error('Error getting session:', error);
            return false;
          }
          
      if (session) {
        console.log('Session restored successfully');
          return true;
      } else {
        console.log('No session found');
          return false;
      }
    } catch (sessionError) {
      console.error('Error restoring session:', sessionError);
      return false;
    }
  }

  // Helper function to restore session from state token
  async function restoreSessionFromStateToken(token: string) {
    console.log('Attempting to restore session from state token');
    try {
      // This is a placeholder - implement according to your auth flow
      return await restoreUserSession();
    } catch (tokenError) {
      console.error('Error restoring session from token:', tokenError);
      return false;
    }
  }
  
  // Helper function to auto-approve purchase
  async function autoApprovePurchase(userId: string, identifier: string) {
    console.log('Auto-approving purchase:', { userId, identifier });
    try {
      const autoApproveResponse = await fetch('/api/auto-approve-purchase', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
          userId,
          identifier
              }),
            });
            
      const autoApproveResult = await autoApproveResponse.json();
            
      if (autoApproveResult.success) {
        console.log('Auto-approve successful:', autoApproveResult);
            setEntitlementStatus({
              success: true,
          message: autoApproveResult.message || 'Purchase approved and entitlements created'
              });
              return true;
                } else {
        console.error('Auto-approve failed:', autoApproveResult.error);
        return false;
      }
    } catch (autoApproveError) {
      console.error('Error in auto-approve:', autoApproveError);
      return false;
    }
  }

  // Handle dashboard click
  const handleDashboardClick = () => {
    // If this is an add-on purchase, redirect to the specific product page
    if (productParam === 'consultation-success-blueprint') {
      router.push('/dashboard/blueprint');
      return;
    } else if (productParam === 'pricing-template') {
      router.push('/dashboard/pricing-template');
      return;
    }
    
    // Otherwise, redirect to the main dashboard
    router.push('/dashboard');
  };

  // Effect to verify purchase on component mount
  useEffect(() => {
    console.log('Success page useEffect triggered with params:', {
      sessionId,
      paymentIntentId,
      productParam,
      purchaseId,
      user: user?.id ? 'User authenticated' : 'No user'
    });
    
    // Update auth status when user changes
    if (user?.id) {
      console.log('User is authenticated:', user.id);
      setAuthStatus('authenticated');
      } else {
      console.log('User is not authenticated yet');
      setAuthStatus('checking');
    }
    
    async function verifyPurchase() {
      // Don't proceed if verification is already complete
      if (verificationComplete) {
        console.log('Verification already complete, skipping');
        return;
      }
      
      console.log('Starting purchase verification process...');
      setIsLoading(true);
      
      // Wait for user authentication to complete
      if (!user?.id) {
        console.log('User not authenticated, waiting for authentication');
        return;
      }
      
      // Call our auto-create-entitlements API to ensure entitlements are created
      setApiCallStatus('in_progress');
      try {
        // Determine the correct product ID to use
        let normalizedProductId = normalizeProductId(productParam || '');
        
        console.log('Calling auto-create-entitlements API with:', {
          userId: user.id,
          productId: normalizedProductId,
          paymentIntentId,
          sessionId,
          purchaseId
        });
        
        const autoCreateResponse = await fetch('/api/auto-create-entitlements', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.id,
            productId: normalizedProductId,
            paymentIntentId: paymentIntentId || undefined,
            sessionId: sessionId || undefined,
            purchaseId: purchaseId || undefined
            }),
          });
          
        const responseText = await autoCreateResponse.text();
        console.log('Auto-create entitlements API raw response:', responseText);
        
        let autoCreateResult;
        try {
          autoCreateResult = JSON.parse(responseText);
          console.log('Auto-create entitlements API parsed response:', autoCreateResult);
        } catch (parseError) {
          console.error('Failed to parse API response:', parseError);
          setApiCallStatus('failed');
          throw new Error(`Failed to parse API response: ${responseText}`);
        }
        
        if (autoCreateResult.success) {
          console.log('Auto-create entitlements successful:', autoCreateResult);
          setApiCallStatus('success');
          
          // If we have entitlements, set the purchase details based on them
          if (autoCreateResult.entitlements && autoCreateResult.entitlements.length > 0) {
            // Find the product IDs from the entitlements
            const productIds = autoCreateResult.entitlements.map((e: { product_id: string }) => e.product_id);
            
            // Set purchase details based on the entitlements
            const includesAdGenerator = productIds.includes('4ba5c775-a8e4-449e-828f-19f938e3710b');
            const includesBlueprint = productIds.includes('e5749058-500d-4333-8938-c8a19b16cd65');
            const includesPricingTemplate = productIds.includes('f2a8c6b1-9d3e-4c7f-b5a2-1e8d7f9b6c3a');
            
              setPurchaseDetails({
                email: user.email || '',
              productName: includesBlueprint ? 'Consultation Success Blueprint' : 
                           includesAdGenerator ? 'PMU Ad Generator' : 
                           includesPricingTemplate ? 'PMU Pricing Template' : 'PMU Profit System',
              includesAdGenerator,
              includesBlueprint
            });
            
              setEntitlementStatus({
                success: true,
              message: autoCreateResult.message || 'Entitlements created successfully'
            });
            
            setVerificationComplete(true);
            setIsLoading(false);
            console.log('Verification complete with entitlements');
            
            // Force refresh entitlements to ensure they're available immediately
            if (user?.id) {
              console.log('Forcing refresh of entitlements after successful creation');
              await forceRefreshEntitlements(user.id);
            }
            
              return;
            }
        } else {
          console.error('Auto-create entitlements failed:', autoCreateResult.error);
          setApiCallStatus('failed');
          setError(`Failed to create entitlements: ${autoCreateResult.error || 'Unknown error'}`);
        }
      } catch (autoCreateError) {
        console.error('Error calling auto-create-entitlements API:', autoCreateError);
        setApiCallStatus('failed');
        setError(`Error creating entitlements: ${autoCreateError instanceof Error ? autoCreateError.message : 'Unknown error'}`);
      }
      
      // Only proceed with fallback verification if the API call failed
      if (apiCallStatus === 'failed') {
        console.log('API call failed, continuing with fallback verification flow');
        
        // Try fallback verification methods
        let fallbackSuccess = false;
        
        if (paymentIntentId) {
          console.log('Attempting to verify purchase with payment intent ID');
          fallbackSuccess = await verifyPurchaseWithoutAuth(paymentIntentId, productParam);
        }
        
        if (!fallbackSuccess && purchaseId) {
          console.log('Attempting to verify purchase with purchase ID');
          fallbackSuccess = await verifyPurchaseWithoutAuth(purchaseId, productParam);
        }
        
        if (!fallbackSuccess && productParam && (sessionId || paymentIntentId)) {
          console.log('Attempting to verify purchase with product parameter');
          const identifier = sessionId || paymentIntentId || '';
          fallbackSuccess = await verifyPurchaseWithoutAuth(identifier, productParam);
        }
        
        // Only mark verification as complete if one of the fallback methods succeeded
        if (fallbackSuccess) {
        setVerificationComplete(true);
          console.log('Fallback verification succeeded');
        } else {
          console.log('Fallback verification failed, will retry');
        }
      }
      
        setIsLoading(false);
      }
    
    // Call verifyPurchase when the component mounts or when user authentication changes
      verifyPurchase();
    
    // Set up a timer to retry if verification fails
    const timer = setInterval(() => {
      // Only retry if verification is not complete and either:
      // 1. User is authenticated but API call failed or hasn't started
      // 2. User authentication status changed
      if (!verificationComplete && 
          ((user?.id && (apiCallStatus === 'failed' || apiCallStatus === 'not_started')) || 
           (authStatus === 'authenticated' && user?.id))) {
        console.log('Verification not complete, retrying...', {
          verificationComplete,
          authStatus,
          apiCallStatus,
          userId: user?.id
        });
        verifyPurchase();
      } else if (verificationComplete) {
        console.log('Verification complete, clearing timer');
        clearInterval(timer);
      }
    }, 3000); // Check every 3 seconds
    
    return () => {
      clearInterval(timer);
    };
  }, [
    sessionId, 
    paymentIntentId, 
    productParam, 
    purchaseId, 
    user?.id, 
    verificationComplete, 
    apiCallStatus, 
    authStatus
  ]);

  // Render the product list
  const renderProductList = () => {
    const products = getProductsList();
    
    if (products.length === 0) {
      return (
        <div className="text-center text-gray-500 py-4">
          No products found
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {products.map((product, index) => (
          <div key={index} className="flex justify-between items-center">
            <div className="font-medium">
              {product.icon && <span className="mr-2">{product.icon}</span>}
              {product.name}
            </div>
            <div className="text-right">{product.price}</div>
          </div>
        ))}
        
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between items-center">
            <div className="font-medium">Total</div>
            <div className="text-xl font-bold text-indigo-600">
              €{calculateTotalAmount(purchaseDetails)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Function to render the action buttons
  const renderActionButtons = () => {
    if (error) {
      return (
        <div className="flex flex-col space-y-4 mt-6">
          <Button 
            onClick={async () => {
              // Force refresh entitlements before redirecting
              if (user?.id) {
                await forceRefreshEntitlements(user.id);
              }
              router.push('/dashboard');
            }} 
            className="w-full"
          >
            Go to Dashboard
          </Button>
          {productParam === 'consultation-success-blueprint' && user && (
            <Button 
              onClick={async () => {
                try {
                  const createEntitlementResponse = await fetch('/api/create-entitlement-direct', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      userId: user.id,
                      productId: 'consultation-success-blueprint'
                    }),
                  });
                  
                  const createEntitlementResult = await createEntitlementResponse.json();
                  
                  if (createEntitlementResult.success) {
                    toast({
                      title: "Success!",
                      description: "Blueprint entitlement created successfully. You can now access the blueprint.",
                      variant: "default",
                    });
                    setTimeout(() => {
                      router.push('/dashboard/blueprint');
                    }, 1500);
                  } else {
                    toast({
                      title: "Error",
                      description: "Failed to create entitlement. Please contact support.",
                      variant: "destructive",
                    });
                  }
                } catch (error: any) {
                  console.error('Error creating entitlement:', error);
                  toast({
                    title: "Error",
                    description: "An error occurred. Please contact support.",
                    variant: "destructive",
                  });
                }
              }} 
              className="w-full"
              variant="outline"
            >
              Create Blueprint Entitlement Manually
            </Button>
          )}
          <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
            Try Again
          </Button>
        </div>
      );
    }

    if (entitlementStatus?.success) {
      return (
        <div className="flex flex-col space-y-4 mt-6">
          {redirectUrl ? (
            <Button 
              onClick={async () => {
                // Force refresh entitlements before redirecting
                if (user?.id) {
                  await forceRefreshEntitlements(user.id);
                }
                router.push(redirectUrl);
              }} 
              className="w-full"
            >
              Go to {redirectUrl.includes('blueprint') ? 'Blueprint' : redirectUrl.includes('ad-generator') ? 'Ad Generator' : 'Dashboard'}
            </Button>
          ) : (
            <Button 
              onClick={async () => {
                // Force refresh entitlements before redirecting
                if (user?.id) {
                  await forceRefreshEntitlements(user.id);
                }
                router.push('/dashboard');
              }} 
              className="w-full"
            >
            Go to Dashboard
            </Button>
          )}
          {productParam === 'consultation-success-blueprint' && (
            <Button 
              onClick={async () => {
                // Force refresh entitlements before redirecting
                if (user?.id) {
                  await forceRefreshEntitlements(user.id);
                }
                router.push('/dashboard/blueprint');
              }} 
              variant="outline" 
              className="w-full"
            >
              Go to Blueprint
            </Button>
          )}
          {productParam === 'pmu-ad-generator' && (
            <Button 
              onClick={async () => {
                // Force refresh entitlements before redirecting
                if (user?.id) {
                  await forceRefreshEntitlements(user.id);
                }
                router.push('/dashboard/ad-generator');
              }} 
              variant="outline" 
              className="w-full"
            >
              Go to Ad Generator
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col space-y-4 mt-6">
        <Button 
          onClick={async () => {
            // Force refresh entitlements before redirecting
            if (user?.id) {
              await forceRefreshEntitlements(user.id);
            }
            router.push('/dashboard');
          }} 
          className="w-full"
        >
          Go to Dashboard
        </Button>
        {productParam === 'consultation-success-blueprint' && user && (
          <Button 
            onClick={async () => {
              try {
                const createEntitlementResponse = await fetch('/api/create-entitlement-direct', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    userId: user.id,
                    productId: 'consultation-success-blueprint'
                  }),
                });
                
                const createEntitlementResult = await createEntitlementResponse.json();
                
                if (createEntitlementResult.success) {
                  toast({
                    title: "Success!",
                    description: "Blueprint entitlement created successfully. You can now access the blueprint.",
                    variant: "default",
                  });
                  setTimeout(() => {
                    router.push('/dashboard/blueprint');
                  }, 1500);
                } else {
                  toast({
                    title: "Error",
                    description: "Failed to create entitlement. Please contact support.",
                    variant: "destructive",
                  });
                }
              } catch (error: any) {
                console.error('Error creating entitlement:', error);
                toast({
                  title: "Error",
                  description: "An error occurred. Please contact support.",
                  variant: "destructive",
                });
              }
            }} 
            className="w-full"
            variant="outline"
          >
            Create Blueprint Entitlement Manually
          </Button>
        )}
      </div>
    );
  };

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
                    
                    {renderActionButtons()}
                  </div>
                </div>
              </motion.div>
              
              {/* Order summary */}
              <motion.div 
                className="border border-gray-200 rounded-lg p-4 mb-6"
                variants={itemVariants}
              >
                <h2 className="text-lg font-medium text-gray-900 mb-3">Order Summary</h2>
                {renderProductList()}
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