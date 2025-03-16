'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { usePurchases, ProductId } from '@/context/PurchaseContext';
import { useEnhancedUser } from '@/hooks/useEnhancedUser';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle } from 'lucide-react';

// Function to get the display name for a product
function getProductDisplayName(productId: string): string {
  switch (productId) {
    case 'pmu-profit-system':
      return 'PMU Profit System';
    case 'consultation-success-blueprint':
      return 'Consultation Success Blueprint';
    case 'pricing-template':
      return 'Pricing Template';
    case 'pmu-ad-generator':
      return 'PMU Ad Generator';
    default:
      return productId;
  }
}

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { recordSuccessfulPayment } = usePurchases();
  const { user, isLoading: userLoading, refreshUser } = useEnhancedUser();
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    error?: string;
    redirectUrl?: string;
    message?: string;
    productName?: string;
  } | null>(null);
  
  // Add a state to track if we've attempted verification
  const [hasAttemptedVerification, setHasAttemptedVerification] = useState(false);
  // Add a state to track if we've attempted to restore the session
  const [hasAttemptedSessionRestore, setHasAttemptedSessionRestore] = useState(false);
  // Add a state to track if we're restoring the session
  const [isRestoringSession, setIsRestoringSession] = useState(false);
  
  // This effect runs when the component mounts to log the params
  useEffect(() => {
    console.log('Success page mounted with params:', {
      sessionId: searchParams.get('session_id'),
      productParam: searchParams.get('product'),
      purchaseId: searchParams.get('purchase_id'),
      user: user?.email
    });
  }, [searchParams, user]);

  // This effect checks if we need to restore the session
  useEffect(() => {
    // Skip if we've already attempted to restore the session
    if (hasAttemptedSessionRestore) {
      return;
    }

    // Skip if the user is still loading
    if (userLoading) {
      return;
    }

    // Check if we have a valid session but missing tokens
    const checkSessionStatus = async () => {
      // Get the auth-status cookie
      const authStatus = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-status='))
        ?.split('=')[1];
      
      // Get the sb-access-token cookie
      const accessToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('sb-access-token='))
        ?.split('=')[1];
      
      // Get the sb-refresh-token cookie
      const refreshToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('sb-refresh-token='))
        ?.split('=')[1];
      
      // Get the user-id cookie
      const userIdCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('user-id='))
        ?.split('=')[1];
      
      console.log('Session status check:', {
        authStatus,
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        userIdCookie,
        userFromContext: user?.id
      });
      
      // If we have an auth-status cookie but no tokens, we need to restore the session
      if (authStatus === 'authenticated' && (!accessToken || !refreshToken)) {
        console.log('Auth status is authenticated but tokens are missing, attempting to restore session');
        
        // If we have a user ID from context or cookie, use it to restore the session
        const userId = user?.id || userIdCookie;
        
        if (userId) {
          setIsRestoringSession(true);
          
          try {
            // Call the restore-session API
            const response = await fetch('/api/auth/restore-session', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ userId })
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              console.error('Error restoring session:', errorData);
            } else {
              const result = await response.json();
              console.log('Session restore result:', result);
              
              // Refresh the user data
              await refreshUser();
            }
          } catch (error) {
            console.error('Error restoring session:', error);
          } finally {
            setIsRestoringSession(false);
            setHasAttemptedSessionRestore(true);
          }
        } else {
          console.log('No user ID available to restore session');
          setHasAttemptedSessionRestore(true);
        }
      } else {
        // No need to restore the session
        setHasAttemptedSessionRestore(true);
      }
    };
    
    checkSessionStatus();
  }, [user, userLoading, hasAttemptedSessionRestore, refreshUser]);

  useEffect(() => {
    // Skip if we've already attempted verification
    if (hasAttemptedVerification) {
      return;
    }
    
    // Skip if we're still restoring the session
    if (isRestoringSession) {
      return;
    }
    
    // Skip if we haven't attempted to restore the session yet
    if (!hasAttemptedSessionRestore) {
      return;
    }
    
    // Get the parameters from the URL
    const productParam = searchParams.get('product');
    const sessionId = searchParams.get('session_id');
    const paymentIntent = searchParams.get('payment_intent');
    const paymentIntentId = searchParams.get('payment_intent_id');
    const purchaseId = searchParams.get('purchase_id');
    const paymentId = paymentIntent || paymentIntentId || sessionId;
    
    // If we don't have a product ID or payment ID, show an error
    if (!productParam || (!paymentId && !purchaseId)) {
      console.error('Missing required parameters:', { productParam, paymentId, purchaseId });
      setVerificationResult({
        success: false,
        error: 'Missing required parameters'
      });
      setIsVerifying(false);
      setHasAttemptedVerification(true);
      return;
    }
    
    // Function to verify the purchase
    const verifyPurchase = async (purchaseId: string) => {
      console.log('Verifying purchase with ID:', purchaseId);
      try {
        const response = await fetch(`/api/verify-purchase?purchaseId=${purchaseId}`, {
          method: 'GET',
        });

        if (!response.ok) {
          console.error('Failed to verify purchase:', response.statusText);
          return {
            success: false,
            message: 'Failed to verify purchase',
            redirectUrl: '/dashboard',
          };
        }

        const result = await response.json();
        console.log('Purchase verification result:', result);

        if (result.success) {
          // Try to create entitlements directly
          try {
            console.log('Creating entitlements for payment ID:', result.paymentIntentId);
            if (result.paymentIntentId) {
              const paymentId = result.paymentIntentId;
              const entitlementsUrl = `/api/create-entitlements?paymentIntentId=${paymentId}`;
              
              const entitlementsResponse = await fetch(entitlementsUrl, {
                method: 'GET',
              });
              
              const entitlementsResult = await entitlementsResponse.json();
              console.log('Entitlements creation result:', entitlementsResult);
              
              // Update purchase status to completed
              try {
                const updateStatusResponse = await fetch('/api/purchases/update-status', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    paymentIntentId: paymentId,
                    status: 'completed'
                  }),
                });
                
                const updateStatusResult = await updateStatusResponse.json();
                console.log('Purchase status update result:', updateStatusResult);
              } catch (error) {
                console.error('Error updating purchase status:', error);
              }
            }
          } catch (error) {
            console.error('Error creating entitlements:', error);
          }

          return {
            success: true,
            message: 'Purchase verified successfully',
            redirectUrl: '/dashboard',
            productName: result.productName,
          };
        } else {
          return {
            success: false,
            message: result.message || 'Failed to verify purchase',
            redirectUrl: '/dashboard',
          };
        }
      } catch (error) {
        console.error('Error verifying purchase:', error);
        return {
          success: false,
          message: 'Error verifying purchase',
          redirectUrl: '/dashboard',
        };
      }
    };
    
    // Verify the purchase if we have the necessary parameters
    if (searchParams.toString() && (productParam || purchaseId)) {
      // If user is still loading, wait a bit before verifying
      if (userLoading) {
        console.log('User still loading, delaying verification...');
        const timer = setTimeout(() => {
          verifyPurchase(purchaseId!);
        }, 1000);
        return () => clearTimeout(timer);
      } else {
        // User is either authenticated or definitely not authenticated
        verifyPurchase(purchaseId!);
      }
    }
  }, [searchParams, recordSuccessfulPayment, router, user, userLoading, hasAttemptedVerification, hasAttemptedSessionRestore, isRestoringSession]);
  
  // If we're still loading the user or verifying the purchase, show a loading state
  if ((userLoading || isVerifying || isRestoringSession) && !hasAttemptedVerification) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Verifying your purchase</CardTitle>
            <CardDescription>
              {isRestoringSession 
                ? "Restoring your session..." 
                : "Please wait while we verify your purchase..."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // If verification failed, show an error
  if (!verificationResult?.success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Purchase Verification Failed</CardTitle>
            <CardDescription>We couldn't verify your purchase.</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {verificationResult?.error || 'An unexpected error occurred'}
              </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground mt-4">
              If you believe this is an error, please contact support with your order details.
            </p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => router.push('/')}>
              Return to Home
            </Button>
            <Button onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // If verification succeeded, show a success message
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Purchase Successful!</CardTitle>
          <CardDescription>
            Thank you for your purchase. Your payment has been processed successfully.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4 bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Success</AlertTitle>
            <AlertDescription className="text-green-700">
              {verificationResult.productName ? 
                `Your ${verificationResult.productName} purchase has been verified.` : 
                verificationResult.message || 'Your purchase has been verified.'}
            </AlertDescription>
          </Alert>
          <p className="text-sm text-muted-foreground mt-4">
            {user 
              ? "You'll be redirected to your dashboard in a moment." 
              : "You're not currently logged in. You can create an account or log in to access your purchase."}
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          {!user && (
            <Button variant="outline" onClick={() => router.push('/login')}>
              Log In
            </Button>
          )}
          <Button onClick={() => router.push(verificationResult.redirectUrl || '/dashboard')}>
            {user ? 'Go to Dashboard' : 'Continue'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 