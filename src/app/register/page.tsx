'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to checkout page
    router.replace('/checkout');
  }, [router]);
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-4">Redirecting to Checkout...</h1>
        <p className="text-gray-600">
          To create an account, please purchase the PMU Profit System.
        </p>
      </div>
    </div>
  );
} 