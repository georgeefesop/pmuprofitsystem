'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { DashboardLayout } from '@/components/DashboardLayout';
import { usePurchases } from '@/context/PurchaseContext';
import { useEntitlements } from '@/hooks/useEntitlements';
import { PRODUCT_IDS } from '@/lib/product-ids';

export default function ConsultationBlueprint() {
  const router = useRouter();
  const { hasPurchased } = usePurchases();
  const { entitlements, isLoading: entitlementsLoading } = useEntitlements();
  
  // Check if the user has access to the blueprint
  const hasAccess = React.useMemo(() => {
    // First check purchases
    if (hasPurchased('consultation-success-blueprint')) {
      return true;
    }
    
    // Then check entitlements
    const blueprintProductId = PRODUCT_IDS['consultation-success-blueprint'];
    return entitlements.some(entitlement => 
      entitlement.product_id === blueprintProductId && 
      entitlement.is_active
    );
  }, [hasPurchased, entitlements]);
  
  // Redirect if no access
  useEffect(() => {
    if (!entitlementsLoading && !hasAccess) {
      router.push('/dashboard/blueprint/purchase');
    }
  }, [hasAccess, entitlementsLoading, router]);
  
  // Consultation Blueprint Google Doc URL
  const consultationBlueprintUrl = "https://docs.google.com/document/d/1qNyoDDkOUPmr3DIMJe7UfACM0Woh0SKc-VU4c75zXMY/edit?usp=drive_link";

  // If still loading or no access, show loading state
  if (entitlementsLoading || !hasAccess) {
    return (
      <DashboardLayout title="Consultation Success Blueprint">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mx-auto mb-4"></div>
            <p className="text-gray-600">Checking access...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Consultation Success Blueprint">
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Your Consultation Success Blueprint</h2>
            <p className="text-gray-600">
              Our proven framework that helps you convert more prospects into paying clients
            </p>
          </div>
          <a 
            href={consultationBlueprintUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open
          </a>
        </div>
        
        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-semibold mb-4">What's Inside:</h3>
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
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">The 5-Step Consultation Framework</h3>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold mr-3 flex-shrink-0">1</div>
              <div>
                <p className="font-medium">Building Rapport (5 Minutes)</p>
                <p className="text-sm text-gray-600">Create a connection and establish trust with your client</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold mr-3 flex-shrink-0">2</div>
              <div>
                <p className="font-medium">Assessing Suitability (5 Minutes)</p>
                <p className="text-sm text-gray-600">Determine if the client is a good candidate for the procedure</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold mr-3 flex-shrink-0">3</div>
              <div>
                <p className="font-medium">Educating the Client (5-10 Minutes)</p>
                <p className="text-sm text-gray-600">Explain the process, benefits, and what to expect</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold mr-3 flex-shrink-0">4</div>
              <div>
                <p className="font-medium">Addressing Concerns (5 Minutes)</p>
                <p className="text-sm text-gray-600">Handle objections with confidence and empathy</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold mr-3 flex-shrink-0">5</div>
              <div>
                <p className="font-medium">Closing and Securing a Deposit (2 Minutes)</p>
                <p className="text-sm text-gray-600">Guide the client to book and pay a deposit</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Common Objections & How to Handle Them</h3>
          <div className="space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <p className="font-medium text-purple-600">Objection: "It's too expensive"</p>
              <p className="text-sm text-gray-600 mt-1">
                "This is an investment in yourself that will last for years. The pricing reflects the expertise and personalized care we provide to achieve the best possible results."
              </p>
            </div>
            <div className="border-b border-gray-100 pb-3">
              <p className="font-medium text-purple-600">Objection: "I'm worried about the pain"</p>
              <p className="text-sm text-gray-600 mt-1">
                "That's a common concern, but most clients describe the sensation as a light scratch. Plus, we apply numbing cream to ensure that you're comfortable throughout the procedure."
              </p>
            </div>
            <div className="border-b border-gray-100 pb-3">
              <p className="font-medium text-purple-600">Objection: "I need to think about it"</p>
              <p className="text-sm text-gray-600 mt-1">
                "I understand you want to make the right decision. What specific aspects are you unsure about? I'd be happy to address any concerns you have right now."
              </p>
            </div>
            <div>
              <p className="font-medium text-purple-600">Objection: "I need to check with my partner"</p>
              <p className="text-sm text-gray-600 mt-1">
                "I completely understand. Many clients consult with their partners. Would it help if I sent you some information that you could share with them? In the meantime, we can secure your spot with a small deposit that's fully refundable within 48 hours."
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-purple-50 rounded-lg shadow p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Why Consultations Are Critical</h3>
        <p className="text-gray-700 mb-4">
          Consultations are one of the most important steps in your PMU business because they are where you secure the booking and take the deposit. This is where a potential client becomes a committed client. The consultation gives you a chance to connect with the person, understand their needs, and guide them toward making the decision that's right for them.
        </p>
        <p className="text-gray-700 mb-4">
          In addition to securing bookings, consultations are a key part of building trust and setting clear expectations. Clients are more likely to book with you if they feel confident in your skills and knowledge of the process. This is your chance to showcase your expertise and explain how PMU works in a way that addresses their concerns.
        </p>
        <p className="text-gray-700">
          With a little practice, you'll be able to establish long-term relationships with your clients. A successful consultation doesn't just lead to one booking—it creates the foundation for ongoing trust and loyalty. By providing a great consultation experience, you not only close the deal but also set the stage for future business, including touch-ups, referrals, and repeat clients.
        </p>
        
        <div className="mt-6 pt-6 border-t border-purple-200">
          <p className="text-sm text-purple-700">
            <strong>Pro Tip:</strong> Review the blueprint before each consultation until the process becomes second nature. Consistency is key to achieving high conversion rates.
          </p>
        </div>
      </div>
      
      {/* Google Doc Embed - Moved to the bottom */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Preview Document</h3>
        <div className="relative w-full" style={{ paddingBottom: '75%' }}>
          <iframe 
            src={`${consultationBlueprintUrl.replace('/edit', '/preview')}`}
            className="absolute top-0 left-0 w-full h-full border-0 rounded-lg"
            title="Consultation Success Blueprint"
            allowFullScreen
          ></iframe>
        </div>
        <div className="mt-4 text-center">
          <a 
            href={consultationBlueprintUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open
          </a>
        </div>
      </div>
    </DashboardLayout>
  );
} 