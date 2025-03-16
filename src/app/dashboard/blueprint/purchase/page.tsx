'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { DashboardLayout } from '@/components/DashboardLayout';
import { usePurchases } from '@/context/PurchaseContext';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '@/context/AuthContext';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function ConsultationSuccessPurchase() {
  const router = useRouter();
  const { addPurchase } = usePurchases();
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();
  
  // Handle purchase button click
  const handlePurchaseClick = async () => {
    setIsProcessing(true);
    
    try {
      // Create a state token with user information to preserve the session
      const stateToken = user ? btoa(JSON.stringify({
        userId: user.id,
        timestamp: Date.now()
      })) : null;
      
      // Include the state token in the URL to maintain the session
      const checkoutUrl = user && stateToken 
        ? `/checkout/addon?product=consultation-success-blueprint&state=${stateToken}&auth_user_id=${user.id}`
        : '/checkout/addon?product=consultation-success-blueprint';
      
      // Ensure auth cookies are properly set before navigation
      if (typeof window !== 'undefined' && user) {
        // Set auth-status cookie to ensure middleware recognizes the user as authenticated
        document.cookie = `auth-status=authenticated; path=/; max-age=${60 * 60 * 24}; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
        
        // Store user ID in localStorage as a backup
        localStorage.setItem('auth_user_id', user.id);
      }
      
      // Navigate to the checkout page with the state token
      router.push(checkoutUrl);
    } catch (err) {
      console.error('Navigation error:', err);
      alert('An unexpected error occurred. Please try again.');
      setIsProcessing(false);
    }
  };
  
  return (
    <DashboardLayout title="Consultation Success Blueprint">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-purple-700 to-purple-900 p-8 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Consultation Success Blueprint</h2>
            <p className="text-lg opacity-90">
              Transform your consultations into bookings with our proven framework
            </p>
          </div>
          
          <div className="p-8">
            <div className="flex flex-col md:flex-row gap-8 mb-8">
              <div className="md:w-2/3">
                <h3 className="text-xl font-semibold mb-4">What You'll Get</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>The exact 20-minute consultation structure that converts prospects effectively</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Word-for-word scripts to handle common objections</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Pre-consultation preparation checklist</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Post-consultation follow-up templates</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Pricing presentation strategies that increase your average sale</span>
                  </li>
                </ul>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-xl font-semibold mb-4">Why This Matters</h3>
                  <p className="text-gray-700 mb-4">
                    Consultations are where potential clients become committed clients. This is your opportunity to connect with them, understand their needs, and guide them toward making the decision that's right for them.
                  </p>
                  <p className="text-gray-700">
                    With our blueprint, you'll be able to conduct consultations with confidence, address objections effectively, and significantly increase your booking rate.
                  </p>
                </div>
              </div>
              
              <div className="md:w-1/3">
                <div className="bg-purple-50 rounded-lg p-6 sticky top-8">
                  <div className="text-center mb-4">
                    <span className="text-3xl font-bold text-gray-900">€33</span>
                    <span className="text-gray-500 line-through ml-2">€57</span>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm">One-time payment</span>
                    </div>
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm">Instant access</span>
                    </div>
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm">Lifetime updates</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={handlePurchaseClick}
                    disabled={isProcessing}
                    className={`w-full py-3 px-4 rounded-md text-white font-medium transition-all ${
                      isProcessing 
                        ? 'bg-purple-400 cursor-not-allowed' 
                        : 'bg-purple-600 hover:bg-purple-700 shadow-md hover:shadow-lg'
                    }`}
                  >
                    {isProcessing ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Redirecting...
                      </span>
                    ) : (
                      'Buy Now'
                    )}
                  </button>
                  
                  <p className="text-xs text-center text-gray-500 mt-4">
                    Secure payment processing. 30-day money-back guarantee.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-8">
              <h3 className="text-xl font-semibold mb-4">Frequently Asked Questions</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">How will I access the blueprint after purchase?</h4>
                  <p className="text-gray-700">
                    After your purchase is complete, you'll be redirected to the blueprint page where you can access all materials immediately. You'll also have permanent access through your dashboard.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Is this a one-time payment?</h4>
                  <p className="text-gray-700">
                    Yes, this is a one-time payment for lifetime access to the Consultation Success Blueprint, including all future updates.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Do you offer a guarantee?</h4>
                  <p className="text-gray-700">
                    Yes, we offer a 30-day money-back guarantee. If you're not satisfied with the blueprint, simply contact us for a full refund.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center mb-8">
          <Link href="/dashboard" className="text-purple-600 hover:text-purple-800 font-medium">
            Return to Dashboard
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
} 