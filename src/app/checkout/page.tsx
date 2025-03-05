'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePurchases } from '@/context/PurchaseContext';
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { motion } from "framer-motion";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

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
};

// Card element options
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#32325d',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a',
    },
  },
  hidePostalCode: true,
};

function CheckoutForm({ user, calculateTotal, formData }: { 
  user: any, 
  calculateTotal: () => number,
  formData: {
    includeAdGenerator: boolean;
    includeBlueprint: boolean;
  }
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
      const fullName = userMetadata.full_name || "";
      
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-sm" 
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
          className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-md shadow-sm" 
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
      
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Card Information</h3>
          <div className="border border-gray-300 rounded-md p-3 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
            <CardElement options={cardElementOptions} />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Test Card: 4242 4242 4242 4242 | Exp: Any future date | CVC: Any 3 digits
          </p>
        </div>
        
        <div className="flex items-center space-x-2 mt-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="text-sm text-gray-500">Your payment is secure and encrypted</span>
        </div>
      </div>
      
      <Button
        type="submit"
        disabled={isSubmitting || !stripe}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-md shadow-sm transition-all duration-200 transform hover:scale-[1.02]"
      >
        {isSubmitting ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
            Processing Payment...
          </div>
        ) : (
          `Pay €${calculateTotal()}`
        )}
      </Button>
      
      <div className="text-center text-sm text-gray-500 mt-4">
        <p>
          By completing this purchase, you agree to our{" "}
          <a href="#" className="text-indigo-600 hover:text-indigo-500">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="text-indigo-600 hover:text-indigo-500">
            Privacy Policy
          </a>
        </p>
      </div>
    </form>
  );
}

export default function Checkout() {
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
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 pt-20 pb-8 px-4">
      <div className="container-custom">
        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 my-8">
          <div className="md:flex">
            {/* Product Summary - Hidden on mobile */}
            <div className="hidden md:block md:w-2/5 bg-gradient-to-br from-purple-700 to-indigo-800 text-white p-6">
              <h1 className="text-2xl font-bold mb-3 tracking-tight">Secure Checkout</h1>
              <p className="text-white mb-5 text-sm">You're just one step away from transforming your PMU business!</p>
              
              {/* Test Mode Banner */}
              <div className="bg-indigo-900/80 p-2 rounded-lg mb-5 flex items-center text-sm backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 flex-shrink-0 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-white text-xs">Test Mode - No actual payment will be processed</span>
              </div>
              
              <div className="bg-white/20 p-4 rounded-xl mb-4 backdrop-blur-sm border border-white/30">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">PMU Profit System</h2>
                    <p className="mb-1 text-white text-xs">The complete system to help you reach €5,000/month as a PMU artist</p>
                  </div>
                  <p className="text-xl font-bold">€37</p>
                </div>
              </div>
              
              {formData.includeAdGenerator && (
                <div className="bg-white/20 p-4 rounded-xl mb-4 backdrop-blur-sm border border-white/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-lg font-semibold mb-1">PMU Ad Generator Tool</h2>
                      <p className="mb-1 text-white text-xs">AI-powered tool to create high-converting ad copy</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">€27</p>
                      <p className="text-white/70 line-through text-xs">€47</p>
                    </div>
                  </div>
                </div>
              )}
              
              {formData.includeBlueprint && (
                <div className="bg-white/20 p-4 rounded-xl mb-4 backdrop-blur-sm border border-white/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-lg font-semibold mb-1">Consultation Success Blueprint</h2>
                      <p className="mb-1 text-white text-xs">Our proven consultation framework that converts more prospects into paying clients</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">€33</p>
                      <p className="text-white/70 line-through text-xs">€59</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-white/20 p-4 rounded-xl mb-4 backdrop-blur-sm border border-white/30">
                <div className="flex justify-between items-start">
                  <h2 className="text-lg font-semibold">Total</h2>
                  <p className="text-xl font-bold">€{calculateTotal()}</p>
                </div>
              </div>
              
              <div className="bg-white/10 p-4 rounded-xl mb-4 backdrop-blur-sm border border-white/20">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-white text-sm">30-Day Satisfaction Guarantee</span>
                </div>
              </div>
              
              {/* User Info */}
              <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
                <h3 className="text-sm font-medium mb-2 text-white/80">Your Information</h3>
                <div className="flex items-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-sm text-white/90">{(user as any).user_metadata?.full_name || 'Account Holder'}</span>
                </div>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-white/90">{user.email}</span>
                </div>
              </div>
            </div>
            
            {/* Checkout Form */}
            <div className="md:w-3/5 p-6">
              <div className="md:hidden mb-6">
                <h1 className="text-2xl font-bold mb-2 tracking-tight text-gray-900">Secure Checkout</h1>
                <p className="text-gray-600 mb-4 text-sm">You're just one step away from transforming your PMU business!</p>
                
                {/* Mobile Test Mode Banner */}
                <div className="bg-indigo-50 p-2 rounded-lg mb-4 flex items-center text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 flex-shrink-0 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-indigo-700 text-xs">Test Mode - No actual payment will be processed</span>
                </div>
                
                {/* Mobile User Info */}
                <div className="bg-gray-50 p-3 rounded-lg mb-6 border border-gray-200">
                  <h3 className="text-sm font-medium mb-2 text-gray-700">Your Information</h3>
                  <div className="flex items-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-sm text-gray-700">{(user as any).user_metadata?.full_name || 'Account Holder'}</span>
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-700">{user.email}</span>
                  </div>
                </div>
              </div>
              
              <h2 className="text-xl font-semibold mb-6 text-gray-900">Payment Details</h2>
              
              {/* Add-ons Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3 text-gray-900">Add-ons (Optional)</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="includeAdGenerator"
                      name="includeAdGenerator"
                      checked={formData.includeAdGenerator}
                      onChange={handleChange}
                      className="h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 mt-1"
                    />
                    <div className="ml-3">
                      <label htmlFor="includeAdGenerator" className="text-base font-medium text-gray-900 flex items-center">
                        PMU Ad Generator Tool
                        <span className="ml-2 text-sm font-semibold text-indigo-600">€27</span>
                        <span className="ml-1 text-xs text-gray-500 line-through">€47</span>
                      </label>
                      <p className="text-sm text-gray-500">AI-powered tool to create high-converting ad copy</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="includeBlueprint"
                      name="includeBlueprint"
                      checked={formData.includeBlueprint}
                      onChange={handleChange}
                      className="h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 mt-1"
                    />
                    <div className="ml-3">
                      <label htmlFor="includeBlueprint" className="text-base font-medium text-gray-900 flex items-center">
                        Consultation Success Blueprint
                        <span className="ml-2 text-sm font-semibold text-indigo-600">€33</span>
                        <span className="ml-1 text-xs text-gray-500 line-through">€59</span>
                      </label>
                      <p className="text-sm text-gray-500">Our proven consultation framework that converts more prospects into paying clients</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Order Summary - Mobile Only */}
              <div className="md:hidden mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium mb-3 text-gray-900">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">PMU Profit System</span>
                    <span className="font-medium">€37</span>
                  </div>
                  
                  {formData.includeAdGenerator && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">PMU Ad Generator Tool</span>
                      <span className="font-medium">€27</span>
                    </div>
                  )}
                  
                  {formData.includeBlueprint && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Consultation Success Blueprint</span>
                      <span className="font-medium">€33</span>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>€{calculateTotal()}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Stripe Elements */}
              <Elements stripe={stripePromise} options={elementsOptions}>
                <CheckoutForm 
                  user={user} 
                  calculateTotal={calculateTotal} 
                  formData={formData} 
                />
              </Elements>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 