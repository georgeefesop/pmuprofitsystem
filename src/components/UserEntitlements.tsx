"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { getProducts } from "@/utils/user-entitlements";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase, createUserSpecificSupabaseClient } from "@/lib/supabase";
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

interface ProductWithEntitlement extends Product {
  entitlement?: Entitlement;
  isPurchased: boolean;
}

export function UserEntitlements() {
  const { user } = useUser();
  const [products, setProducts] = useState<ProductWithEntitlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);

  // Function to fetch products and entitlements
  async function fetchProductsAndEntitlements() {
    setIsLoading(true);
    setError(null);
    
    try {
      // Always use the server-side API endpoint to get the most accurate data
      const response = await fetch('/api/user-entitlements');
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Use the entitlements from the API response
      const userEntitlements = data.entitlements || [];
      
      // Get all products
      const allProductsResult = await getProducts();
      const allProducts = allProductsResult.data || [];
      
      // Map products with entitlements
      const productsWithEntitlements = allProducts.map((product: Product) => {
        const entitlement = userEntitlements.find(
          (e: Entitlement) => e.product_id === product.id
        );
        
        return {
          ...product,
          entitlement,
          isPurchased: !!entitlement
        };
      });
      
      setProducts(productsWithEntitlements);
    } catch (error) {
      console.error('Error fetching entitlements:', error);
      setError('Failed to load your entitlements. Please try again later.');
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
        setDebugInfo(prev => `${prev}\n\nDebug API Response:\n${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      console.error("Error fetching from debug endpoint:", error);
    }
    
    // Refresh the data
    await fetchProductsAndEntitlements();
  };

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
          fetchProductsAndEntitlements();
        }
      )
      .subscribe();
    
    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user?.id]);

  // Initial fetch
  useEffect(() => {
    fetchProductsAndEntitlements();
  }, [user?.id]);

  // If loading, show skeleton UI
  if (isLoading) {
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
  if (error) {
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
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2" 
              onClick={fetchProductsAndEntitlements}
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
      
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
      
      {process.env.NODE_ENV === 'development' && debugInfo && (
        <pre className="text-xs p-2 bg-gray-100 rounded overflow-auto max-h-40">
          {debugInfo}
        </pre>
      )}
    </div>
  );
}

function ProductCard({ product }: { product: ProductWithEntitlement }) {
  const { name, description, price, type, isPurchased, currency = 'EUR' } = product;
  
  // Get purchase link based on product status
  const getPurchaseLink = (product: ProductWithEntitlement) => {
    if (isPurchased) {
      return getProductLink(product);
    }
    return `/checkout?product=${product.id}`;
  };
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Badge variant={isPurchased ? "success" : "outline"}>
            {isPurchased ? "Purchased" : "Available"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Type:</span>
            <span>{formatProductType(type)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Price:</span>
            <span>{formatPrice(price, currency)}</span>
          </div>
          {isPurchased && product.entitlement && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Purchase Type:</span>
                <span>{formatSourceType(product.entitlement.source_type)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Purchase Date:</span>
                <span>{formatDate(product.entitlement.valid_from)}</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          variant={isPurchased ? "default" : "outline"}
          asChild
        >
          <a href={getPurchaseLink(product)}>
            {isPurchased ? "Access Now" : "Purchase Now"}
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}

// Helper functions
function formatSourceType(sourceType: string): string {
  switch (sourceType) {
    case 'purchase':
      return 'Direct Purchase';
    case 'subscription':
      return 'Subscription';
    case 'gift':
      return 'Gift';
    default:
      return sourceType.charAt(0).toUpperCase() + sourceType.slice(1);
  }
}

function formatProductType(type: string): string {
  switch (type) {
    case 'course':
      return 'Course';
    case 'tool':
      return 'Tool';
    case 'resource':
      return 'Resource';
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(price);
}

function getProductLink(product: ProductWithEntitlement): string {
  switch (product.type) {
    case 'course':
      return '/dashboard';
    case 'tool':
      if (product.name.toLowerCase().includes('ad generator')) {
        return '/dashboard/ad-generator';
      }
      return '/dashboard';
    case 'resource':
      if (product.name.toLowerCase().includes('consultation')) {
        return '/dashboard/consultation-blueprint';
      }
      return '/dashboard';
    default:
      return '/dashboard';
  }
} 