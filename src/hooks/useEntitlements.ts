import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/utils/supabase/client';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  type: string;
  currency: string;
  active: boolean;
  metadata?: any;
}

interface Entitlement {
  id: string;
  user_id: string;
  product_id: string;
  source_type: string;
  source_id: string;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  products: Product;
}

interface Purchase {
  id: string;
  user_id: string;
  product_id: string;
  status: string;
  created_at: string;
}

interface UseEntitlementsResult {
  entitlements: Entitlement[];
  isLoading: boolean;
  error: string | null;
  hasActiveEntitlements: boolean;
  hasPurchases: boolean;
  purchases: Purchase[];
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch user entitlements from the API
 * This uses the service role client on the backend to bypass RLS
 */
export function useEntitlements(): UseEntitlementsResult {
  const { user, isLoading: authLoading } = useAuth();
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchEntitlements = useCallback(async () => {
    if (!user) {
      setEntitlements([]);
      setPurchases([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('useEntitlements: Fetching entitlements from API for user:', user.id);
      
      // First try to get the session token to ensure we're authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      // Include the user ID in the URL to ensure it's available even if cookies fail
      const url = `/api/user-entitlements?userId=${encodeURIComponent(user.id)}`;
      
      // Add a timestamp and random component to prevent caching
      const timestamp = new Date().getTime();
      const randomId = Math.random().toString(36).substring(2, 15);
      const urlWithTimestamp = `${url}&_t=${timestamp}&_r=${randomId}`;
      
      const response = await fetch(urlWithTimestamp, {
        headers: {
          'x-user-id': user.id, // Include in headers for middleware
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        // Add cache: 'no-store' to prevent caching
        cache: 'no-store',
      });
      
      if (!response.ok) {
        let errorMessage = 'Failed to fetch entitlements';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          // If we can't parse the JSON, just use the status text
          errorMessage = `${errorMessage}: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('useEntitlements: Received data from API:', {
        authenticated: data.authenticated,
        entitlementCount: data.entitlementCount,
        hasPurchases: !!data.purchases?.length,
      });
      
      // Log the full entitlements data for debugging
      console.log('useEntitlements: Full entitlements data:', data.entitlements);
      
      // Filter out any entitlements that don't have a valid product_id
      const validEntitlements = (data.entitlements || []).filter((e: Entitlement) => {
        if (!e.product_id) {
          console.warn('useEntitlements: Found entitlement without product_id:', e.id);
          return false;
        }
        return true;
      });
      
      setEntitlements(validEntitlements);
      setPurchases(data.purchases || []);
      
      // If we have purchases but no entitlements, we might need to create them
      if (data.purchases?.length > 0 && (!data.entitlements || data.entitlements.length === 0)) {
        console.log('useEntitlements: User has purchases but no entitlements, creating them');
        
        // Call the API to create entitlements from purchases
        try {
          const createResponse = await fetch(`/api/create-entitlements-from-purchases?userId=${user.id}`, {
            method: 'POST',
            headers: {
              'x-user-id': user.id,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId: user.id })
          });
          
          if (createResponse.ok) {
            const createData = await createResponse.json();
            console.log('useEntitlements: Created entitlements:', createData);
            
            // Refetch entitlements after creating them
            setTimeout(() => fetchEntitlements(), 1000);
          } else {
            console.error('useEntitlements: Failed to create entitlements:', await createResponse.text());
          }
        } catch (createError) {
          console.error('useEntitlements: Error creating entitlements:', createError);
        }
      }
    } catch (err) {
      console.error('useEntitlements: Error fetching entitlements:', err);
      setError(err instanceof Error ? err.message : 'Unknown error fetching entitlements');
      
      // If we have fewer than 3 retries and the error isn't a 401 (unauthorized)
      if (retryCount < 3) {
        console.log(`useEntitlements: Retrying (${retryCount + 1}/3) in 1 second...`);
        setRetryCount(prev => prev + 1);
        setTimeout(() => fetchEntitlements(), 1000);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, retryCount]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchEntitlements();
    } else if (!authLoading && !user) {
      setEntitlements([]);
      setPurchases([]);
      setIsLoading(false);
    }
  }, [user, authLoading, fetchEntitlements]);

  // Reset retry count when user changes
  useEffect(() => {
    setRetryCount(0);
  }, [user?.id]);

  // Check if user has any active entitlements
  const hasActiveEntitlements = entitlements.some(e => e.is_active);
  const hasPurchases = purchases.length > 0;

  return {
    entitlements,
    isLoading: isLoading || authLoading,
    error,
    hasActiveEntitlements,
    hasPurchases,
    purchases,
    refetch: fetchEntitlements
  };
} 