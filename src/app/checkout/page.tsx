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
  loader: 'auto' as const,
  disableLink: true,
  linkAuthenticationElement: {
    enabled: false
  },
  paymentMethodCreation: 'manual' as const,
  fields: {
    billingDetails: {
      address: 'never' as const
    }
  },
  wallets: {
    applePay: 'never' as const,
    googlePay: 'never' as const
  }
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

function CheckoutForm({ user, calculateTotal, formData, updateFormData }: { 
  user: any, 
  calculateTotal: () => number,
  formData: {
    includeAdGenerator: boolean;
    includeBlueprint: boolean;
  },
  updateFormData: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      setError('Stripe is still loading. Please try again in a moment.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Get user metadata for full name
      const userMetadata = (user as any).user_metadata || {};
      
      // Ensure we have a valid name - use full_name from metadata, or extract from email, or use a default
      let fullName = userMetadata.full_name;
      
      // If no full name is available, extract a name from the email or use a default
      if (!fullName || fullName.trim() === '') {
        // Extract name from email (part before @)
        const emailName = user.email.split('@')[0];
        // Capitalize first letter and replace dots/underscores with spaces
        fullName = emailName
          .split(/[._-]/)
          .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
      }
      
      // Create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: calculateTotal(),
          email: user.email,
          name: fullName,
          includeAdGenerator: formData.includeAdGenerator,
          includeBlueprint: formData.includeBlueprint,
          userId: user.id
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment intent');
      }
      
      // Confirm the payment with the card element
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }
      
      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: fullName,
            email: user.email,
          },
        },
      });
      
      if (paymentError) {
        throw new Error(paymentError.message || 'Payment failed');
      }
      
      if (paymentIntent.status === 'succeeded') {
        setSuccess('Payment successful! Redirecting to success page...');
        
        // Redirect to success page
        setTimeout(() => {
          router.push(`/checkout/success?session_id=${paymentIntent.id}`);
        }, 1500);
      } else {
        throw new Error(`Payment status: ${paymentIntent.status}`);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded-md shadow-sm" 
          role="alert"
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </motion.div>
      )}
      
      {success && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-green-50 border-l-4 border-green-500 text-green-700 p-3 rounded-md shadow-sm" 
          role="alert"
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm">{success}</p>
            </div>
          </div>
        </motion.div>
      )}
      
      <div className="flex justify-center">
        <Button
          type="submit"
          disabled={isSubmitting || !stripe}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium py-4 px-8 rounded-md shadow-sm transition-all duration-200 transform hover:scale-[1.02] max-w-xs w-full"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
              Processing...
            </div>
          ) : (
            `Checkout`
          )}
        </Button>
      </div>
    </form>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  
  // Use a single formData object for all form fields
  const [formData, setFormData] = useState({
    includeAdGenerator: false,
    includeBlueprint: false
  });

  // Redirect to pre-checkout if user is not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      // Preserve any product selection in the URL
      const productParam = searchParams.get("products");
      const redirectUrl = productParam 
        ? `/pre-checkout?products=${productParam}` 
        : '/pre-checkout';
      
      router.push(redirectUrl);
    }
  }, [user, isLoading, router, searchParams]);

  // Parse product selection from URL
  useEffect(() => {
    const productParam = searchParams.get("products");
    if (productParam) {
      const products = productParam.split(",");
      setFormData(prev => ({
        ...prev,
        includeAdGenerator: products.includes("pmu-ad-generator"),
        includeBlueprint: products.includes("consultation-blueprint")
      }));
    }
  }, [searchParams]);

  // If still loading or not authenticated, show loading state
  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 pt-20 pb-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication status...</p>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const calculateTotal = () => {
    let total = 37; // Base price
    if (formData.includeAdGenerator) total += 27;
    if (formData.includeBlueprint) total += 33;
    return total;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 pt-12 pb-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Test Mode Notice - Outside the form on the left */}
        <div className="flex items-center mb-3 text-xs text-indigo-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>Test Mode</span>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="p-5">
            {/* Satisfaction Guarantee - Moved to top */}
            <div className="flex items-center justify-center mb-4 bg-purple-50 py-2 px-4 rounded-lg border border-purple-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-purple-700">30-Day Satisfaction Guarantee</span>
            </div>
            
            {/* Product Selection */}
            <div className="mb-5">
              <h2 className="text-lg font-semibold mb-3 text-gray-900">Your Order</h2>
              
              {/* Base Product - Always included */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-gray-900">PMU Profit System</h3>
                    <p className="text-xs text-gray-500">The complete video training system to help you reach €5,000/month as a PMU artist</p>
                  </div>
                  <span className="font-semibold text-gray-900">€37</span>
                </div>
              </div>
              
              {/* Add-ons Selection */}
              <h3 className="text-sm font-medium mb-2 text-gray-700">Add-ons (Optional)</h3>
              
              <div className="space-y-2">
                {/* Ad Generator Add-on */}
                <div className="flex items-start p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    id="includeAdGenerator"
                    name="includeAdGenerator"
                    checked={formData.includeAdGenerator}
                    onChange={handleChange}
                    className="h-4 w-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 mt-1"
                  />
                  <div className="ml-3 flex-grow">
                    <div className="flex justify-between">
                      <label htmlFor="includeAdGenerator" className="text-sm font-medium text-gray-900 flex items-center">
                        PMU Ad Generator Tool
                      </label>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-purple-600">€27</span>
                        <span className="ml-1 text-xs text-gray-500 line-through">€47</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">AI-powered tool to create high-converting ad copy</p>
                  </div>
                </div>
                
                {/* Blueprint Add-on */}
                <div className="flex items-start p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    id="includeBlueprint"
                    name="includeBlueprint"
                    checked={formData.includeBlueprint}
                    onChange={handleChange}
                    className="h-4 w-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 mt-1"
                  />
                  <div className="ml-3 flex-grow">
                    <div className="flex justify-between">
                      <label htmlFor="includeBlueprint" className="text-sm font-medium text-gray-900 flex items-center">
                        Consultation Success Blueprint
                      </label>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-purple-600">€33</span>
                        <span className="ml-1 text-xs text-gray-500 line-through">€59</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Our proven consultation framework that converts more prospects into paying clients</p>
                  </div>
                </div>
              </div>
              
              {/* Order Total */}
              <div className="mt-3 p-3 bg-purple-100 rounded-lg border border-purple-200">
                <div className="flex justify-end items-center">
                  <span className="text-xl font-bold text-purple-700">Total: €{calculateTotal()}</span>
                </div>
              </div>
            </div>
            
            {/* Payment Form */}
            <div className="mb-4">
              <Elements options={elementsOptions} stripe={stripePromise}>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
                  <div className="border border-gray-300 rounded-md p-3 focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500">
                    <CardElement options={cardElementOptions} />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Test Card: 4242 4242 4242 4242 | Exp: Any future date | CVC: Any 3 digits
                  </p>
                  
                  <div className="flex items-center space-x-2 mt-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-xs text-gray-500">Your payment is secure and encrypted</span>
                  </div>
                </div>
                
                <CheckoutForm 
                  user={user} 
                  calculateTotal={calculateTotal} 
                  formData={formData}
                  updateFormData={handleChange}
                />
              </Elements>
            </div>
            
            <div className="text-center text-xs text-gray-500 mt-3">
              <p>
                By completing this purchase, you agree to our{" "}
                <a href="#" className="text-purple-600 hover:text-purple-500">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-purple-600 hover:text-purple-500">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <ClientWrapper>
      <CheckoutContent />
    </ClientWrapper>
  );
} 