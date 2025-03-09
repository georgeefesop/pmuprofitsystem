import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

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

interface UseEntitlementsResult {
  entitlements: Entitlement[];
  isLoading: boolean;
  error: string | null;
  hasActiveEntitlements: boolean;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch user entitlements from the API
 * This uses the service role client on the backend to bypass RLS
 */
export function useEntitlements(): UseEntitlementsResult {
  const { user, isLoading: authLoading } = useAuth();
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntitlements = async () => {
    if (!user) {
      setEntitlements([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('useEntitlements: Fetching entitlements from API');
      const response = await fetch('/api/user-entitlements');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch entitlements');
      }
      
      const data = await response.json();
      console.log('useEntitlements: Received entitlements:', data);
      
      setEntitlements(data.entitlements || []);
    } catch (err) {
      console.error('useEntitlements: Error fetching entitlements:', err);
      setError(err instanceof Error ? err.message : 'Unknown error fetching entitlements');
      setEntitlements([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchEntitlements();
    }
  }, [user, authLoading]);

  // Check if user has any active entitlements
  const hasActiveEntitlements = entitlements.some(e => e.is_active);

  return {
    entitlements,
    isLoading: isLoading || authLoading,
    error,
    hasActiveEntitlements,
    refetch: fetchEntitlements
  };
} 