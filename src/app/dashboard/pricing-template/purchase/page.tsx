'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { DashboardLayout } from '@/components/DashboardLayout';
import { usePurchases } from '@/context/PurchaseContext';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function PricingTemplatePurchase() {
  const router = useRouter();
  const { addPurchase } = usePurchases();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Handle purchase button click
  const handlePurchaseClick = async () => {
    setIsProcessing(true);
    
    try {
      // Redirect to the addon checkout page
      router.push('/checkout/addon?product=pricing-template');
    } catch (err) {
      console.error('Navigation error:', err);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <DashboardLayout title="Pricing Template">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-700 to-blue-900 p-8 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Premium Pricing Template</h2>
            <p className="text-lg opacity-90">
              Create professional, conversion-optimized pricing packages in minutes
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
                    <span>Fully customizable pricing template in Google Docs format</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>3 different pricing structures (Good-Better-Best, Tiered, and Value-Based)</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Pricing psychology guide to maximize conversions</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Value proposition examples that sell your services effectively</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Bonus: Objection handling scripts for price negotiations</span>
                  </li>
                </ul>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-xl font-semibold mb-4">Why This Matters</h3>
                  <p className="text-gray-700 mb-4">
                    Your pricing presentation can make or break your sales process. A well-structured pricing page not only communicates value clearly but also guides clients toward the package that's right for them.
                  </p>
                  <p className="text-gray-700">
                    With our premium template, you'll be able to present your services professionally, increase your average sale value, and convert more prospects into paying clients.
                  </p>
                </div>
              </div>
              
              <div className="md:w-1/3">
                <div className="bg-blue-50 rounded-lg p-6 sticky top-8">
                  <div className="text-center mb-4">
                    <span className="text-3xl font-bold text-gray-900">€27</span>
                    <span className="text-gray-500 line-through ml-2">€47</span>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm">One-time payment</span>
                    </div>
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm">Instant access</span>
                    </div>
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                        ? 'bg-blue-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
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
                  <h4 className="font-medium text-gray-900 mb-2">How will I access the template after purchase?</h4>
                  <p className="text-gray-700">
                    After your purchase is complete, you'll be redirected to the template page where you can access all materials immediately. You'll also have permanent access through your dashboard.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Can I customize the template for my business?</h4>
                  <p className="text-gray-700">
                    Absolutely! The template is fully customizable. You can adapt it to your brand colors, add your logo, and modify the package offerings to match your services.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Do you offer a guarantee?</h4>
                  <p className="text-gray-700">
                    Yes, we offer a 30-day money-back guarantee. If you're not satisfied with the template, simply contact us for a full refund.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center mb-8">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 font-medium">
            Return to Dashboard
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
} 