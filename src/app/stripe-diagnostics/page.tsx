'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

export default function StripeDiagnosticsPage() {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDiagnostics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/stripe-diagnostics');
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      setDiagnostics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch diagnostics');
      console.error('Error fetching diagnostics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  const renderStatus = (condition: boolean, successText: string, errorText: string) => (
    <div className="flex items-center gap-2">
      {condition ? (
        <>
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span className="text-green-700">{successText}</span>
        </>
      ) : (
        <>
          <XCircle className="h-5 w-5 text-red-500" />
          <span className="text-red-700">{errorText}</span>
        </>
      )}
    </div>
  );

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Stripe Diagnostics</h1>
        <Button 
          onClick={fetchDiagnostics} 
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
      
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full rounded-lg" />
          <Skeleton className="h-[200px] w-full rounded-lg" />
        </div>
      ) : diagnostics ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Environment Information</CardTitle>
              <CardDescription>Details about the current environment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium">Node Environment:</span>
                <Badge variant={diagnostics.environment === 'production' ? 'default' : 'outline'}>
                  {diagnostics.environment}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Vercel Environment:</span>
                <Badge variant={diagnostics.vercelEnvironment === 'production' ? 'default' : 'outline'}>
                  {diagnostics.vercelEnvironment}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Timestamp:</span>
                <span className="text-gray-600">{new Date(diagnostics.timestamp).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Stripe Configuration</CardTitle>
              <CardDescription>Status of Stripe API keys</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-medium">Secret Key:</span>
                  <span className="font-mono text-sm">
                    {diagnostics.stripeConfiguration.secretKey.masked}
                  </span>
                </div>
                {renderStatus(
                  diagnostics.stripeConfiguration.secretKey.present && 
                  diagnostics.stripeConfiguration.secretKey.valid,
                  "Valid secret key",
                  "Invalid or missing secret key"
                )}
                {diagnostics.stripeConfiguration.secretKey.hasWhitespace && (
                  <div className="mt-1 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="text-amber-700 text-sm">Contains whitespace</span>
                  </div>
                )}
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-medium">Publishable Key:</span>
                  <span className="font-mono text-sm">
                    {diagnostics.stripeConfiguration.publishableKey.masked}
                  </span>
                </div>
                {renderStatus(
                  diagnostics.stripeConfiguration.publishableKey.present && 
                  diagnostics.stripeConfiguration.publishableKey.valid,
                  "Valid publishable key",
                  "Invalid or missing publishable key"
                )}
                {diagnostics.stripeConfiguration.publishableKey.hasWhitespace && (
                  <div className="mt-1 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="text-amber-700 text-sm">Contains whitespace</span>
                  </div>
                )}
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-medium">Webhook Secret:</span>
                  <span className="font-mono text-sm">
                    {diagnostics.stripeConfiguration.webhookSecret.masked}
                  </span>
                </div>
                {renderStatus(
                  diagnostics.stripeConfiguration.webhookSecret.present && 
                  diagnostics.stripeConfiguration.webhookSecret.valid,
                  "Valid webhook secret",
                  "Invalid or missing webhook secret"
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Stripe Connection Status</CardTitle>
              <CardDescription>Results of connecting to Stripe API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderStatus(
                diagnostics.stripeStatus.initialized,
                "Stripe client initialized successfully",
                "Failed to initialize Stripe client"
              )}
              
              {diagnostics.stripeStatus.error ? (
                <Alert variant="destructive" className="mt-4">
                  <AlertTitle>Stripe Error</AlertTitle>
                  <AlertDescription className="font-mono text-sm">
                    {diagnostics.stripeStatus.error.type && (
                      <div>Type: {diagnostics.stripeStatus.error.type}</div>
                    )}
                    {diagnostics.stripeStatus.error.code && (
                      <div>Code: {diagnostics.stripeStatus.error.code}</div>
                    )}
                    <div>Message: {diagnostics.stripeStatus.error.message}</div>
                  </AlertDescription>
                </Alert>
              ) : diagnostics.stripeStatus.balance ? (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Balance Information:</h3>
                  <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
                    {JSON.stringify(diagnostics.stripeStatus.balance, null, 2)}
                  </pre>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}
      
      <div className="mt-10 p-6 border rounded-lg bg-gray-50">
        <h2 className="text-xl font-semibold mb-4">Troubleshooting Steps</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Ensure your Stripe API keys are correctly set in your Vercel environment variables</li>
          <li>Check that your keys don't have any leading or trailing whitespace</li>
          <li>Verify that you're using the correct keys for your environment (test vs. production)</li>
          <li>Make sure your Stripe account is active and in good standing</li>
          <li>If using test mode, ensure your test clock is not paused</li>
          <li>Check Stripe's status page for any ongoing service issues</li>
        </ol>
      </div>
    </div>
  );
} 