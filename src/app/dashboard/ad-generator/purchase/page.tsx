'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { DashboardLayout } from '@/components/DashboardLayout';
import { usePurchases } from '@/context/PurchaseContext';

export default function PMUAdGeneratorPurchase() {
  const router = useRouter();
  const { addPurchase } = usePurchases();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Handle purchase
  const handlePurchase = () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      // Add the purchase to the user's account
      addPurchase('pmu-ad-generator');
      
      // Redirect to the ad generator page
      router.push('/dashboard/ad-generator');
    }, 2000);
  };
  
  return (
    <DashboardLayout title="PMU Ad Generator">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-purple-700 to-purple-900 p-8 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">PMU Ad Generator</h2>
            <p className="text-lg opacity-90">
              Create compelling ad copy for your PMU business in seconds
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
                    <span>AI-powered ad copy generator tailored for PMU businesses</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Multiple ad variations for different platforms (Facebook, Instagram, Google, TikTok)</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Customizable options for different target audiences and PMU services</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>One-click copy functionality for easy use in your marketing campaigns</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Expert tips for creating high-converting PMU ads</span>
                  </li>
                </ul>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-xl font-semibold mb-4">Why This Matters</h3>
                  <p className="text-gray-700 mb-4">
                    Creating compelling ad copy is one of the biggest challenges for PMU artists. With our Ad Generator, you'll save hours of time trying to come up with the perfect wording for your ads.
                  </p>
                  <p className="text-gray-700">
                    Our AI has been trained on thousands of successful PMU ads to understand what messaging resonates with potential clients. You'll get professional-quality ad copy in seconds, helping you attract more clients and grow your business.
                  </p>
                </div>
              </div>
              
              <div className="md:w-1/3">
                <div className="bg-purple-50 rounded-lg p-6 sticky top-8">
                  <div className="text-center mb-4">
                    <span className="text-3xl font-bold text-gray-900">$67</span>
                    <span className="text-gray-500 line-through ml-2">$97</span>
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
                      <span className="text-sm">Unlimited ad generations</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={handlePurchase}
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
                        Processing...
                      </span>
                    ) : (
                      'Get Instant Access'
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
                  <h4 className="font-medium text-gray-900 mb-2">How many ads can I generate?</h4>
                  <p className="text-gray-700">
                    You can generate unlimited ads with your purchase. There are no monthly limits or additional fees.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Can I customize the ads for my specific PMU services?</h4>
                  <p className="text-gray-700">
                    Yes, the Ad Generator allows you to specify your PMU services, target audience, and platform to create highly customized ad copy.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Do you offer a guarantee?</h4>
                  <p className="text-gray-700">
                    Yes, we offer a 30-day money-back guarantee. If you're not satisfied with the Ad Generator, simply contact us for a full refund.
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