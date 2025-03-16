'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';
import { PRODUCT_IDS, normalizeProductId, isValidLegacyProductId, isValidUuidProductId, uuidToLegacyProductId } from '@/lib/product-ids';

// Define the types of products that can be purchased
export type ProductId = 'pmu-profit-system' | 'consultation-success-blueprint' | 'pricing-template' | 'pmu-ad-generator';

// Define the purchase record structure
interface Purchase {
  id: string;
  user_id: string;
  product_id: string; // Changed from ProductId to string to allow both legacy IDs and UUIDs
  amount: number;
  status: string;
  created_at: string;
  payment_intent_id?: string;
}

// Define the RecordPaymentResult type
interface RecordPaymentResult {
  success: boolean;
  error?: string;
  verified?: boolean;
  redirectUrl?: string;
  message?: string;
}

// Define the context interface
interface PurchaseContextType {
  purchases: Purchase[];
  isLoading: boolean;
  hasPurchased: (productId: ProductId) => boolean;
  hasPurchasedAsync: (productId: ProductId) => Promise<boolean>;
  addPurchase: (productId: ProductId, amount: number, email?: string) => Promise<{ success: boolean; error?: string }>;
  recordSuccessfulPayment: (productId: ProductId, paymentIntentId: string, userAuthenticated?: boolean, userEmail?: string) => Promise<RecordPaymentResult>;
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

      setPurchases((data || []) as unknown as Purchase[]);
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
    // First check if the user has a purchase record for this product
    const hasPurchaseRecord = purchases.some(purchase => {
      // Check if the product_id matches the legacy ID directly
      if (purchase.product_id === productId) {
        return true;
      }
      
      // Check if the purchase product_id is a UUID that matches this product's UUID
      const productUuid = PRODUCT_IDS[productId as keyof typeof PRODUCT_IDS];
      if (purchase.product_id === productUuid) {
        return true;
      }
      
      // Check if the purchase product_id is a UUID that can be converted to a legacy ID
      if (isValidUuidProductId(purchase.product_id)) {
        const legacyId = uuidToLegacyProductId(purchase.product_id);
        return legacyId === productId;
      }
      
      return false;
    });
    
    if (hasPurchaseRecord) {
      return true;
    }
    
    // If no purchase record is found, check for entitlements
    // We'll make an API call to check for entitlements
    if (user) {
      // Make a synchronous check first using localStorage
      const entitlementsKey = `user_entitlements_${user.id}`;
      const cachedEntitlements = localStorage.getItem(entitlementsKey);
      
      if (cachedEntitlements) {
        try {
          const entitlements = JSON.parse(cachedEntitlements);
          const productUuid = PRODUCT_IDS[productId as keyof typeof PRODUCT_IDS];
          
          // Check if any entitlement matches the product ID
          const hasEntitlement = entitlements.some((entitlement: any) => {
            // Normalize both product IDs for comparison
            const normalizedEntitlementProductId = normalizeProductId(entitlement.product_id);
            const normalizedProductId = normalizeProductId(productId);
            
            return normalizedEntitlementProductId === normalizedProductId;
          });
          
          if (hasEntitlement) {
            return true;
          }
        } catch (error) {
          console.error('Error parsing cached entitlements:', error);
        }
      }
      
      // If no cached entitlements or no match found, make an API call
      // This is async, so we'll update the state after the call
      fetch(`/api/user-entitlements?userId=${user.id}`)
        .then(response => response.json())
        .then(data => {
          if (data.entitlements && data.entitlements.length > 0) {
            // Cache the entitlements for future checks
            localStorage.setItem(entitlementsKey, JSON.stringify(data.entitlements));
            
            // Check if any entitlement matches the product ID
            const productUuid = PRODUCT_IDS[productId as keyof typeof PRODUCT_IDS];
            const hasEntitlement = data.entitlements.some((entitlement: any) => {
              // Normalize both product IDs for comparison
              const normalizedEntitlementProductId = normalizeProductId(entitlement.product_id);
              const normalizedProductId = normalizeProductId(productId);
              
              return normalizedEntitlementProductId === normalizedProductId;
            });
            
            if (hasEntitlement) {
              // Force a refresh of purchases to include this entitlement
              fetchPurchases();
            }
          }
        })
        .catch(error => {
          console.error('Error fetching entitlements:', error);
        });
    }
    
    return false;
  };

  // Check if the user has purchased a specific product (async version that waits for API call)
  const hasPurchasedAsync = async (productId: ProductId): Promise<boolean> => {
    // First check if the user has a purchase record for this product
    const hasPurchaseRecord = purchases.some(purchase => {
      // Check if the product_id matches the legacy ID directly
      if (purchase.product_id === productId) {
        return true;
      }
      
      // Check if the purchase product_id is a UUID that matches this product's UUID
      const productUuid = PRODUCT_IDS[productId as keyof typeof PRODUCT_IDS];
      if (purchase.product_id === productUuid) {
        return true;
      }
      
      // Check if the purchase product_id is a UUID that can be converted to a legacy ID
      if (isValidUuidProductId(purchase.product_id)) {
        const legacyId = uuidToLegacyProductId(purchase.product_id);
        return legacyId === productId;
      }
      
      return false;
    });
    
    if (hasPurchaseRecord) {
      return true;
    }
    
    // If no purchase record is found, check for entitlements
    if (user) {
      // Make a synchronous check first using localStorage
      const entitlementsKey = `user_entitlements_${user.id}`;
      const cachedEntitlements = localStorage.getItem(entitlementsKey);
      
      if (cachedEntitlements) {
        try {
          const entitlements = JSON.parse(cachedEntitlements);
          
          // Check if any entitlement matches the product ID
          const hasEntitlement = entitlements.some((entitlement: any) => {
            // Normalize both product IDs for comparison
            const normalizedEntitlementProductId = normalizeProductId(entitlement.product_id);
            const normalizedProductId = normalizeProductId(productId);
            
            return normalizedEntitlementProductId === normalizedProductId;
          });
          
          if (hasEntitlement) {
            return true;
          }
        } catch (error) {
          console.error('Error parsing cached entitlements:', error);
        }
      }
      
      // If no cached entitlements or no match found, make an API call and wait for it
      try {
        // Add a timestamp to prevent caching
        const timestamp = new Date().toISOString();
        const response = await fetch(`/api/user-entitlements?userId=${user.id}&_t=${timestamp}`);
        const data = await response.json();
        
        if (data.entitlements && data.entitlements.length > 0) {
          // Cache the entitlements for future checks
          localStorage.setItem(entitlementsKey, JSON.stringify(data.entitlements));
          
          // Check if any entitlement matches the product ID
          const hasEntitlement = data.entitlements.some((entitlement: any) => {
            // Normalize both product IDs for comparison
            const normalizedEntitlementProductId = normalizeProductId(entitlement.product_id);
            const normalizedProductId = normalizeProductId(productId);
            
            return normalizedEntitlementProductId === normalizedProductId;
          });
          
          if (hasEntitlement) {
            // Force a refresh of purchases to include this entitlement
            await fetchPurchases();
            return true;
          }
        }
      } catch (error) {
        console.error('Error fetching entitlements:', error);
      }
    }
    
    return false;
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

  // Record a successful payment
  const recordSuccessfulPayment = async (
    productId: ProductId, 
    paymentIntentId: string,
    userAuthenticated: boolean = true,
    userEmail?: string
  ): Promise<RecordPaymentResult> => {
    console.log('Recording successful payment:', {
      productId,
      paymentId: paymentIntentId,
      userAuthenticated,
      userEmail
    });
    
    // For non-authenticated users, we need to handle differently
    if (!userAuthenticated || !user) {
      console.log('User is not authenticated in context, using API for purchase verification');
      
      try {
        // Call the verify-purchase API to verify the purchase
        const response = await fetch(`/api/verify-purchase?product=${productId}&payment_intent_id=${paymentIntentId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error verifying purchase via API:', errorData);
          return { success: false, error: errorData.error || 'Failed to verify purchase' };
        }
        
        const result = await response.json();
        
        if (result.success && result.verified) {
          console.log('Purchase verified via API:', result);
          
          // Use the redirect URL from the API response if available
          const redirectUrl = result.redirectUrl || '/dashboard';
          
          return { 
            success: true, 
            verified: true,
            redirectUrl,
            message: 'Purchase verified successfully via API'
          };
        } else {
          console.error('Purchase verification failed via API:', result);
          return { 
            success: false, 
            error: result.error || 'Purchase verification failed' 
          };
        }
      } catch (error) {
        console.error('Error during API purchase verification:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error during purchase verification' 
        };
      }
    }
    
    // For authenticated users, continue with the existing logic
    try {
      console.log('User is authenticated in context, checking for existing payment records');
      
      // Normalize the product ID to ensure consistent format
      const normalizedProductId = isValidLegacyProductId(productId) ? productId : uuidToLegacyProductId(productId) || productId;
      
      // Check if we already have a record of this payment
      const { data: existingPayments, error: fetchError } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', user.id)
        .eq('stripe_payment_intent_id', paymentIntentId);
      
      if (fetchError) {
        console.error('Error checking for existing payment:', fetchError);
        return { success: false, error: fetchError.message };
      }
      
      // If we already have a record, return success
      if (existingPayments && existingPayments.length > 0) {
        console.log('Payment already recorded:', existingPayments[0]);
        
        // Determine the redirect URL based on the product
        let redirectUrl = '/dashboard';
        
        if (normalizedProductId === 'consultation-success-blueprint') {
          redirectUrl = '/dashboard/blueprint';
        } else if (normalizedProductId === 'pricing-template') {
          redirectUrl = '/dashboard/pricing-template';
        } else if (normalizedProductId === 'pmu-ad-generator') {
          redirectUrl = '/dashboard/ad-generator';
        }
        
        return { 
          success: true, 
          redirectUrl,
          message: 'Payment already recorded' 
        };
      }
      
      console.log('No existing payment found, creating new purchase record');
      
      // Insert a new purchase record
      const { data: purchase, error: insertError } = await supabase
        .from('purchases')
        .insert({
          user_id: user.id,
          product_id: normalizedProductId,
          amount: normalizedProductId === 'consultation-success-blueprint' ? 33 : 27,
          status: 'pending', // Start as pending until entitlements are created
          stripe_payment_intent_id: paymentIntentId,
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Error inserting purchase record:', insertError);
        return { success: false, error: insertError.message };
      }
      
      console.log('Created purchase record:', purchase);
      
      // Now create entitlements for this purchase
      try {
        console.log('Creating entitlements for payment:', paymentIntentId);
        
        // Call the create-entitlements API
        const entitlementsResponse = await fetch(`/api/create-entitlements?session_id=${paymentIntentId}&user_id=${user.id}`);
        
        if (!entitlementsResponse.ok) {
          const errorData = await entitlementsResponse.json();
          console.error('Error creating entitlements:', errorData);
          // Don't fail the whole operation if entitlements creation fails
          // We'll update the purchase status later
        } else {
          const entitlementsResult = await entitlementsResponse.json();
          console.log('Entitlements creation result:', entitlementsResult);
        }
      } catch (error) {
        console.error('Error creating entitlements:', error);
        // Don't fail the whole operation if entitlements creation fails
      }
      
      // Update the purchase status to completed
      try {
        console.log('Updating purchase status for payment:', paymentIntentId);
        
        // Call the update-status API
        const statusResponse = await fetch('/api/purchases/update-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentIntentId,
            status: 'completed'
          }),
        });
        
        if (!statusResponse.ok) {
          const errorData = await statusResponse.json();
          console.error('Error updating purchase status:', errorData);
          // Don't fail the whole operation if status update fails
        } else {
          const statusResult = await statusResponse.json();
          console.log('Purchase status update result:', statusResult);
        }
      } catch (error) {
        console.error('Error updating purchase status:', error);
        // Don't fail the whole operation if status update fails
      }
      
      // Refresh purchases to include the new one
      await fetchPurchases();
      
      // Determine the redirect URL based on the product
      let redirectUrl = '/dashboard';
      
      if (normalizedProductId === 'consultation-success-blueprint') {
        redirectUrl = '/dashboard/blueprint';
      } else if (normalizedProductId === 'pricing-template') {
        redirectUrl = '/dashboard/pricing-template';
      } else if (normalizedProductId === 'pmu-ad-generator') {
        redirectUrl = '/dashboard/ad-generator';
      }
      
      return { 
        success: true, 
        redirectUrl,
        message: 'Payment recorded successfully' 
      };
    } catch (error) {
      console.error('Error recording payment:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error recording payment' 
      };
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
      hasPurchasedAsync,
      addPurchase,
      recordSuccessfulPayment,
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