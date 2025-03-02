'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { usePurchases } from '@/context/PurchaseContext';

export default function ResetPurchasesPage() {
  const router = useRouter();
  const { resetPurchasesExceptSystem, purchases } = usePurchases();
  
  // Reset purchases when the page loads
  useEffect(() => {
    resetPurchasesExceptSystem();
  }, [resetPurchasesExceptSystem]);
  
  return (
    <DashboardLayout title="Reset Purchases">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Purchases Reset</h2>
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 mb-6">
            <p>All purchases except for the PMU Profit System have been reset. You can now test the purchase flows for:</p>
            <ul className="list-disc ml-6 mt-2">
              <li>Consultation Success Blueprint</li>
              <li>PMU Ad Generator</li>
            </ul>
          </div>
          
          <h3 className="text-lg font-semibold mb-4">Current Purchases</h3>
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <ul className="space-y-2">
              {purchases.map((purchase) => (
                <li key={purchase.product_id} className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>
                    {purchase.product_id === 'pmu-profit-system' && 'PMU Profit System'}
                    {purchase.product_id === 'consultation-success-blueprint' && 'Consultation Success Blueprint'}
                    {purchase.product_id === 'pmu-ad-generator' && 'PMU Ad Generator'}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    (Purchased on {new Date(purchase.created_at).toLocaleDateString()})
                  </span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="flex space-x-4">
            <Link 
              href="/dashboard/blueprint/purchase" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Test Consultation Success Purchase
            </Link>
            <Link 
              href="/dashboard/ad-generator/purchase" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Test Ad Generator Purchase
            </Link>
          </div>
        </div>
        
        <div className="text-center">
          <Link href="/dashboard" className="text-purple-600 hover:text-purple-800 font-medium">
            Return to Dashboard
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
} 