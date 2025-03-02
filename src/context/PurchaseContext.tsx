'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';

// Define the types of products that can be purchased
export type ProductId = 'pmu-profit-system' | 'consultation-success-blueprint' | 'pmu-ad-generator';

// Define the purchase record structure
interface Purchase {
  id: string;
  user_id: string;
  product_id: ProductId;
  amount: number;
  status: string;
  created_at: string;
}

// Define the context interface
interface PurchaseContextType {
  purchases: Purchase[];
  isLoading: boolean;
  hasPurchased: (productId: ProductId) => boolean;
  addPurchase: (productId: ProductId, amount: number, email?: string) => Promise<{ success: boolean; error?: string }>;
  refreshPurchases: () => Promise<void>;
  getPendingPurchases: () => { productId: ProductId; amount: number }[];
  claimPendingPurchases: () => Promise<void>;
  resetPurchasesExceptSystem: () => Promise<void>;
}

// Create the context with a default value
const PurchaseContext = createContext<PurchaseContextType | undefined>(undefined);

// Provider component
export function PurchaseProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingPurchases, setPendingPurchases] = useState<{ productId: ProductId; amount: number }[]>([]);

  // Fetch purchases from Supabase when the component mounts or user changes
  const fetchPurchases = async () => {
    if (!user) {
      setPurchases([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed');

      if (error) {
        console.error('Error fetching purchases:', error);
        return;
      }

      setPurchases(data || []);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
    
    // If user just logged in, check for pending purchases to claim
    if (user) {
      claimPendingPurchases();
    }
  }, [user]);

  // Check if the user has purchased a specific product
  const hasPurchased = (productId: ProductId): boolean => {
    return purchases.some(purchase => purchase.product_id === productId);
  };

  // Get pending purchases from localStorage
  const getPendingPurchases = (): { productId: ProductId; amount: number }[] => {
    if (typeof window === 'undefined') return [];
    
    const pendingPurchasesJson = localStorage.getItem('pendingPurchases');
    if (!pendingPurchasesJson) return [];
    
    try {
      return JSON.parse(pendingPurchasesJson);
    } catch (error) {
      console.error('Error parsing pending purchases:', error);
      return [];
    }
  };

  // Claim pending purchases after login
  const claimPendingPurchases = async (): Promise<void> => {
    if (!user) return;
    
    const pendingPurchases = getPendingPurchases();
    if (pendingPurchases.length === 0) return;
    
    console.log('Claiming pending purchases:', pendingPurchases);
    
    // Process each pending purchase
    for (const purchase of pendingPurchases) {
      try {
        const { success, error } = await addPurchase(purchase.productId, purchase.amount);
        if (!success) {
          console.error(`Failed to claim pending purchase ${purchase.productId}:`, error);
        }
      } catch (error) {
        console.error(`Error claiming pending purchase ${purchase.productId}:`, error);
      }
    }
    
    // Clear pending purchases after processing
    localStorage.removeItem('pendingPurchases');
  };

  // Add a new purchase
  const addPurchase = async (productId: ProductId, amount: number, email?: string): Promise<{ success: boolean; error?: string }> => {
    // If user is not authenticated, store the purchase as pending
    if (!user) {
      if (typeof window !== 'undefined') {
        // Store the pending purchase in localStorage
        const pendingPurchases = getPendingPurchases();
        pendingPurchases.push({ productId, amount });
        localStorage.setItem('pendingPurchases', JSON.stringify(pendingPurchases));
        
        // Also store the email if provided (for later registration)
        if (email) {
          localStorage.setItem('pendingPurchaseEmail', email);
        }
        
        console.log('Stored pending purchase:', { productId, amount });
        return { success: true, error: 'Purchase stored as pending until you log in or register' };
      }
      return { success: false, error: 'Cannot store pending purchase (browser storage not available)' };
    }

    try {
      const { data, error } = await supabase
        .from('purchases')
        .insert({
          user_id: user.id,
          product_id: productId,
          amount: amount,
          status: 'completed'
        })
        .select();

      if (error) {
        console.error('Error adding purchase:', error);
        return { success: false, error: error.message };
      }

      // Refresh purchases after adding a new one
      await fetchPurchases();
      return { success: true };
    } catch (error) {
      console.error('Error adding purchase:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  // Reset purchases except for the PMU Profit System
  const resetPurchasesExceptSystem = async (): Promise<void> => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Delete all purchases except for the PMU Profit System
      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('user_id', user.id)
        .neq('product_id', 'pmu-profit-system');
      
      if (error) {
        console.error('Error resetting purchases:', error);
      } else {
        // Refresh purchases
        await fetchPurchases();
      }
    } catch (error) {
      console.error('Error resetting purchases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh purchases from the database
  const refreshPurchases = async () => {
    await fetchPurchases();
  };

  return (
    <PurchaseContext.Provider value={{ 
      purchases, 
      isLoading,
      hasPurchased, 
      addPurchase,
      refreshPurchases,
      getPendingPurchases,
      claimPendingPurchases,
      resetPurchasesExceptSystem
    }}>
      {children}
    </PurchaseContext.Provider>
  );
}

// Custom hook to use the purchase context
export function usePurchases() {
  const context = useContext(PurchaseContext);
  if (context === undefined) {
    throw new Error('usePurchases must be used within a PurchaseProvider');
  }
  return context;
} 