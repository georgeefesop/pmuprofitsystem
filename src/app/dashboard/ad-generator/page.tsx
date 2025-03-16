'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { usePurchases } from '@/context/PurchaseContext';

export default function PMUAdGenerator() {
  const router = useRouter();
  const { hasPurchased, hasPurchasedAsync } = usePurchases();
  const [adText, setAdText] = useState('');
  const [generatedAds, setGeneratedAds] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const redirectInProgress = useRef(false);
  
  // Check if the user has purchased the ad generator
  useEffect(() => {
    let isMounted = true;
    
    async function checkAccess() {
      if (redirectInProgress.current) return;
      
      setIsCheckingAccess(true);
      try {
        // Use the async version that waits for API call to complete
        const hasAdGeneratorAccess = await hasPurchasedAsync('pmu-ad-generator');
        
        console.log('Ad Generator access check result:', hasAdGeneratorAccess);
        
        if (!isMounted) return;
        
        setHasAccess(hasAdGeneratorAccess);
        
        if (!hasAdGeneratorAccess && !redirectInProgress.current) {
          redirectInProgress.current = true;
          console.log('No access to Ad Generator, redirecting to purchase page');
          router.push('/dashboard/ad-generator/purchase');
        }
      } catch (error) {
        console.error('Error checking access:', error);
        
        if (!isMounted) return;
        
        // Fall back to synchronous check if async check fails
        const hasAccessSync = hasPurchased('pmu-ad-generator');
        setHasAccess(hasAccessSync);
        
        if (!hasAccessSync && !redirectInProgress.current) {
          redirectInProgress.current = true;
          console.log('No access to Ad Generator (sync check), redirecting to purchase page');
          router.push('/dashboard/ad-generator/purchase');
        }
      } finally {
        if (isMounted) {
          setIsCheckingAccess(false);
        }
      }
    }
    
    checkAccess();
    
    return () => {
      isMounted = false;
    };
  }, [hasPurchased, hasPurchasedAsync, router]);

  // If we're still checking access, show loading
  if (isCheckingAccess) {
    return (
      <DashboardLayout title="PMU Ad Generator">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mx-auto mb-4"></div>
            <p className="text-gray-600">Checking access...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  // If we don't have access, show a message instead of redirecting
  if (!hasAccess) {
    return (
      <DashboardLayout title="PMU Ad Generator">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Redirecting to purchase page...</p>
            <Link href="/dashboard/ad-generator/purchase" className="text-purple-600 hover:text-purple-800 underline">
              Click here if you are not redirected automatically
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  // Handle ad generation
  const generateAds = () => {
    if (!adText.trim()) return;
    
    setIsGenerating(true);
    
    // Simulate AI ad generation
    setTimeout(() => {
      const newAds = [
        `✨ Transform your look with our premium PMU services! ${adText} Book your consultation today and discover the difference professional artistry makes. #PMUArtistry #PermanentMakeup`,
        
        `🌟 Wake up beautiful every day! Our ${adText} services save you time and boost your confidence. Limited slots available this month - book now!`,
        
        `Looking for a change? Our expert PMU artists specialize in ${adText}. Natural-looking results that enhance your beauty. Click to see our portfolio and client transformations!`
      ];
      
      setGeneratedAds(newAds);
      setIsGenerating(false);
    }, 2000);
  };
  
  // Handle ad copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <DashboardLayout title="PMU Ad Generator">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-purple-700 to-purple-900 p-8 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">PMU Ad Generator</h2>
            <p className="text-lg opacity-90">
              Create compelling ad copy for your PMU business in seconds
            </p>
          </div>
          
          <div className="p-8">
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Generate Your Ad</h3>
              <p className="text-gray-600 mb-6">
                Enter details about your PMU service, and our AI will generate professional ad copy tailored to your business.
              </p>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="adText" className="block text-sm font-medium text-gray-700 mb-1">
                    What PMU service are you promoting?
                  </label>
                  <textarea
                    id="adText"
                    rows={3}
                    value={adText}
                    onChange={(e) => setAdText(e.target.value)}
                    placeholder="e.g., Microblading, Powder Brows, Lip Blush, etc. Include any special offers or unique selling points."
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  ></textarea>
                </div>
                
                <div>
                  <button
                    onClick={generateAds}
                    disabled={isGenerating || !adText.trim()}
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                      isGenerating || !adText.trim() 
                        ? 'bg-purple-400 cursor-not-allowed' 
                        : 'bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500'
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </>
                    ) : (
                      'Generate Ads'
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            {generatedAds.length > 0 && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-xl font-semibold mb-4">Generated Ads</h3>
                <div className="space-y-4">
                  {generatedAds.map((ad, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-800 mb-3">{ad}</p>
                      <div className="flex justify-end">
                        <button
                          onClick={() => copyToClipboard(ad)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                          Copy
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Tips for Effective PMU Ads</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Focus on benefits, not just features (e.g., "Wake up beautiful" vs "Get microblading")</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Include a clear call-to-action (e.g., "Book now", "Learn more")</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Use emojis strategically to catch attention (but don't overdo it)</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Highlight what makes your PMU services unique (technique, experience, etc.)</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Create a sense of urgency when appropriate (e.g., "Limited slots available")</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 