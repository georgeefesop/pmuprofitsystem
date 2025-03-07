import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export function AuthDebug() {
  const { user, isLoading } = useAuth();
  const [authState, setAuthState] = useState<any>(null);
  const [entitlements, setEntitlements] = useState<any[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  
  useEffect(() => {
    if (user && !isChecking) {
      setIsChecking(true);
      
      // Check auth state
      fetch('/api/debug/auth-state')
        .then(res => res.json())
        .then(data => {
          console.log('Auth debug data:', data);
          setAuthState(data);
          setEntitlements(data.entitlements || []);
        })
        .catch(err => {
          console.error('Error fetching auth debug data:', err);
        })
        .finally(() => {
          setIsChecking(false);
        });
    }
  }, [user, isChecking]);
  
  if (isLoading) {
    return <div className="p-4 bg-yellow-100 text-yellow-800 rounded">Loading authentication state...</div>;
  }
  
  if (!user) {
    return <div className="p-4 bg-red-100 text-red-800 rounded">Not authenticated</div>;
  }
  
  return (
    <div className="p-4 bg-blue-50 text-blue-800 rounded">
      <h3 className="font-bold">Auth Debug Info</h3>
      <p>User ID: {user.id}</p>
      <p>Email: {user.email}</p>
      <p>Entitlements: {entitlements.length}</p>
      
      {entitlements.length > 0 ? (
        <div className="mt-2">
          <h4 className="font-semibold">Active Entitlements:</h4>
          <ul className="list-disc pl-5">
            {entitlements.map((ent: any) => (
              <li key={ent.id}>
                Product ID: {ent.product_id}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-2 text-red-600">No active entitlements found</p>
      )}
      
      <div className="mt-4">
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
} 