'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ConnectionStatus } from '@/components/ui/connection-status';
import { checkSupabaseConnection, logSupabaseDiagnostics, attemptSupabaseConnectionFix } from '@/lib/supabase-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, ArrowLeft, ExternalLink, Wifi, WifiOff } from 'lucide-react';
import { isProduction, shouldRenderDiagnostics } from './config';

export default function DiagnosticsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('connection');
  const [connectionStatus, setConnectionStatus] = useState<{
    status: 'loading' | 'connected' | 'error';
    message: string;
    details?: string;
  }>({
    status: 'loading',
    message: 'Checking connection...',
  });
  const [isFixing, setIsFixing] = useState(false);
  const [fixResult, setFixResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [environmentInfo, setEnvironmentInfo] = useState<{
    protocol: string;
    hostname: string;
    supabaseUrl: string;
    isHttps: boolean;
    userAgent: string;
  } | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    // Only run diagnostics in development
    if (shouldRenderDiagnostics) {
      checkConnection();
    }
    
    collectEnvironmentInfo();
    
    // Set initial online status
    setIsOnline(navigator.onLine);
    
    // Add event listeners for online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      // Automatically recheck connection when coming back online
      checkConnection();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkConnection = async () => {
    setConnectionStatus({
      status: 'loading',
      message: 'Checking connection...',
    });
    
    try {
      const result = await checkSupabaseConnection();
      
      if (result.success) {
        setConnectionStatus({
          status: 'connected',
          message: 'Successfully connected to Supabase',
          details: typeof result.details === 'string' ? result.details : JSON.stringify(result.details),
        });
      } else {
        setConnectionStatus({
          status: 'error',
          message: result.message || 'Failed to connect to Supabase',
          details: typeof result.details === 'string' ? result.details : JSON.stringify(result.details),
        });
      }
      
      // Log diagnostics regardless of connection status
      logSupabaseDiagnostics();
    } catch (error) {
      setConnectionStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        details: 'Check the console for more details',
      });
      console.error('Error checking connection:', error);
    }
  };

  const collectEnvironmentInfo = () => {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not configured';
    const isHttps = protocol === 'https:';
    const userAgent = navigator.userAgent;

    setEnvironmentInfo({
      protocol,
      hostname,
      supabaseUrl,
      isHttps,
      userAgent,
    });
  };

  const attemptFix = async () => {
    setIsFixing(true);
    setFixResult(null);
    
    try {
      const result = await attemptSupabaseConnectionFix();
      
      setFixResult({
        success: result.success,
        message: result.message,
      });
      
      // If fix was successful, recheck connection
      if (result.success) {
        setTimeout(() => {
          checkConnection();
        }, 1000);
      }
    } catch (error) {
      setFixResult({
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    } finally {
      setIsFixing(false);
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus.status) {
      case 'connected':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'error':
        return <XCircle className="h-8 w-8 text-red-500" />;
      case 'loading':
      default:
        return <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {isProduction ? (
        <Card className="w-full max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Access Denied</CardTitle>
            <CardDescription>
              Diagnostic tools are only available in development environment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Restricted Access</AlertTitle>
              <AlertDescription>
                For security reasons, the diagnostics page is not available in production.
                Please run the application in development mode to access these tools.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Home
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">System Diagnostics</h1>
              <p className="text-gray-500 mt-1">Troubleshoot and diagnose system issues</p>
            </div>
            <Button variant="outline" onClick={() => router.push('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="connection">Connection</TabsTrigger>
              <TabsTrigger value="environment">Environment</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
            </TabsList>
            
            {/* Connection Tab Content */}
            <TabsContent value="connection">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {getStatusIcon()}
                    <span className="ml-2">Supabase Connection Status</span>
                  </CardTitle>
                  <CardDescription>
                    Check if your application can connect to Supabase services
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Alert variant={connectionStatus.status === 'connected' ? 'default' : 'destructive'}>
                      <AlertTitle>{connectionStatus.message}</AlertTitle>
                      {connectionStatus.details && (
                        <AlertDescription className="mt-2">
                          {connectionStatus.details}
                        </AlertDescription>
                      )}
                    </Alert>
                    
                    <ConnectionStatus showDetails={true} />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button onClick={checkConnection} disabled={connectionStatus.status === 'loading'}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Recheck Connection
                  </Button>
                  <Button 
                    onClick={attemptFix} 
                    disabled={connectionStatus.status === 'connected' || isFixing || !isOnline}
                    variant={connectionStatus.status === 'error' ? 'default' : 'outline'}
                  >
                    {isFixing ? 'Attempting Fix...' : 'Attempt Auto-Fix'}
                  </Button>
                </CardFooter>
              </Card>
              
              {fixResult && (
                <Alert 
                  className="mt-4" 
                  variant={fixResult.success ? 'default' : 'destructive'}
                >
                  <AlertTitle>
                    {fixResult.success ? 'Fix Applied' : 'Fix Failed'}
                  </AlertTitle>
                  <AlertDescription>{fixResult.message}</AlertDescription>
                </Alert>
              )}
            </TabsContent>
            
            {/* Environment Tab Content */}
            <TabsContent value="environment">
              <Card>
                <CardHeader>
                  <CardTitle>Environment Information</CardTitle>
                  <CardDescription>
                    Details about your current environment that may affect connectivity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {environmentInfo ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="font-medium">Protocol:</div>
                        <div className="flex items-center">
                          {environmentInfo.protocol}
                          {!environmentInfo.isHttps && (
                            <AlertTriangle className="h-4 w-4 ml-2 text-amber-500" />
                          )}
                        </div>
                        
                        <div className="font-medium">Hostname:</div>
                        <div>{environmentInfo.hostname}</div>
                        
                        <div className="font-medium">Supabase URL:</div>
                        <div className="break-all">{environmentInfo.supabaseUrl}</div>
                        
                        <div className="font-medium">HTTPS Enabled:</div>
                        <div className="flex items-center">
                          {environmentInfo.isHttps ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                              Yes
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 mr-2 text-red-500" />
                              No
                            </>
                          )}
                        </div>
                        
                        <div className="font-medium">Network Status:</div>
                        <div className="flex items-center">
                          {isOnline ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                              Online
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 mr-2 text-red-500" />
                              Offline
                            </>
                          )}
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h3 className="font-medium mb-2">Browser Information:</h3>
                        <p className="text-sm text-gray-600 break-all">{environmentInfo.userAgent}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto" />
                      <p className="mt-2">Loading environment information...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* System Tab Content */}
            <TabsContent value="system">
              <Card>
                <CardHeader>
                  <CardTitle>Troubleshooting Guide</CardTitle>
                  <CardDescription>
                    Common issues and solutions for connection problems
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Common Connection Issues</h3>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>
                          <strong>DNS Resolution Errors:</strong> Your browser cannot resolve the Supabase domain name.
                          Try using a different DNS server or check your network connection.
                        </li>
                        <li>
                          <strong>HTTPS/HTTP Mismatch:</strong> The application is using HTTPS but trying to connect to Supabase via HTTP.
                          Ensure your Supabase URL uses HTTPS if your site is served over HTTPS.
                        </li>
                        <li>
                          <strong>Firewall or Network Restrictions:</strong> Your network might be blocking connections to Supabase.
                          Try using a different network or check with your network administrator.
                        </li>
                        <li>
                          <strong>Incorrect Environment Variables:</strong> The Supabase URL or API key might be incorrectly configured.
                          Contact the site administrator to verify the configuration.
                        </li>
                      </ul>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Steps to Resolve</h3>
                      <ol className="list-decimal pl-5 space-y-2">
                        <li>Refresh the page and try again</li>
                        <li>Clear your browser cache and cookies</li>
                        <li>Try using a different browser</li>
                        <li>Check if you can access other websites</li>
                        <li>Try using a different network connection (e.g., switch from Wi-Fi to mobile data)</li>
                        <li>Contact support if the issue persists</li>
                      </ol>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Additional Resources</h3>
                      <div className="space-y-2">
                        <Link 
                          href="https://supabase.com/docs/guides/auth/auth-helpers/nextjs" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 hover:underline"
                        >
                          Supabase Auth Documentation
                          <ExternalLink className="h-4 w-4 ml-1" />
                        </Link>
                        <Link 
                          href="https://nextjs.org/docs/app/building-your-application/deploying" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 hover:underline"
                        >
                          Next.js Deployment Guide
                          <ExternalLink className="h-4 w-4 ml-1" />
                        </Link>
                        <Link 
                          href="/docs/TROUBLESHOOTING.md" 
                          target="_blank"
                          className="flex items-center text-blue-600 hover:underline"
                        >
                          PMU Profit System Troubleshooting Guide
                          <ExternalLink className="h-4 w-4 ml-1" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => router.push('/contact')} variant="outline">
                    Contact Support
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
} 