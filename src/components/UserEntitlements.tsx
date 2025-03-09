"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { useEntitlements } from "@/hooks/useEntitlements";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define product type
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  type: string;
  currency?: string;
  active?: boolean;
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
  purchase?: {
    id: string;
    amount: number;
    currency: string;
    created_at: string;
    status: string;
  };
}

interface ProductWithEntitlement extends Product {
  entitlement?: Entitlement;
  isPurchased: boolean;
  purchaseDate?: string;
  purchaseAmount?: number;
}

export function UserEntitlements() {
  const { user } = useUser();
  const { 
    entitlements, 
    isLoading: entitlementsLoading, 
    error: entitlementsError, 
    hasActiveEntitlements,
    hasPurchases,
    purchases,
    refetch: refetchEntitlements
  } = useEntitlements();
  
  const [products, setProducts] = useState<ProductWithEntitlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Function to fetch all products
  async function fetchAllProducts() {
    try {
      // Fetch all products from the API
      const response = await fetch('/api/products');
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      return data.products || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  // Function to map entitlements to products
  async function mapEntitlementsToProducts() {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch all products
      const allProducts = await fetchAllProducts();
      
      // Map products with entitlements
      const productsWithEntitlements = allProducts.map((product: Product) => {
        const entitlement = entitlements.find(
          (e: Entitlement) => e.product_id === product.id
        );
        
        return {
          ...product,
          entitlement,
          isPurchased: !!entitlement,
          purchaseDate: entitlement?.valid_from,
          purchaseAmount: 0 // We don't have this information in the entitlement
        };
      });
      
      setProducts(productsWithEntitlements);
    } catch (error) {
      console.error('Error mapping entitlements to products:', error);
      setError('Failed to load your entitlements. Please try again later.');
      
      // Add debug info
      if (error instanceof Error) {
        setDebugInfo(`Error: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Function to manually refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      // Try to fetch from debug endpoint first for more detailed information
      const response = await fetch('/api/debug/user-entitlements');
      if (response.ok) {
        const data = await response.json();
        console.log("Debug endpoint data:", data);
        setDebugInfo(prev => `${prev || ''}\n\nDebug API Response:\n${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      console.error("Error fetching from debug endpoint:", error);
    }
    
    // Refresh the entitlements
    await refetchEntitlements();
    setIsRefreshing(false);
  };

  // Update products when entitlements change
  useEffect(() => {
    if (!entitlementsLoading) {
      mapEntitlementsToProducts();
    }
  }, [entitlements, entitlementsLoading]);

  // Set up real-time subscription for entitlement changes
  useEffect(() => {
    if (!user?.id) return;
    
    // Subscribe to changes in user_entitlements table for this user
    const subscription = supabase
      .channel('user_entitlements_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events (insert, update, delete)
          schema: 'public',
          table: 'user_entitlements',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Entitlement change detected:', payload);
          // Refresh data when entitlements change
          refetchEntitlements();
        }
      )
      .subscribe();
    
    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user?.id, refetchEntitlements]);

  // If loading, show skeleton UI
  if (isLoading || entitlementsLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Available Products</h2>
          <Button variant="outline" size="sm" disabled>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  // If error, show error message with retry button
  if (error || entitlementsError) {
    const errorMessage = error || entitlementsError || 'An unknown error occurred';
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Available Products</h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {errorMessage}
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2" 
              onClick={refetchEntitlements}
            >
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
        {process.env.NODE_ENV === 'development' && debugInfo && (
          <pre className="text-xs p-2 bg-gray-100 rounded overflow-auto max-h-40">
            {debugInfo}
          </pre>
        )}
      </div>
    );
  }

  // If no products, show message
  if (products.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Available Products</h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>No Products Available</CardTitle>
            <CardDescription>
              There are currently no products available for purchase.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Render products
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Available Products</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>
      
      {/* Show debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
          <p>User ID: {user?.id || 'Not logged in'}</p>
          <p>Has Active Entitlements: {hasActiveEntitlements ? 'Yes' : 'No'}</p>
          <p>Has Purchases: {hasPurchases ? 'Yes' : 'No'}</p>
          <p>Entitlements Count: {entitlements.length}</p>
        </div>
      )}
      
      {/* Products list */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Card key={product.id} className={product.isPurchased ? 'border-green-500' : ''}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{product.name}</CardTitle>
                {product.isPurchased && (
                  <Badge variant="outline" className="bg-green-100">
                    Purchased
                  </Badge>
                )}
              </div>
              <CardDescription>
                {product.type === 'course' ? 'Course' : product.type}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{product.description}</p>
              {product.isPurchased && product.purchaseDate && (
                <p className="text-xs text-muted-foreground mt-2">
                  Purchased on {new Date(product.purchaseDate).toLocaleDateString()}
                </p>
              )}
            </CardContent>
            <CardFooter>
              {product.isPurchased ? (
                <Button asChild className="w-full">
                  <Link href={`/dashboard/${product.type === 'course' ? 'modules' : product.type}`}>
                    Access Content
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/checkout?products=${product.id}`}>
                    Purchase for {product.currency || '€'}{product.price}
                  </Link>
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
} 