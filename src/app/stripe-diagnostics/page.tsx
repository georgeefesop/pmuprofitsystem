'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function StripeDiagnosticsPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testStripeConnection = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/test-stripe');
      const data = await response.json();
      setTestResult(data);
    } catch (err) {
      console.error('Error testing Stripe connection:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Stripe Diagnostics</h1>
          <p className="text-gray-600">Test your Stripe connection and configuration</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection Test</h2>
          
          <button
            onClick={testStripeConnection}
            disabled={isLoading}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors mb-4"
          >
            {isLoading ? 'Testing...' : 'Test Stripe Connection'}
          </button>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          )}
          
          {testResult && (
            <div className={`border rounded-md p-4 mb-4 ${testResult.success ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
              <p className="font-medium">{testResult.success ? 'Success:' : 'Error:'}</p>
              <p>{testResult.message}</p>
              
              {testResult.errorType && (
                <p className="mt-2"><strong>Error Type:</strong> {testResult.errorType}</p>
              )}
              
              {testResult.stripeKeyInfo && (
                <div className="mt-4">
                  <p className="font-medium">Stripe Key Info:</p>
                  <ul className="list-disc pl-5 mt-2">
                    <li>Present: {testResult.stripeKeyInfo.present ? 'Yes' : 'No'}</li>
                    <li>Length: {testResult.stripeKeyInfo.length}</li>
                    <li>Prefix: {testResult.stripeKeyInfo.prefix}</li>
                  </ul>
                </div>
              )}
              
              {testResult.balanceAvailable && (
                <div className="mt-4">
                  <p className="font-medium">Balance Available:</p>
                  <ul className="list-disc pl-5 mt-2">
                    {testResult.balanceAvailable.map((balance: any, index: number) => (
                      <li key={`available-${index}`}>
                        {balance.amount / 100} {balance.currency.toUpperCase()}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {testResult.balancePending && (
                <div className="mt-4">
                  <p className="font-medium">Balance Pending:</p>
                  <ul className="list-disc pl-5 mt-2">
                    {testResult.balancePending.map((balance: any, index: number) => (
                      <li key={`pending-${index}`}>
                        {balance.amount / 100} {balance.currency.toUpperCase()}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
          
          <div className="space-y-4">
            <div>
              <p className="font-medium">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:</p>
              <p className="text-gray-600">
                {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 
                  `${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.substring(0, 8)}...` : 
                  'Not set'}
              </p>
            </div>
            
            <div>
              <p className="font-medium">STRIPE_SECRET_KEY:</p>
              <p className="text-gray-600">
                {/* We can't access this directly in the client, but we can check if it's set on the server */}
                Check the server logs or use the test button above
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Troubleshooting Tips</h2>
          
          <ul className="list-disc pl-5 space-y-2">
            <li>Make sure your Stripe API keys are correctly set in your environment variables</li>
            <li>Verify that you're using the correct API keys for your environment (test vs. production)</li>
            <li>Check if your Stripe account is active and in good standing</li>
            <li>Ensure your server has proper network connectivity to Stripe's API servers</li>
            <li>Check for any IP restrictions or firewall rules that might be blocking the connection</li>
          </ul>
          
          <div className="mt-6">
            <Link href="/" className="text-purple-600 hover:underline">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 