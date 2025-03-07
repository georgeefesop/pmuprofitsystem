'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';

export default function SessionDebugPage() {
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [middlewareData, setMiddlewareData] = useState<any>(null);
  const [middlewareLoading, setMiddlewareLoading] = useState(true);
  const [middlewareError, setMiddlewareError] = useState<string | null>(null);
  const [localStorageData, setLocalStorageData] = useState<Record<string, string>>({});
  const [cookieData, setCookieData] = useState<string>('');

  // Fetch session data from Supabase
  useEffect(() => {
    async function fetchSessionData() {
      try {
        setLoading(true);
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          setError(error.message);
        } else {
          setSessionData(data.session);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchSessionData();
  }, []);

  // Fetch middleware debug data
  useEffect(() => {
    async function fetchMiddlewareData() {
      try {
        setMiddlewareLoading(true);
        const response = await fetch('/api/debug/middleware');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setMiddlewareData(data);
      } catch (err) {
        setMiddlewareError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setMiddlewareLoading(false);
      }
    }

    fetchMiddlewareData();
  }, []);

  // Get localStorage data
  useEffect(() => {
    const data: Record<string, string> = {};
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        data[key] = localStorage.getItem(key) || '';
      }
    }
    
    setLocalStorageData(data);
    setCookieData(document.cookie);
  }, []);

  // Try to refresh the session
  const handleRefreshSession = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        setError(error.message);
      } else {
        setSessionData(data.session);
        alert('Session refreshed successfully!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Refresh the middleware data
  const handleRefreshMiddlewareData = async () => {
    try {
      setMiddlewareLoading(true);
      const response = await fetch('/api/debug/middleware');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setMiddlewareData(data);
      alert('Middleware data refreshed successfully!');
    } catch (err) {
      setMiddlewareError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setMiddlewareLoading(false);
    }
  };

  // Try to access the dashboard
  const handleAccessDashboard = () => {
    window.location.href = '/dashboard';
  };

  // Add a function to test authentication
  const handleTestAuthentication = async () => {
    try {
      // Test authentication by calling the debug auth API
      const response = await fetch('/api/debug/auth');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      alert(`Authentication test result: ${data.session.exists ? 'Authenticated' : 'Not authenticated'}`);
      console.log('Authentication test result:', data);
    } catch (err) {
      alert(`Error testing authentication: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Add a function to set auth cookies manually
  const handleSetAuthCookies = () => {
    try {
      // Set auth-status cookie
      document.cookie = `auth-status=authenticated; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict${window.location.protocol === 'https:' ? '; Secure' : ''}`;
      
      // Set user ID in localStorage
      localStorage.setItem('auth_user_id', sessionData?.user?.id || 'manual-test-user-id');
      
      alert('Auth cookies set successfully!');
      window.location.reload();
    } catch (err) {
      alert(`Error setting auth cookies: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Add a function to clear auth cookies
  const handleClearAuthCookies = () => {
    try {
      // Clear auth-status cookie
      document.cookie = 'auth-status=; path=/; max-age=0';
      
      // Clear user ID from localStorage
      localStorage.removeItem('auth_user_id');
      
      alert('Auth cookies cleared successfully!');
      window.location.reload();
    } catch (err) {
      alert(`Error clearing auth cookies: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Session Debug Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Client-Side Session</h2>
          {loading ? (
            <p>Loading session data...</p>
          ) : error ? (
            <p className="text-red-500">Error: {error}</p>
          ) : (
            <div>
              <p>Session exists: {sessionData ? 'Yes' : 'No'}</p>
              {sessionData && (
                <div>
                  <p>User ID: {sessionData.user.id}</p>
                  <p>Email: {sessionData.user.email}</p>
                  <p>Expires at: {new Date(sessionData.expires_at * 1000).toLocaleString()}</p>
                  <p>Expired: {sessionData.expires_at * 1000 < Date.now() ? 'Yes' : 'No'}</p>
                </div>
              )}
              <button 
                onClick={handleRefreshSession}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Refresh Session
              </button>
            </div>
          )}
        </div>
        
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Server-Side Session (Middleware)</h2>
          {middlewareLoading ? (
            <p>Loading middleware data...</p>
          ) : middlewareError ? (
            <p className="text-red-500">Error: {middlewareError}</p>
          ) : (
            <div>
              <p>Session exists: {middlewareData.session.exists ? 'Yes' : 'No'}</p>
              {middlewareData.session.exists && (
                <div>
                  <p>User ID: {middlewareData.session.user.id}</p>
                  <p>Email: {middlewareData.session.user.email}</p>
                  <p>Expires at: {middlewareData.session.expires_at}</p>
                  <p>Expired: {middlewareData.session.is_expired ? 'Yes' : 'No'}</p>
                </div>
              )}
              <p className="mt-2">Entitlements: {middlewareData.entitlements.count}</p>
              <p>Purchases: {middlewareData.purchases.count}</p>
              <button 
                onClick={handleRefreshMiddlewareData}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Refresh Middleware Data
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-4 bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-2">Cookies</h2>
        <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-40">
          {cookieData || 'No cookies found'}
        </pre>
      </div>
      
      <div className="mt-4 bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-2">Local Storage</h2>
        <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-40">
          {JSON.stringify(localStorageData, null, 2)}
        </pre>
      </div>
      
      <div className="mt-4 bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-2">Actions</h2>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleAccessDashboard}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Access Dashboard
          </button>
          <button 
            onClick={handleTestAuthentication}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test Authentication
          </button>
          <button 
            onClick={handleSetAuthCookies}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Set Auth Cookies
          </button>
          <button 
            onClick={handleClearAuthCookies}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Clear Auth Cookies
          </button>
          <a 
            href="/login" 
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 inline-block"
          >
            Go to Login
          </a>
          <a 
            href="/" 
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 inline-block"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    </div>
  );
} 