'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePurchases } from '@/context/PurchaseContext';
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { motion } from "framer-motion";
import { Button } from '@/components/ui/button';
import ClientWrapper from '@/components/ClientWrapper';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

// Initialize Stripe with publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Add appearance options for Stripe Elements
const appearance = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: '#6366f1',
    colorBackground: '#ffffff',
    colorText: '#32325d',
    colorDanger: '#ef4444',
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    spacingUnit: '4px',
    borderRadius: '8px',
  }
};

// Options for Stripe Elements
const elementsOptions = {
  appearance,
  locale: 'auto' as const,
  loader: 'auto' as const,
  clientSecret: undefined, // Will be set dynamically
};

// Card element options
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#32325d',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
  hidePostalCode: true,
  disableLink: true,
};

// Helper function to format price
const formatPrice = (price: number): string => {
  return `€${price.toFixed(2)}`;
};

// Product information
const PRODUCTS = {
  'consultation-success-blueprint': {
    name: 'Consultation Success Blueprint',
    description: 'Transform your consultations into bookings with our proven framework',
    price: 33,
    originalPrice: 57,
    color: 'purple',
  },
  'pricing-template': {
    name: 'Premium Pricing Template',
    description: 'Create professional, conversion-optimized pricing packages in minutes',
    price: 27,
    originalPrice: 47,
    color: 'blue',
  },
  'pmu-ad-generator': {
    name: 'PMU Ad Generator',
    description: 'Create high-converting PMU ads in minutes',
    price: 27,
    originalPrice: 47,
    color: 'green',
  }
};

// Define extended user type that includes user_metadata
interface ExtendedUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    [key: string]: any;
  };
}

function CheckoutForm({ productId, productName, amount }: { 
  productId: string,
  productName: string,
  amount: number
}) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { user } = useAuth();
  
  // Cast user to ExtendedUser type to access user_metadata
  const extendedUser = user as ExtendedUser | null;

  // Get user's full name from metadata if available, or extract from email
  const fullName = extendedUser?.user_metadata?.full_name || extractNameFromEmail(user?.email || '');

  // Helper function to extract a name from email
  function extractNameFromEmail(email: string): string {
    if (!email) return 'Customer';
    
    // Extract the part before @ and replace dots/underscores with spaces
    const namePart = email.split('@')[0];
    
    // Convert to title case (capitalize first letter of each word)
    return namePart
      .split(/[._-]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  useEffect(() => {
    if (!user) return;

    const createPaymentIntent = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log('Creating payment intent with data:', {
          amount,
          email: user?.email,
          name: fullName,
          userId: user?.id,
          productId
        });

        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount,
            email: user?.email,
            name: fullName,
            userId: user?.id,
            productId, // Pass the productId to the API
            currency: 'eur' // Explicitly set currency to EUR
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error response from create-payment-intent:', errorData);
          throw new Error(errorData.error || 'Failed to create payment intent');
        }

        const data = await response.json();
        console.log('Payment intent created successfully:', {
          hasClientSecret: !!data.clientSecret,
          paymentIntentId: data.paymentIntentId
        });
        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
      } catch (err) {
        console.error('Error creating payment intent:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [user, amount, fullName, productId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setLoading(true);
    
    try {
      const cardElement = elements.getElement(CardElement);
      
      if (!cardElement) {
        throw new Error('Card element not found');
      }
      
      // Get payment method from card element
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: fullName,
          email: user?.email || '',
        },
      });
      
      if (paymentMethodError) {
        throw paymentMethodError;
      }
      
      // Create the payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          email: user?.email,
          name: fullName,
          userId: user?.id,
          productId: productId,
          currency: 'eur' // Explicitly set currency to EUR
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment intent');
      }
      
      const { clientSecret, paymentIntentId, purchaseId } = await response.json();
      
      console.log('Payment intent created:', { paymentIntentId, purchaseId });
      
      // Confirm the card payment
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethod.id,
      });
      
      if (confirmError) {
        throw confirmError;
      }
      
      if (paymentIntent.status === 'succeeded') {
        // Payment succeeded, redirect to success page
        window.location.href = `/checkout/success?payment_intent_id=${paymentIntentId}&product=${productId || ''}&purchase_id=${purchaseId}`;
      } else {
        // Handle other payment intent statuses
        throw new Error(`Payment status: ${paymentIntent.status}`);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md">
      <div className="space-y-2">
        <Label htmlFor="card-element">Card Details</Label>
        <div className="p-3 border rounded-md">
          <CardElement
            id="card-element"
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
              hidePostalCode: true
            }}
          />
          <p className="mt-2 text-xs text-gray-500">
            Secure payment processing by Stripe. We never store your card details.
          </p>
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <Button
        type="submit"
        disabled={!stripe || !elements || loading || !clientSecret}
        className="w-full"
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </div>
        ) : (
          "Checkout"
        )}
      </Button>
    </form>
  );
}

function AddonCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  
  // Get the product ID from the URL
  const productId = searchParams.get('product') || '';
  const stateToken = searchParams.get('state') || '';
  const authUserId = searchParams.get('auth_user_id') || '';
  
  // Set a timeout for auth check to prevent infinite loading
  useEffect(() => {
    console.log('Auth check started, current state:', { 
      isLoading, 
      hasUser: !!user, 
      authCheckComplete,
      hasStateToken: !!stateToken,
      hasAuthUserId: !!authUserId
    });
    
    // Try to restore session from URL parameters
    const tryRestoreFromUrl = async () => {
      if (stateToken) {
        try {
          console.log('Found state token in URL, attempting to restore session');
          const tokenData = JSON.parse(atob(stateToken));
          
          if (tokenData.userId) {
            console.log('Found user ID in state token:', tokenData.userId);
            
            // Store user ID in localStorage as a backup
            localStorage.setItem('auth_user_id', tokenData.userId);
            
            // Set auth-status cookie
            document.cookie = `auth-status=authenticated; path=/; max-age=${60 * 60 * 24}; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
          }
        } catch (error) {
          console.error('Error decoding state token:', error);
        }
      }
      
      if (authUserId) {
        console.log('Found auth_user_id in URL:', authUserId);
        // Store user ID in localStorage
        localStorage.setItem('auth_user_id', authUserId);
        
        // Set auth-status cookie
        document.cookie = `auth-status=authenticated; path=/; max-age=${60 * 60 * 24}; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
      }
    };
    
    // Try to restore session from URL parameters
    if (!user && (stateToken || authUserId)) {
      tryRestoreFromUrl();
    }
    
    const timer = setTimeout(() => {
      if (isLoading) {
        console.log('Auth check timeout reached, proceeding with checkout');
        setAuthCheckComplete(true);
      }
    }, 5000); // 5 second timeout
    
    return () => clearTimeout(timer);
  }, [isLoading, stateToken, authUserId]);
  
  // Once auth check is complete, redirect if not authenticated
  useEffect(() => {
    if (!isLoading) {
      setAuthCheckComplete(true);
      
      if (!user && !stateToken && !authUserId) {
        console.log('User not authenticated, redirecting to login');
        router.push(`/login?redirect=${encodeURIComponent(`/checkout/addon?product=${productId}`)}`);
      }
    }
  }, [isLoading, user, router, productId, stateToken, authUserId]);
  
  // Get product information
  const product = PRODUCTS[productId as keyof typeof PRODUCTS];
  
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Product</h1>
          <p className="text-gray-600 mb-6">The product you're trying to purchase doesn't exist.</p>
          <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-800 font-medium">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }
  
  // If still loading auth or not authenticated, show loading state
  if (isLoading || !authCheckComplete || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Preparing your checkout...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-50 to-purple-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Checkout</h1>
          <p className="mt-2 text-lg text-gray-600">Complete your purchase</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
            <h2 className="text-xl font-bold">{product.name}</h2>
            <p className="text-sm opacity-90">{product.description}</p>
          </div>
          
          <div className="p-6">
            <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-200">
              <div>
                <h3 className="font-medium text-gray-900">{product.name}</h3>
                <p className="text-sm text-gray-500">{product.description}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">{formatPrice(product.price)}</p>
                {product.originalPrice && (
                  <p className="text-sm text-gray-500 line-through">{formatPrice(product.originalPrice)}</p>
                )}
              </div>
            </div>
            
            <div className="mb-6 pb-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">Total</span>
                <span className="text-xl font-bold text-gray-900">{formatPrice(product.price)}</span>
              </div>
            </div>
            
            <Elements stripe={stripePromise}>
              <CheckoutForm 
                productId={productId}
                productName={product.name}
                amount={product.price}
              />
            </Elements>
          </div>
        </div>
        
        <div className="text-center">
          <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-800 font-medium">
            Cancel and return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AddonCheckoutPage() {
  return (
    <ClientWrapper>
      <AddonCheckoutContent />
    </ClientWrapper>
  );
} 