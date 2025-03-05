"use client";

import { ReactNode, Suspense } from "react";

interface ClientWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Wraps client components that use useSearchParams() in a Suspense boundary
 * to prevent hydration errors and improve performance.
 * 
 * @param children The client component that uses useSearchParams
 * @param fallback Optional fallback UI to show while loading
 */
export default function ClientWrapper({ 
  children, 
  fallback = <div className="w-full h-full flex items-center justify-center p-4">
    <div className="animate-pulse flex space-x-2">
      <div className="h-3 w-3 bg-purple-500 rounded-full"></div>
      <div className="h-3 w-3 bg-purple-500 rounded-full"></div>
      <div className="h-3 w-3 bg-purple-500 rounded-full"></div>
    </div>
  </div>
}: ClientWrapperProps) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
} 