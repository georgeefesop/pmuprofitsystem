'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CoursesRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/dashboard/modules');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
        <p className="text-gray-600">Please wait while we redirect you to the modules page.</p>
      </div>
    </div>
  );
} 