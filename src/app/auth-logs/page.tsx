'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AuthLog {
  timestamp: string;
  userId?: string;
  event: string;
  details: any;
  path: string;
  success: boolean;
}

export default function AuthLogsPage() {
  const [logs, setLogs] = useState<AuthLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [successFilter, setSuccessFilter] = useState<boolean | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const router = useRouter();

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth-logs');
      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setLogs(data.logs || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();

    // Set up auto-refresh if enabled
    let intervalId: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      intervalId = setInterval(fetchLogs, 5000); // Refresh every 5 seconds
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh]);

  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === '' || 
      log.event.toLowerCase().includes(filter.toLowerCase()) ||
      log.path.toLowerCase().includes(filter.toLowerCase()) ||
      JSON.stringify(log.details).toLowerCase().includes(filter.toLowerCase());
    
    const matchesUserId = userIdFilter === '' || 
      (log.userId && log.userId.includes(userIdFilter));
    
    const matchesSuccess = successFilter === null || 
      log.success === successFilter;
    
    return matchesFilter && matchesUserId && matchesSuccess;
  });

  const clearFilters = () => {
    setFilter('');
    setUserIdFilter('');
    setSuccessFilter(null);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString() + ' ' + date.toLocaleDateString();
  };

  const getEventColor = (event: string, success: boolean) => {
    if (!success) return 'text-red-600';
    
    if (event.includes('ERROR') || event.includes('EXCEPTION')) return 'text-red-600';
    if (event.includes('WARN')) return 'text-yellow-600';
    if (event.includes('REDIRECT')) return 'text-orange-600';
    if (event.includes('ALLOWING') || event.includes('CREATED') || 
        event.includes('FOUND') || event.includes('HAS_')) return 'text-green-600';
    
    return 'text-blue-600';
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Authentication Logs</h1>
        <div className="space-x-2">
          <button 
            onClick={fetchLogs} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button 
            onClick={() => setAutoRefresh(!autoRefresh)} 
            className={`px-4 py-2 ${autoRefresh ? 'bg-green-600' : 'bg-gray-600'} text-white rounded hover:bg-opacity-90`}
          >
            {autoRefresh ? 'Auto-Refresh: ON' : 'Auto-Refresh: OFF'}
          </button>
          <button 
            onClick={() => router.push('/')} 
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Back to Home
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Event/Path Filter</label>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by event or path..."
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">User ID Filter</label>
          <input
            type="text"
            value={userIdFilter}
            onChange={(e) => setUserIdFilter(e.target.value)}
            placeholder="Filter by user ID..."
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Success Filter</label>
          <select
            value={successFilter === null ? '' : successFilter.toString()}
            onChange={(e) => {
              if (e.target.value === '') {
                setSuccessFilter(null);
              } else {
                setSuccessFilter(e.target.value === 'true');
              }
            }}
            className="w-full p-2 border rounded"
          >
            <option value="">All</option>
            <option value="true">Success</option>
            <option value="false">Failure</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={clearFilters}
            className="w-full p-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Path</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    {loading ? 'Loading logs...' : 'No logs found matching the current filters.'}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getEventColor(log.event, log.success)}`}>
                      {log.event}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.userId ? log.userId.substring(0, 8) + '...' : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.path.length > 30 ? log.path.substring(0, 30) + '...' : log.path}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <details>
                        <summary className="cursor-pointer">View Details</summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        Showing {filteredLogs.length} of {logs.length} logs
      </div>
    </div>
  );
} 