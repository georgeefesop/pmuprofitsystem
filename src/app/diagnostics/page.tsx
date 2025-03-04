'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { ConnectionStatus } from '@/components/ui/connection-status';
import Link from 'next/link';

export default function DiagnosticsPage() {
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAuthStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/test-auth-status?email=test@example.com');
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      setAuthStatus(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch auth status');
      console.error('Error fetching auth status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthStatus();
  }, []);

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Link href="/" className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-bold">Supabase Diagnostics</h1>
        </div>
        <Button 
          onClick={fetchAuthStatus} 
          disabled={loading}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="mb-8">
        <ConnectionStatus showDetails={true} />
      </div>
      
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full rounded-lg" />
        </div>
      ) : authStatus ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Environment Information</CardTitle>
              <CardDescription>Details about the current environment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium">Supabase URL:</span>
                <span className="text-gray-600 font-mono text-sm">{process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Anon Key Present:</span>
                <Badge variant={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'default' : 'destructive'}>
                  {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Service Key Present:</span>
                <Badge variant={process.env.SUPABASE_SERVICE_ROLE_KEY ? 'default' : 'destructive'}>
                  {process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Protocol:</span>
                <span className="text-gray-600">
                  {typeof window !== 'undefined' ? window.location.protocol : 'N/A'}
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>API Test Results</CardTitle>
              <CardDescription>Results from test-auth-status API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium">API Response:</span>
                <Badge variant={authStatus.success ? 'default' : 'destructive'}>
                  {authStatus.success ? 'Success' : 'Failed'}
                </Badge>
              </div>
              
              {authStatus.userStatus && (
                <div>
                  <h3 className="font-medium mb-2">User Status:</h3>
                  <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
                    {JSON.stringify(authStatus.userStatus, null, 2)}
                  </pre>
                </div>
              )}
              
              {authStatus.error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTitle>API Error</AlertTitle>
                  <AlertDescription className="font-mono text-sm">
                    {authStatus.error}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
      
      <div className="mt-10 p-6 border rounded-lg bg-gray-50">
        <h2 className="text-xl font-semibold mb-4">Troubleshooting Steps</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Ensure your Supabase URL and API keys are correctly set in your environment variables</li>
          <li>Check that your Supabase project is active and not paused</li>
          <li>Verify that your network can resolve the Supabase domain (no DNS issues)</li>
          <li>If using HTTPS for your site, ensure your Supabase URL also uses HTTPS</li>
          <li>Check if your firewall or security software is blocking the connection</li>
          <li>Try disabling any VPN or proxy services that might interfere with the connection</li>
        </ol>
      </div>
    </div>
  );
} 