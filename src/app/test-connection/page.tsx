'use client';

import { ConnectionStatus } from '@/components/ui/connection-status';

export default function TestConnectionPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Supabase Connection Test</h1>
      <p className="mb-6">
        This page tests the connection to your Supabase project. If you're experiencing issues with authentication or data access, 
        this can help diagnose the problem.
      </p>
      
      <div className="mb-8">
        <ConnectionStatus />
      </div>
      
      <div className="p-4 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-medium mb-2">Environment Information</h2>
        <p className="mb-2">
          <strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL}
        </p>
        <p className="mb-2">
          <strong>Site URL:</strong> {process.env.NEXT_PUBLIC_SITE_URL}
        </p>
        <p className="mb-2">
          <strong>Environment:</strong> {process.env.NODE_ENV}
        </p>
      </div>
    </div>
  );
} 