'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SignupForm from "./signup-form";

// Metadata must be in a server component, not in a client component
// export const metadata: Metadata = {
//   title: "Sign Up - PMU Profit System",
//   description: "Create a new account for the PMU Profit System",
// };

// Create a client component that uses useSearchParams
function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/checkout';
  
  // Store the redirect URL in localStorage so we can use it after signup
  useEffect(() => {
    console.log('Storing redirect URL:', redirectTo);
    localStorage.setItem('redirectTo', redirectTo);
  }, [redirectTo]);
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {redirectTo === '/checkout' 
              ? 'To complete your purchase, please create an account first.'
              : 'Join the PMU Profit System and grow your business.'}
          </p>
        </div>
        
        <SignupForm />
      </div>
    </div>
  );
}

// Wrap the component that uses useSearchParams in a Suspense boundary
export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
              Loading...
            </h2>
          </div>
        </div>
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
} 