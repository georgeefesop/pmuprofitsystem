'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePurchases } from '@/context/PurchaseContext';
import { supabase } from '@/lib/supabase';
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import PaymentForm from "@/components/PaymentForm";
import { Icons } from '@/components/icons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

export default function Checkout() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Use a single formData object for all form fields
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
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

  // Pre-fill form with user data when available
  useEffect(() => {
    if (user && user.email) {
      // Get user metadata for full name
      const userMetadata = (user as any).user_metadata || {};
      const fullName = userMetadata.full_name || "";
      
      setFormData(prev => ({
        ...prev,
        email: user.email || "",
        fullName: fullName
      }));
    }
  }, [user]);

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
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const calculateTotal = () => {
    let total = 37; // Base price
    if (formData.includeAdGenerator) total += 27;
    if (formData.includeBlueprint) total += 33;
    return total;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Validate form data
      if (!formData.email || !formData.fullName) {
        throw new Error('Please fill in all required fields');
      }
      
      if (formData.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }
      
      // Create checkout session with authenticated user
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          fullName: formData.fullName,
          includeAdGenerator: formData.includeAdGenerator,
          includeBlueprint: formData.includeBlueprint,
          totalPrice: calculateTotal(),
          password: formData.password,
          userId: user?.id // Include the authenticated user's ID
        }),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to create checkout session');
      }
      
      // Redirect to Stripe Checkout
      if (responseData.url) {
        router.push(responseData.url);
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
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
                  <p className="text-sm text-white">30-Day Satisfaction Guarantee</p>
                </div>
              </div>
              
              <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-white">Your account will be created automatically and you can log in immediately after purchase.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Checkout Form */}
            <div className="md:w-3/5 p-6">
              <div className="md:hidden mb-6">
                <h1 className="text-2xl font-bold mb-3 tracking-tight">Secure Checkout</h1>
                <p className="text-gray-600 mb-5 text-sm">You're just one step away from transforming your PMU business!</p>
                
                {/* Mobile Test Mode Banner */}
                <div className="bg-indigo-100 p-2 rounded-lg mb-5 flex items-center text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 flex-shrink-0 text-indigo-700" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-indigo-700 text-xs">Test Mode - No actual payment will be processed</span>
                </div>
              </div>
              
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="John Doe"
                    autoComplete="name"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-xs text-indigo-600 hover:text-indigo-800"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Password must be at least 8 characters long
                  </p>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-medium mb-3">Add-ons (Optional)</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <Input
                          id="includeAdGenerator"
                          name="includeAdGenerator"
                          type="checkbox"
                          checked={formData.includeAdGenerator}
                          onChange={handleChange}
                          disabled={isSubmitting}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <Label htmlFor="includeAdGenerator" className="font-medium text-gray-700">
                          PMU Ad Generator Tool (+€27)
                        </Label>
                        <p className="text-gray-500">AI-powered tool to create high-converting ad copy</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <Input
                          id="includeBlueprint"
                          name="includeBlueprint"
                          type="checkbox"
                          checked={formData.includeBlueprint}
                          onChange={handleChange}
                          disabled={isSubmitting}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <Label htmlFor="includeBlueprint" className="font-medium text-gray-700">
                          Consultation Success Blueprint (+€33)
                        </Label>
                        <p className="text-gray-500">Our proven consultation framework that converts more prospects into paying clients</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Total:</span>
                    <span className="font-bold text-lg">€{calculateTotal()}</span>
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md"
                  >
                    {isSubmitting ? (
                      <>
                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Checkout'
                    )}
                  </Button>
                  
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    By clicking Checkout, you agree to our{' '}
                    <Link href="/terms" className="text-indigo-600 hover:text-indigo-800">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-indigo-600 hover:text-indigo-800">
                      Privacy Policy
                    </Link>
                  </p>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-500">Secure checkout powered by Stripe</span>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 