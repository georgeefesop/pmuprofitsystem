'use client';

import React, { useState, useEffect } from 'react';
import { checkSupabaseConnection, logSupabaseDiagnostics } from '@/lib/supabase-utils';
import { AlertCircle, CheckCircle, RefreshCw, ExternalLink, Info, Loader2 } from 'lucide-react';

interface ConnectionStatusProps {
  showDetails?: boolean;
}

export function ConnectionStatus({ showDetails = false }: ConnectionStatusProps) {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Checking connection...');
  const [details, setDetails] = useState<Record<string, any> | undefined>(undefined);
  const [isChecking, setIsChecking] = useState(false);
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
      
      // Log diagnostics to console
      logSupabaseDiagnostics();
      
      // Check connection
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
      setMessage('Error checking connection');
      setDetails({ error: error instanceof Error ? error.message : String(error) });
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
    <div className="p-4 border rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Supabase Connection Status</h3>
        <button 
          onClick={checkConnection}
          disabled={isChecking}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Refresh connection status"
        >
          {isChecking ? (
            <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
          ) : (
            <RefreshCw className="h-5 w-5 text-gray-500" />
          )}
        </button>
      </div>
      
      <div className="flex items-center gap-2 mb-2">
        {status === 'loading' && (
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
        )}
        {status === 'connected' && (
          <CheckCircle className="h-5 w-5 text-green-500" />
        )}
        {status === 'error' && (
          <AlertCircle className="h-5 w-5 text-red-500" />
        )}
        
        <span className={`font-medium ${
          status === 'connected' ? 'text-green-600' : 
          status === 'error' ? 'text-red-600' : 
          'text-blue-600'
        }`}>
          {status === 'connected' ? 'Connected' : 
           status === 'error' ? 'Connection Error' : 
           'Checking...'}
        </span>
      </div>
      
      <p className="text-gray-600 mb-4">{message}</p>
      
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
      
      {(status === 'error' || showDetails) && details && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Troubleshooting Information</h4>
          
          {environmentInfo && (
            <div className="mb-3">
              <h5 className="text-sm font-medium text-gray-700">Environment:</h5>
              <ul className="list-disc pl-5 text-sm text-gray-600">
                <li>Site Protocol: {environmentInfo.protocol}</li>
                <li>Supabase URL: {environmentInfo.supabaseUrl.substring(0, 30)}...</li>
              </ul>
            </div>
          )}
          
          {details.possibleCauses && (
            <div className="mb-3">
              <h5 className="text-sm font-medium text-gray-700">Possible Causes:</h5>
              <ul className="list-disc pl-5 text-sm text-gray-600">
                {details.possibleCauses.map((cause: string, index: number) => (
                  <li key={index}>{cause}</li>
                ))}
              </ul>
            </div>
          )}
          
          {details.recommendation && (
            <div className="mb-3">
              <h5 className="text-sm font-medium text-gray-700">Recommendation:</h5>
              <p className="text-sm text-gray-600">{details.recommendation}</p>
            </div>
          )}
          
          <div className="mt-4">
            <h5 className="text-sm font-medium text-gray-700">Common Solutions:</h5>
            <ul className="list-disc pl-5 text-sm text-gray-600">
              <li>Check your internet connection</li>
              <li>Verify that your Supabase project is active</li>
              <li>Ensure your Supabase URL and API keys are correct</li>
              <li>Try disabling any VPN or proxy services</li>
              <li>Check if your firewall is blocking the connection</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
} 