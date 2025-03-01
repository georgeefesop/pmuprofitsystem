'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePurchases } from '@/context/PurchaseContext';
import { supabase } from '@/lib/supabase';
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import PaymentForm from "@/components/PaymentForm";

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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adGenerator, setAdGenerator] = useState(false);
  const [blueprint, setBlueprint] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const router = useRouter();
  const { register } = useAuth();
  const { addPurchase } = usePurchases();

  const calculateTotal = () => {
    let total = 37; // Base price
    if (adGenerator) total += 27;
    if (blueprint) total += 33;
    return total;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // Validate password strength
      if (password.length < 8) {
        setError('Password must be at least 8 characters long');
        setIsLoading(false);
        return;
      }
      
      // Validate password confirmation
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }
      
      // First, check if the user already exists
      const { data: existingUser, error: checkError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (existingUser?.user) {
        // User exists and password is correct - proceed with purchase for existing user
        console.log('User already exists, proceeding with purchase');
        
        // Store the user's email for potential issues
        if (typeof window !== 'undefined') {
          localStorage.setItem('pendingPurchaseEmail', email);
        }
        
        // Process the purchase
        const purchaseData = {
          email,
          fullName: name,
          includeAdGenerator: adGenerator,
          includeBlueprint: blueprint,
          totalPrice: calculateTotal(),
        };
        
        const response = await fetch('/api/create-checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(purchaseData),
        });
        
        const data = await response.json();
        
        if (response.ok && data.url) {
          // Redirect to Stripe checkout
          window.location.href = data.url;
        } else {
          setError(data.error || 'Failed to create checkout session');
        }
      } else {
        // User doesn't exist - register new user
        console.log('Registering new user');
        
        // Store the user's email for potential issues
        if (typeof window !== 'undefined') {
          localStorage.setItem('pendingPurchaseEmail', email);
        }
        
        // Register the user with Supabase
        const { data: userData, error: registerError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/checkout/success&registration=pending`,
          },
        });
        
        if (registerError) {
          console.error('Registration error:', registerError);
          setError(registerError.message);
          setIsLoading(false);
          return;
        }
        
        if (!userData.user) {
          setError('Failed to create user account');
          setIsLoading(false);
          return;
        }
        
        console.log('User registered successfully:', userData.user.id);
        
        // Check if email confirmation is required
        const emailConfirmationRequired = userData.session === null;
        
        if (emailConfirmationRequired) {
          // Redirect to success page with pending registration flag
          router.push('/checkout/success?registration=pending');
          return;
        }
        
        // Process the purchase
        const purchaseData = {
          email,
          fullName: name,
          includeAdGenerator: adGenerator,
          includeBlueprint: blueprint,
          totalPrice: calculateTotal(),
          userId: userData.user.id,
        };
        
        const response = await fetch('/api/create-checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(purchaseData),
        });
        
        const data = await response.json();
        
        if (response.ok && data.url) {
          // Redirect to Stripe checkout
          window.location.href = data.url;
        } else {
          setError(data.error || 'Failed to create checkout session');
        }
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentIntentId: string) => {
    setPaymentSuccess(true);
    setPaymentError("");
    // You would typically redirect to a success page or show a success message
    window.location.href = `/checkout/success?session_id=${paymentIntentId}`;
  };
  
  const handlePaymentError = (error: string) => {
    setPaymentError(error);
    setIsLoading(false);
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
              
              {adGenerator && (
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
              
              {blueprint && (
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
              
              <div className="border-t border-white/30 pt-3 mt-4">
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-white text-sm">Total:</p>
                  <p className="text-2xl font-bold">€{calculateTotal()}</p>
                </div>
              </div>
              
              {/* Satisfaction Guarantee */}
              <div className="flex items-center bg-indigo-900/50 p-3 rounded-xl border border-indigo-400/30 mt-4">
                <div className="bg-indigo-500 rounded-full p-1 mr-2 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <span className="font-medium text-sm text-white">30-Day Satisfaction Guarantee</span>
                  <p className="text-xs text-white">Not satisfied? Get a full refund within 30 days</p>
                </div>
              </div>
              
              {/* Testimonial - Moved from right side */}
              <div className="bg-gradient-to-br from-indigo-800 to-purple-900 p-5 rounded-xl mt-6 shadow-md border-2 border-indigo-400/30">
                <div className="flex items-center mb-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold mr-3 text-xs shadow-md">
                    SK
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">Sarah K.</p>
                    <p className="text-xs text-white/80">PMU Artist</p>
                  </div>
                </div>
                <div className="flex mb-2">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-300 mr-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-white italic text-sm leading-relaxed">
                  "The PMU Profit System completely transformed my business. I went from struggling to find clients to being booked solid within weeks!"
                </p>
                <div className="mt-3 pt-2 border-t border-white/20">
                  <p className="text-xs text-white/70 font-medium">Verified Purchase</p>
                </div>
              </div>
            </div>
            
            {/* Checkout Form */}
            <div className="w-full md:w-3/5 p-8">
              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-5 border border-red-100">
                  <div className="flex">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}
              
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-sm"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-sm"
                    placeholder="your@email.com"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-sm"
                      placeholder="Create a secure password"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Must be at least 8 characters long
                  </p>
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-sm"
                      placeholder="Confirm your password"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Upsell Options */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Enhance Your Experience</h3>
                  
                  <div className="space-y-3">
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-3 rounded-lg border border-purple-100 relative">
                      <div className="flex items-start">
                        <div className="flex items-center h-5 mt-1">
                          <input
                            id="adGenerator"
                            name="adGenerator"
                            type="checkbox"
                            checked={adGenerator}
                            onChange={(e) => setAdGenerator(e.target.checked)}
                            className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="adGenerator" className="font-medium text-gray-800 flex items-center">
                            PMU Ad Generator Tool
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              Popular
                            </span>
                          </label>
                          <div className="flex items-center mt-1">
                            <span className="text-purple-600 font-medium text-base">€27</span>
                            <span className="text-gray-400 line-through text-xs ml-2">€47</span>
                          </div>
                          <p className="text-gray-600 mt-1 text-xs">AI-powered tool to create high-converting ad copy for your PMU business</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100 relative">
                      <div className="flex items-start">
                        <div className="flex items-center h-5 mt-1">
                          <input
                            id="blueprint"
                            name="blueprint"
                            type="checkbox"
                            checked={blueprint}
                            onChange={(e) => setBlueprint(e.target.checked)}
                            className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="blueprint" className="font-medium text-gray-800">
                            Consultation Success Blueprint
                          </label>
                          <div className="flex items-center mt-1">
                            <span className="text-purple-600 font-medium text-base">€33</span>
                            <span className="text-gray-400 line-through text-xs ml-2">€59</span>
                          </div>
                          <p className="text-gray-600 mt-1 text-xs">Our proven consultation framework that converts more prospects into paying clients</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Order Summary - Only visible on mobile */}
                <div className="md:hidden mt-6 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-base font-medium text-gray-800 mb-3">Order Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <div>
                        <p className="font-medium text-gray-800">PMU Profit System</p>
                        <p className="text-xs text-gray-500">Complete system to boost your PMU business</p>
                      </div>
                      <span className="font-medium text-gray-800">€37</span>
                    </div>
                    
                    {adGenerator && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <div>
                          <p className="font-medium text-gray-800">PMU Ad Generator Tool</p>
                          <p className="text-xs text-gray-500">AI-powered ad creation tool</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-800">€27</p>
                          <p className="text-xs text-gray-500 line-through">€47</p>
                        </div>
                      </div>
                    )}
                    
                    {blueprint && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <div>
                          <p className="font-medium text-gray-800">Consultation Blueprint</p>
                          <p className="text-xs text-gray-500">Convert prospects into clients</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-800">€33</p>
                          <p className="text-xs text-gray-500 line-through">€59</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center pt-2">
                      <p className="font-semibold text-gray-800">Total</p>
                      <p className="text-xl font-bold text-purple-700">€{calculateTotal()}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  {paymentError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                      {paymentError}
                    </div>
                  )}
                  
                  <Elements stripe={stripePromise} options={elementsOptions}>
                    <PaymentForm
                      amount={calculateTotal()}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                      isLoading={isLoading}
                      setIsLoading={setIsLoading}
                      email={email}
                      name={name}
                      includeAdGenerator={adGenerator}
                      includeBlueprint={blueprint}
                    />
                  </Elements>
                </div>
                
                <div>
                  <p className="text-xs text-center text-gray-500 mt-2">
                    By clicking "Checkout", you agree to our Terms of Service and Privacy Policy
                  </p>
                </div>
                
                {/* Mobile-only Guarantee and Testimonial */}
                <div className="md:hidden mt-6 space-y-4">
                  {/* Satisfaction Guarantee */}
                  <div className="flex items-center bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                    <div className="bg-indigo-500 rounded-full p-1 mr-2 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <span className="font-medium text-sm text-gray-800">30-Day Satisfaction Guarantee</span>
                      <p className="text-xs text-gray-600">Not satisfied? Get a full refund within 30 days</p>
                    </div>
                  </div>
                  
                  {/* Testimonial */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center mb-2">
                      <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold mr-2 text-xs">
                        SK
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">Sarah K.</p>
                        <p className="text-xs text-gray-600">PMU Artist</p>
                      </div>
                    </div>
                    <div className="flex mb-1">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-gray-700 italic text-xs">
                      "The PMU Profit System completely transformed my business. I went from struggling to find clients to being booked solid within weeks!"
                    </p>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
        
        {/* FAQ Section - Moved outside the main checkout container */}
        <div className="max-w-5xl mx-auto mt-12 bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-800 mb-8 text-center">Frequently Asked Questions</h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-r from-gray-50 to-white p-5 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
              <h4 className="text-base font-medium text-gray-900 mb-2">How soon will I get access?</h4>
              <p className="text-gray-600">You'll get immediate access to all course materials after your payment is processed. This typically takes less than a minute.</p>
            </div>
            
            <div className="bg-gradient-to-r from-gray-50 to-white p-5 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
              <h4 className="text-base font-medium text-gray-900 mb-2">Is my payment secure?</h4>
              <p className="text-gray-600">Yes, all payments are processed through Stripe, a PCI-compliant payment processor. Your card details are never stored on our servers.</p>
            </div>
            
            <div className="bg-gradient-to-r from-gray-50 to-white p-5 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
              <h4 className="text-base font-medium text-gray-900 mb-2">What if I'm not satisfied?</h4>
              <p className="text-gray-600">We offer a 30-day satisfaction guarantee. If you're not completely satisfied, contact us for a full refund.</p>
            </div>
            
            <div className="bg-gradient-to-r from-gray-50 to-white p-5 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
              <h4 className="text-base font-medium text-gray-900 mb-2">Do I need any special software?</h4>
              <p className="text-gray-600">No, all you need is a web browser to access the course materials. Our platform works on desktop, tablet, and mobile devices.</p>
            </div>
            
            <div className="bg-gradient-to-r from-gray-50 to-white p-5 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
              <h4 className="text-base font-medium text-gray-900 mb-2">How long do I have access?</h4>
              <p className="text-gray-600">You'll have lifetime access to the course materials, including any future updates we make to the content.</p>
            </div>
            
            <div className="bg-gradient-to-r from-gray-50 to-white p-5 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
              <h4 className="text-base font-medium text-gray-900 mb-2">Can I access on mobile devices?</h4>
              <p className="text-gray-600">Yes, the course is fully responsive and can be accessed on any device including smartphones and tablets.</p>
            </div>
          </div>
          
          <div className="mt-10 text-center">
            <Link href="/" className="inline-flex items-center text-purple-600 hover:text-purple-800 font-medium transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Return to homepage
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
} 