'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { ConnectionStatus } from '@/components/ui/connection-status';
import Link from 'next/link';

export default function DiagnosticsPage() {
  const { user, isLoading } = useAuth();
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAuthStatus = async () => {
    try {
      setIsRunning(true);
      const email = 'test@example.com';
      const response = await fetch(`/api/test-auth-status?email=${email}`);
      const data = await response.json();
      setAuthStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsRunning(false);
    }
  };

  const runDiagnostics = async () => {
    try {
      setIsRunning(true);
      setError(null);
      
      // Fetch diagnostics from API
      const response = await fetch('/api/create-test-api');
      const data = await response.json();
      setDiagnostics(data);
      
      // Also check auth status
      await fetchAuthStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            System Diagnostics
          </h1>
          <p className="mt-3 text-xl text-gray-500">
            Check the status of your system components
          </p>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-gray-900">System Status</h2>
              <p className="mt-1 text-sm text-gray-500">
                Diagnostics for Supabase, Stripe, and other services
              </p>
            </div>
            <button
              onClick={runDiagnostics}
              disabled={isRunning}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isRunning ? 'Running...' : 'Run Diagnostics'}
            </button>
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-50 text-red-700 border-t border-b border-red-200">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {diagnostics ? (
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Environment</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {diagnostics.environment} (Server Time: {new Date(diagnostics.timestamp).toLocaleString()})
                  </dd>
                </div>

                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Supabase Status</dt>
                  <dd className="mt-1 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      diagnostics.supabase.connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {diagnostics.supabase.connected ? 'Connected' : 'Disconnected'}
                    </span>
                    {diagnostics.supabase.error && (
                      <p className="mt-1 text-red-600">{diagnostics.supabase.error}</p>
                    )}
                    {diagnostics.supabase.details && (
                      <div className="mt-2 text-xs text-gray-500">
                        <pre className="p-2 bg-gray-50 rounded overflow-auto">
                          {JSON.stringify(diagnostics.supabase.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </dd>
                </div>

                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Stripe Status</dt>
                  <dd className="mt-1 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      diagnostics.stripe.connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {diagnostics.stripe.connected ? 'Connected' : 'Disconnected'}
                    </span>
                    {diagnostics.stripe.error && (
                      <p className="mt-1 text-red-600">{diagnostics.stripe.error}</p>
                    )}
                    {diagnostics.stripe.details && (
                      <div className="mt-2 text-xs text-gray-500">
                        <pre className="p-2 bg-gray-50 rounded overflow-auto">
                          {JSON.stringify(diagnostics.stripe.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </dd>
                </div>

                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Environment Variables</dt>
                  <dd className="mt-1 text-sm">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Variable
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Value
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {Object.entries(diagnostics.environmentVariables).map(([key, value]: [string, any]) => (
                            <tr key={key}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {key}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  value.exists ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {value.exists ? 'Set' : 'Missing'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {value.value}
                                {value.protocol && ` (${value.protocol})`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </dd>
                </div>

                {diagnostics.protocolMismatch && (
                  <div className="sm:col-span-2">
                    <div className="rounded-md bg-yellow-50 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800">Protocol Mismatch Detected</h3>
                          <div className="mt-2 text-sm text-yellow-700">
                            <p>Your site is using HTTPS but Supabase URL is using HTTP. This can cause connection issues.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {diagnostics.recommendations && diagnostics.recommendations.length > 0 && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Recommendations</dt>
                    <dd className="mt-1 text-sm">
                      <ul className="list-disc pl-5 space-y-1 text-gray-700">
                        {diagnostics.recommendations.map((rec: string, i: number) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          ) : (
            <div className="px-4 py-5 sm:p-6 text-center">
              <p className="text-gray-500">
                {isRunning ? 'Running diagnostics...' : 'No diagnostic data available'}
              </p>
            </div>
          )}
        </div>

        {authStatus && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">Authentication Status</h2>
              <p className="mt-1 text-sm text-gray-500">
                Test user authentication status
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <pre className="p-4 bg-gray-50 rounded overflow-auto text-xs">
                {JSON.stringify(authStatus, null, 2)}
              </pre>
            </div>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Current User</h2>
            <p className="mt-1 text-sm text-gray-500">
              Information about the currently logged in user
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            {isLoading ? (
              <p className="text-gray-500">Loading user data...</p>
            ) : user ? (
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">User ID</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.id}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.full_name || 'Not set'}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-gray-500">No user is currently logged in</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 