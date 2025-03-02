'use client';

import React, { useState, useEffect } from 'react';
import { checkSupabaseConnection, logSupabaseDiagnostics } from '@/lib/supabase-utils';
import { AlertCircle, CheckCircle, RefreshCw, ExternalLink, Info } from 'lucide-react';

interface ConnectionStatusProps {
  showDetails?: boolean;
}

export function ConnectionStatus({ showDetails = false }: ConnectionStatusProps) {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Checking connection...');
  const [details, setDetails] = useState<Record<string, any> | undefined>(undefined);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [environmentInfo, setEnvironmentInfo] = useState<{
    protocol: string;
    hostname: string;
    supabaseUrl: string;
    isHttps: boolean;
  } | null>(null);

  const collectEnvironmentInfo = () => {
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not configured';
      const isHttps = protocol === 'https:';

      setEnvironmentInfo({
        protocol,
        hostname,
        supabaseUrl,
        isHttps,
      });

      // Log protocol mismatch warning
      if (isHttps && supabaseUrl.startsWith('http://')) {
        console.warn('Protocol mismatch detected: Site is using HTTPS but Supabase URL is using HTTP');
      }
    }
  };

  const checkConnection = async () => {
    setIsChecking(true);
    setStatus('loading');
    setMessage('Checking connection...');

    try {
      // Collect environment info first
      collectEnvironmentInfo();
      
      // Log diagnostics to console for debugging
      logSupabaseDiagnostics();
      
      // Check the connection
      const result = await checkSupabaseConnection();
      
      if (result.success) {
        setStatus('connected');
        setMessage(result.message);
      } else {
        setStatus('error');
        setMessage(result.message);
      }
      
      setDetails(result.details);
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred while checking the connection');
      setDetails({ error: String(error) });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  // Check for protocol mismatch
  const hasProtocolMismatch = environmentInfo?.isHttps && environmentInfo?.supabaseUrl.startsWith('http://');

  return (
    <div className="rounded-lg border p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {status === 'loading' && (
            <RefreshCw className="h-5 w-5 animate-spin text-yellow-500" />
          )}
          {status === 'connected' && (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
          {status === 'error' && (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
          <h3 className="font-medium">
            {status === 'loading' && 'Checking Supabase Connection...'}
            {status === 'connected' && 'Connected to Supabase'}
            {status === 'error' && 'Supabase Connection Error'}
          </h3>
        </div>
        <button
          onClick={checkConnection}
          disabled={isChecking}
          className="inline-flex items-center justify-center rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground"
        >
          {isChecking ? (
            <>
              <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
              Checking...
            </>
          ) : (
            'Retry'
          )}
        </button>
      </div>
      
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      
      {/* Protocol mismatch warning */}
      {hasProtocolMismatch && (
        <div className="mt-4 rounded-md bg-amber-50 p-3">
          <div className="flex">
            <Info className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-amber-800">Protocol Mismatch Detected</h4>
              <p className="text-sm text-amber-700 mt-1">
                Your site is using HTTPS but your Supabase URL is using HTTP. This can cause connection issues in modern browsers.
              </p>
              <p className="text-sm text-amber-700 mt-2">
                Solution: Update your NEXT_PUBLIC_SUPABASE_URL environment variable to use HTTPS instead of HTTP.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {showDetails && details && status === 'error' && (
        <div className="mt-4 rounded-md bg-red-50 p-3">
          <h4 className="font-medium text-red-800">Troubleshooting Information</h4>
          
          {environmentInfo && (
            <div className="mt-2 text-sm">
              <p className="font-medium text-red-800">Environment:</p>
              <ul className="mt-1 list-disc pl-5 text-red-700">
                <li>Site Protocol: {environmentInfo.protocol}</li>
                <li>Supabase URL: {environmentInfo.supabaseUrl.substring(0, 30)}...</li>
              </ul>
            </div>
          )}
          
          {details.possibleCauses && (
            <div className="mt-2">
              <p className="text-sm font-medium text-red-800">Possible Causes:</p>
              <ul className="mt-1 list-disc pl-5 text-sm text-red-700">
                {details.possibleCauses.map((cause: string, index: number) => (
                  <li key={index}>{cause}</li>
                ))}
              </ul>
            </div>
          )}
          
          {details.recommendation && (
            <div className="mt-2">
              <p className="text-sm font-medium text-red-800">Recommendation:</p>
              <p className="text-sm text-red-700">{details.recommendation}</p>
            </div>
          )}
          
          {details.error && (
            <div className="mt-2">
              <p className="text-sm font-medium text-red-800">Error Details:</p>
              <pre className="mt-1 overflow-x-auto rounded bg-red-100 p-2 text-xs text-red-700">
                {details.error}
              </pre>
            </div>
          )}
        </div>
      )}
      
      {showDetails && status === 'error' && (
        <div className="mt-4">
          <h4 className="text-sm font-medium">Common Solutions:</h4>
          <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
            <li>Check your internet connection</li>
            <li>Verify that your Supabase project is active</li>
            <li>Ensure that the Supabase URL in your environment variables is correct</li>
            <li>If using HTTPS, make sure your Supabase URL also uses HTTPS</li>
            <li>Check if your browser has any extensions blocking the connection</li>
            <li>Try clearing your browser cache and cookies</li>
            <li>
              <a 
                href="https://supabase.com/docs/guides/auth/auth-helpers/nextjs" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center text-blue-600 hover:underline mt-2"
              >
                View Supabase Documentation
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
} 