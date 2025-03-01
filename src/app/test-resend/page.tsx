'use client';

import React, { useState } from 'react';

export default function TestResendVerification() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isCheckingDetails, setIsCheckingDetails] = useState(false);
  const [isUnbanning, setIsUnbanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [statusResult, setStatusResult] = useState<any>(null);
  const [detailsResult, setDetailsResult] = useState<any>(null);
  const [unbanResult, setUnbanResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [unbanError, setUnbanError] = useState<string | null>(null);

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch('/api/test-resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to resend verification email');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCheckStatus = async () => {
    setIsCheckingStatus(true);
    setStatusResult(null);
    setStatusError(null);

    try {
      const response = await fetch('/api/check-verification-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setStatusResult(data);
      } else {
        setStatusError(data.error || 'Failed to check verification status');
      }
    } catch (err) {
      setStatusError('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsCheckingStatus(false);
    }
  };
  
  const handleCheckDetails = async () => {
    setIsCheckingDetails(true);
    setDetailsResult(null);
    setDetailsError(null);

    try {
      const response = await fetch('/api/check-user-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setDetailsResult(data);
      } else {
        setDetailsError(data.error || 'Failed to check user details');
      }
    } catch (err) {
      setDetailsError('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsCheckingDetails(false);
    }
  };

  const handleUnbanUser = async () => {
    setIsUnbanning(true);
    setUnbanResult(null);
    setUnbanError(null);

    try {
      const response = await fetch('/api/unban-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setUnbanResult(data);
      } else {
        setUnbanError(data.error || 'Failed to unban user');
      }
    } catch (err) {
      setUnbanError('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsUnbanning(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden p-6">
        <h1 className="text-2xl font-bold mb-6">Email Verification Diagnostic Tool</h1>
        
        <form onSubmit={handleResendVerification} className="space-y-4 mb-8">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              placeholder="your@email.com"
              required
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Resend Verification Email'}
            </button>
            
            <button
              type="button"
              onClick={handleCheckStatus}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              disabled={isCheckingStatus}
            >
              {isCheckingStatus ? 'Checking...' : 'Check Status'}
            </button>
            
            <button
              type="button"
              onClick={handleCheckDetails}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              disabled={isCheckingDetails}
            >
              {isCheckingDetails ? 'Loading...' : 'Check Detailed Info'}
            </button>
            
            <button
              type="button"
              onClick={handleUnbanUser}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              disabled={isUnbanning}
            >
              {isUnbanning ? 'Processing...' : 'Fix Account Status'}
            </button>
          </div>
        </form>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-md mb-4">
                {error}
              </div>
            )}
            
            {result && (
              <div className="p-4 bg-green-50 text-green-700 rounded-md mb-4">
                <h3 className="font-medium mb-2">Resend Result:</h3>
                <pre className="text-xs overflow-auto max-h-60 bg-gray-100 p-2 rounded">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
            
            {statusError && (
              <div className="p-4 bg-red-50 text-red-700 rounded-md mb-4">
                {statusError}
              </div>
            )}
            
            {statusResult && (
              <div className="p-4 bg-blue-50 text-blue-700 rounded-md mb-4">
                <h3 className="font-medium mb-2">Status Result:</h3>
                <pre className="text-xs overflow-auto max-h-60 bg-gray-100 p-2 rounded">
                  {JSON.stringify(statusResult, null, 2)}
                </pre>
              </div>
            )}
            
            {unbanError && (
              <div className="p-4 bg-red-50 text-red-700 rounded-md mb-4">
                {unbanError}
              </div>
            )}
            
            {unbanResult && (
              <div className="p-4 bg-yellow-50 text-yellow-700 rounded-md mb-4">
                <h3 className="font-medium mb-2">Account Fix Result:</h3>
                <pre className="text-xs overflow-auto max-h-60 bg-gray-100 p-2 rounded">
                  {JSON.stringify(unbanResult, null, 2)}
                </pre>
                {unbanResult.resetToken && (
                  <div className="mt-3">
                    <p className="font-medium mb-1">Password Reset Link:</p>
                    <a 
                      href={unbanResult.resetToken} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {unbanResult.resetToken}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div>
            {detailsError && (
              <div className="p-4 bg-red-50 text-red-700 rounded-md mb-4">
                {detailsError}
              </div>
            )}
            
            {detailsResult && (
              <div className="p-4 bg-purple-50 text-purple-700 rounded-md">
                <h3 className="font-medium mb-2">User Details:</h3>
                <pre className="text-xs overflow-auto max-h-[500px] bg-gray-100 p-2 rounded">
                  {JSON.stringify(detailsResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
} 