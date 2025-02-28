'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

// Define the types of products that can be purchased
export type ProductId = 'pmu-profit-system' | 'consultation-success-blueprint' | 'pmu-ad-generator';

// Define the purchase record structure
interface Purchase {
  productId: ProductId;
  purchaseDate: string;
  expiryDate?: string; // Optional expiry date
}

// Define the context interface
interface PurchaseContextType {
  purchases: Purchase[];
  hasPurchased: (productId: ProductId) => boolean;
  addPurchase: (productId: ProductId) => void;
  removePurchase: (productId: ProductId) => void;
  resetPurchasesExceptSystem: () => void; // New utility function
}

// Create the context with a default value
const PurchaseContext = createContext<PurchaseContextType | undefined>(undefined);

// Provider component
export function PurchaseProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  // Load purchases from localStorage when the component mounts or user changes
  useEffect(() => {
    if (user) {
      // Use email as a unique identifier instead of uid
      const userId = typeof user === 'object' && user !== null && 'email' in user ? user.email : 'guest';
      const storedPurchases = localStorage.getItem(`purchases_${userId}`);
      if (storedPurchases) {
        setPurchases(JSON.parse(storedPurchases));
      } else {
        // Default purchase for demo purposes - in a real app, this would come from a database
        setPurchases([
          {
            productId: 'pmu-profit-system',
            purchaseDate: new Date('2024-01-15').toISOString()
          }
        ]);
      }
    } else {
      setPurchases([]);
    }
  }, [user]);

  // Save purchases to localStorage whenever they change
  useEffect(() => {
    if (user) {
      // Use email as a unique identifier instead of uid
      const userId = typeof user === 'object' && user !== null && 'email' in user ? user.email : 'guest';
      localStorage.setItem(`purchases_${userId}`, JSON.stringify(purchases));
    }
  }, [purchases, user]);

  // Check if the user has purchased a specific product
  const hasPurchased = (productId: ProductId): boolean => {
    return purchases.some(purchase => purchase.productId === productId);
  };

  // Add a new purchase
  const addPurchase = (productId: ProductId) => {
    if (!hasPurchased(productId)) {
      const newPurchase: Purchase = {
        productId,
        purchaseDate: new Date().toISOString(),
      };
      setPurchases(prev => [...prev, newPurchase]);
    }
  };

  // Remove a purchase (for testing or admin purposes)
  const removePurchase = (productId: ProductId) => {
    setPurchases(prev => prev.filter(purchase => purchase.productId !== productId));
  };
  
  // Reset all purchases except the PMU Profit System (for testing purchase flows)
  const resetPurchasesExceptSystem = () => {
    setPurchases(prev => prev.filter(purchase => purchase.productId === 'pmu-profit-system'));
  };

  return (
    <PurchaseContext.Provider value={{ 
      purchases, 
      hasPurchased, 
      addPurchase, 
      removePurchase,
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