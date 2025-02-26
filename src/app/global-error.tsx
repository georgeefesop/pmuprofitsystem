'use client';

import React, { useEffect } from 'react';
import { captureError, ErrorType } from '@/lib/error-handler';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to our error handling system
    captureError(
      error,
      ErrorType.ROUTE,
      'Global Error Handler (Root)'
    );
    
    // Log the error to the console
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong!</h1>
            <p className="text-gray-600 mb-6">
              We've encountered a critical error. Please try refreshing the page.
            </p>
            
            <div className="bg-red-50 p-4 rounded-md mb-6 text-left">
              <p className="text-red-800 font-medium mb-2">Error details:</p>
              <p className="text-red-700 text-sm font-mono overflow-auto">{error.message}</p>
              {error.digest && (
                <p className="text-red-700 text-sm font-mono mt-2">Digest: {error.digest}</p>
              )}
              {error.stack && (
                <details className="mt-2">
                  <summary className="text-red-700 text-sm cursor-pointer">Stack trace</summary>
                  <pre className="text-red-700 text-xs mt-2 overflow-auto p-2 bg-red-100 rounded">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
            
            <button
              onClick={reset}
              className="w-full bg-purple-600 text-white font-semibold py-3 px-6 rounded-md hover:bg-purple-700 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
} 