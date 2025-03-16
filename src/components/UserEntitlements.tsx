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
import { AlertCircle, RefreshCw, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PRODUCT_IDS, normalizeProductId, isValidUuidProductId, uuidToLegacyProductId } from '@/lib/product-ids';

// Define product type
interface Product {
  id: string;
  name: string;
  description: string;
  price: number | string;
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
  purchaseAmount?: number | string;
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
  const [isClearingAddons, setIsClearingAddons] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  // Function to toggle debug section
  const toggleDebug = () => {
    setShowDebug(prev => !prev);
  };

  // Clear localStorage cache on mount to ensure fresh data
  useEffect(() => {
    if (user) {
      // Clear the entitlements cache in localStorage
      const entitlementsKey = `user_entitlements_${user.id}`;
      try {
        localStorage.removeItem(entitlementsKey);
        console.log('Cleared entitlements cache from localStorage');
      } catch (error) {
        console.error('Error clearing localStorage cache:', error);
      }
      
      // Refresh entitlements from API
      refetchEntitlements();
    }
  }, [user, refetchEntitlements]);

  // Map entitlements to products when entitlements change
  useEffect(() => {
    if (!entitlementsLoading && !isRefreshing) {
      mapEntitlementsToProducts();
    }
  }, [entitlements, entitlementsLoading, isRefreshing]);

  // Function to fetch all products
  async function fetchAllProducts() {
    try {
      console.log("Fetching all products...");
      
      // Add cache-busting parameters
      const timestamp = new Date().getTime();
      const randomId = Math.random().toString(36).substring(2, 15);
      const url = `/api/products?_t=${timestamp}&_r=${randomId}`;
      
      // Fetch all products from the API with cache-busting headers
      const response = await fetch(url, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Fetched ${data.products?.length || 0} products`);
      return data.products || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      setDebugInfo(prev => `${prev || ''}\nError fetching products: ${error instanceof Error ? error.message : String(error)}`);
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
      
      if (!allProducts || allProducts.length === 0) {
        console.warn("No products returned from API");
        setDebugInfo(prev => `${prev || ''}\nNo products returned from API`);
      }
      
      // Count active entitlements for debugging
      const activeEntitlements = entitlements.filter(e => e.is_active);
      
      console.log('mapEntitlementsToProducts: Starting mapping with', {
        productCount: allProducts?.length || 0,
        entitlementCount: entitlements.length,
        activeEntitlementCount: activeEntitlements.length
      });
      
      console.log('mapEntitlementsToProducts: Active entitlements:', activeEntitlements);
      
      // Map products with entitlements
      const productsWithEntitlements = allProducts.map((product: Product) => {
        // Find matching entitlement for this product - EXACT MATCH ONLY
        const matchingEntitlement = activeEntitlements.find((e: Entitlement) => {
          // Direct match by product_id
          const isDirectMatch = e.product_id === product.id;
          
          if (isDirectMatch) {
            console.log(`mapEntitlementsToProducts: Found direct match for product ${product.id} (${product.name}) with entitlement ${e.id}`);
            return true;
          }
          
          return false;
        });
        
        // A product is only purchased if it has an active entitlement with EXACT product_id match
        const isPurchased = !!matchingEntitlement;
        
        if (isPurchased) {
          console.log(`mapEntitlementsToProducts: Product ${product.id} (${product.name}) is purchased with entitlement ${matchingEntitlement?.id}`);
        } else {
          console.log(`mapEntitlementsToProducts: Product ${product.id} (${product.name}) is NOT purchased`);
        }
        
        return {
          ...product,
          entitlement: matchingEntitlement,
          isPurchased,
          purchaseDate: matchingEntitlement?.valid_from,
          purchaseAmount: product.price
        };
      });
      
      console.log(`Mapped ${productsWithEntitlements.length} products with entitlements`);
      console.log(`Products with active entitlements: ${productsWithEntitlements.filter((p: ProductWithEntitlement) => p.isPurchased).length}`);
      setProducts(productsWithEntitlements);
    } catch (error) {
      console.error('Error mapping entitlements to products:', error);
      setError('Failed to load your entitlements. Please try again later.');
      setDebugInfo(prev => `${prev || ''}\nError mapping entitlements to products: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  }

  // Function to manually refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      console.log("Refreshing entitlements...");
      await refetchEntitlements();
      
      // Add a direct API check for debugging
      if (showDebug) {
        try {
          // Add timestamp and random ID to prevent caching
          const timestamp = Date.now();
          const randomId = Math.random().toString(36).substring(2, 15);
          const response = await fetch(`/api/user-entitlements?t=${timestamp}&r=${randomId}`, {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('Direct API response:', data);
            setDebugInfo(prev => `${prev || ''}\n\nDirect API response:\n${JSON.stringify(data, null, 2)}`);
          } else {
            console.error('Error fetching from API directly:', response.statusText);
            setDebugInfo(prev => `${prev || ''}\n\nError fetching from API directly: ${response.statusText}`);
          }
        } catch (apiError) {
          console.error('Error in direct API check:', apiError);
          setDebugInfo(prev => `${prev || ''}\n\nError in direct API check: ${apiError instanceof Error ? apiError.message : String(apiError)}`);
        }
      }
      
      console.log("Refreshing products...");
      await mapEntitlementsToProducts();
      
      setSuccessMessage("Your entitlements have been refreshed.");
    } catch (error) {
      console.error("Error refreshing entitlements:", error);
      setError("Failed to refresh your entitlements. Please try again later.");
      setDebugInfo(prev => `${prev || ''}\nError refreshing entitlements: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    setIsRefreshing(false);
  };

  // Function to clear addon entitlements
  const handleClearAddons = async () => {
    // Reset error and success message
    setError(null);
    setSuccessMessage(null);
    
    // Check if we have a user ID
    if (!user?.id) {
      setError("User ID not found. Please log in again.");
      return;
    }
    
    // Confirm before proceeding
    if (!window.confirm("Are you sure you want to clear all addon entitlements and clean up phantom data? This will remove access to all products except the main PMU Profit System and allow you to re-purchase them.")) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      console.log("Clearing addon entitlements and phantom data for user:", user.id);
      
      // Call the API to clear addon entitlements
      const response = await fetch('/api/user-entitlements/clear-addons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify({ userId: user.id })
      });
      
      // Parse the response
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to clear addon entitlements');
      }
      
      console.log("Successfully cleared addon entitlements and phantom data:", data);
      
      // Set success message with details
      let successMsg = `Successfully cleared ${data.entitlementsRemoved} addon entitlements and deleted ${data.purchasesDeleted} purchases.`;
      
      // Add phantom data cleanup details if any were found
      if (data.phantomEntitlementsRemoved > 0 || data.phantomPurchasesDeleted > 0) {
        successMsg += ` Also cleaned up ${data.phantomEntitlementsRemoved} phantom entitlements and ${data.phantomPurchasesDeleted} phantom purchases.`;
      }
      
      setSuccessMessage(successMsg);
      
      // Wait for the database to update before refreshing
      console.log("Waiting 1 second for database to update...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh entitlements and products
      console.log("Refreshing entitlements...");
      await refetchEntitlements();
      
      // Clear products before mapping to prevent stale data
      setProducts([]);
      
      console.log("Refreshing products...");
      await mapEntitlementsToProducts();
    } catch (error) {
      console.error("Error clearing addon entitlements:", error);
      setError(error instanceof Error ? error.message : 'Unknown error clearing addon entitlements');
      
      // Try to refresh anyway to show current state
      try {
        console.log("Attempting to refresh data after error...");
        await refetchEntitlements();
        await mapEntitlementsToProducts();
      } catch (refreshError) {
        console.error("Error refreshing data after clearing error:", refreshError);
      }
    } finally {
      setIsLoading(false);
    }
  };

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
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={toggleDebug}
          >
            {showDebug ? 'Hide Debug' : 'Show Debug'}
          </Button>
        </div>
      </div>
      
      {/* Show success message if present */}
      {successMessage && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <div className="flex items-center">
            <div className="mr-2">✅</div>
            <div>{successMessage}</div>
          </div>
        </Alert>
      )}
      
      {error && (
        <Alert className="bg-red-50 border-red-200 text-red-800">
          <div className="flex items-center">
            <div className="mr-2">❌</div>
            <div>{error}</div>
          </div>
        </Alert>
      )}
      
      {/* Show debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
          <p>User ID: {user?.id || 'Not logged in'}</p>
          <p>Has Active Entitlements: {hasActiveEntitlements ? 'Yes' : 'No'}</p>
          <p>Active Entitlements Count: {entitlements.filter(e => e.is_active).length}</p>
          <p>Total Products Count: {products.length}</p>
          <p>Main Product: PMU Profit System (ID: {PRODUCT_IDS['pmu-profit-system']})</p>
          <p>Addon Products: Ad Generator (ID: {PRODUCT_IDS['pmu-ad-generator']}), Consultation Success Blueprint (ID: {PRODUCT_IDS['consultation-success-blueprint']})</p>
          
          {/* Add clear addons button */}
          <div className="mt-2 pt-2 border-t border-gray-200">
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleClearAddons}
              disabled={isLoading || !user?.id}
              className="w-full"
            >
              <Trash2 className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Clearing...' : 'Clean Up Entitlements & Purchases'}
            </Button>
            <p className="mt-1 text-xs text-gray-500">
              This will remove all addon entitlements while preserving the main product, clean up phantom entitlements and purchases, and allow you to re-purchase addons for testing.
            </p>
          </div>
          
          {entitlements.length > 0 && (
            <details>
              <summary>Entitlements Details</summary>
              <pre className="mt-2 overflow-auto max-h-40">
                {JSON.stringify(entitlements.map(e => ({
                  id: e.id,
                  product_id: e.product_id,
                  product_name: e.products?.name || 'Unknown',
                  is_main_product: e.product_id === PRODUCT_IDS['pmu-profit-system'] ? 'Yes' : 'No',
                  source_type: e.source_type,
                  is_active: e.is_active,
                  valid_from: new Date(e.valid_from).toLocaleString()
                })), null, 2)}
              </pre>
            </details>
          )}
          
          {/* Update the products with entitlements section to show only products with active entitlements */}
          <details className="mt-2">
            <summary>Products with Active Entitlements</summary>
            <pre className="mt-2 overflow-auto max-h-40">
              {JSON.stringify(products.filter(p => !!p.entitlement?.is_active).map(p => ({
                name: p.name,
                id: p.id,
                is_main_product: p.id === PRODUCT_IDS['pmu-profit-system'] ? 'Yes' : 'No',
                entitlement_id: p.entitlement?.id,
                entitlement_product_id: p.entitlement?.product_id,
                is_active: p.entitlement?.is_active,
                exact_match: p.id === p.entitlement?.product_id ? 'Yes' : 'No'
              })), null, 2)}
            </pre>
          </details>
          
          {/* Add all products section */}
          <details className="mt-2">
            <summary>All Products</summary>
            <pre className="mt-2 overflow-auto max-h-40">
              {JSON.stringify(products.map(p => ({
                name: p.name,
                id: p.id,
                isPurchased: p.isPurchased,
                has_entitlement: !!p.entitlement,
                entitlement_product_id: p.entitlement?.product_id || 'None'
              })), null, 2)}
            </pre>
          </details>
          
          {/* Add debug log */}
          {debugInfo && (
            <details className="mt-2">
              <summary>Debug Log</summary>
              <pre className="mt-2 overflow-auto max-h-40 whitespace-pre-wrap">
                {debugInfo}
              </pre>
            </details>
          )}
        </div>
      )}
      
      {/* Debug section */}
      {showDebug && (
        <div className="mt-8 p-4 bg-gray-100 rounded-md text-xs font-mono overflow-auto max-h-96">
          <h3 className="font-bold mb-2">Debug Information</h3>
          <p>User ID: {user?.id || 'Not logged in'}</p>
          <p>Has Active Entitlements: {hasActiveEntitlements ? 'Yes' : 'No'}</p>
          <p>Active Entitlements Count: {entitlements.filter(e => e.is_active).length}</p>
          <p>Products Count: {products.length}</p>
          <p>Products with Active Entitlements: {products.filter(p => p.isPurchased).length}</p>
          
          <h4 className="font-bold mt-4 mb-2">Active Entitlements:</h4>
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(entitlements.filter(e => e.is_active).map(e => ({
              id: e.id,
              product_id: e.product_id,
              product_name: e.products?.name,
              is_active: e.is_active,
              valid_from: e.valid_from,
              valid_until: e.valid_until
            })), null, 2)}
          </pre>
          
          <h4 className="font-bold mt-4 mb-2">Products with Active Entitlements:</h4>
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(products.filter(p => p.isPurchased).map(p => ({
              id: p.id,
              name: p.name,
              entitlement_id: p.entitlement?.id,
              is_purchased: p.isPurchased
            })), null, 2)}
          </pre>
          
          <h4 className="font-bold mt-4 mb-2">All Products:</h4>
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(products.map(p => ({
              id: p.id,
              name: p.name,
              is_purchased: p.isPurchased
            })), null, 2)}
          </pre>
          
          <h4 className="font-bold mt-4 mb-2">Raw Debug Info:</h4>
          <pre className="whitespace-pre-wrap">{debugInfo}</pre>
        </div>
      )}
      
      {/* Products list */}
      <div className="space-y-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

// ProductCard component
function ProductCard({ product }: { product: ProductWithEntitlement }) {
  // Function to get the purchase link for a product
  const getPurchaseLink = (product: ProductWithEntitlement) => {
    // Check product type and name to determine the correct sales page
    if (product.name.toLowerCase().includes('ad generator')) {
      return '/dashboard/ad-generator/purchase'; // Correct purchase page for Ad Generator
    } else if (product.name.toLowerCase().includes('consultation') || 
               product.name.toLowerCase().includes('blueprint')) {
      return '/dashboard/blueprint/purchase'; // Correct purchase page for Consultation Blueprint
    }
    
    // Default to the standard checkout page for other products
    return `/checkout?products=${product.id}`;
  };

  // Get the appropriate link based on product type and ID
  const viewLink = product.id === 'e5749058-500d-4333-8938-c8a19b16cd65' 
    ? '/dashboard/blueprint'
    : getProductLink(product);

  // Determine if the product is purchased based ONLY on active entitlement with EXACT product_id match
  const isPurchased = !!product.isPurchased;
  
  return (
    <Card className={`overflow-hidden ${isPurchased ? 'border-green-200 bg-green-50' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{product.name}</CardTitle>
            <CardDescription>{formatProductType(product.type)}</CardDescription>
          </div>
          {isPurchased && (
            <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-200">
              Purchased
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">{product.description}</p>
        
        {isPurchased && product.entitlement && (
          <div className="bg-green-50 p-3 rounded-md text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium text-green-700">
                {product.entitlement.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            {product.purchaseDate && (
              <div className="flex justify-between">
                <span className="text-gray-600">Purchase Date:</span>
                <span className="font-medium">{formatDate(product.purchaseDate)}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-gray-600">Source:</span>
              <span className="font-medium">
                {formatSourceType(product.entitlement?.source_type || 'purchase')}
              </span>
            </div>
            
            {/* Add debug info for product ID mapping */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-2 pt-2 border-t border-green-200 text-xs text-gray-500">
                <div>Product ID: {product.id}</div>
                <div>Entitlement Product ID: {product.entitlement?.product_id || 'N/A'}</div>
                <div>Exact Match: {product.id === product.entitlement?.product_id ? 'Yes' : 'No'}</div>
                <div>Is Active: {product.entitlement?.is_active ? 'Yes' : 'No'}</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        {isPurchased ? (
          <Button asChild className="w-full">
            <Link href={viewLink}>
              View {product.type}
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline" className="w-full">
            <Link href={getPurchaseLink(product)}>
              Purchase for {formatPrice(product.price, product.currency)}
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// Helper functions
function formatSourceType(sourceType: string | null): string {
  if (!sourceType) return 'Unknown';
  
  switch (sourceType.toLowerCase()) {
    case 'stripe':
      return 'Online Purchase';
    case 'manual':
      return 'Manual Assignment';
    case 'gift':
      return 'Gift';
    case 'promotion':
      return 'Promotional Offer';
    case 'bundle':
      return 'Product Bundle';
    default:
      // Capitalize first letter of each word
      return sourceType
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
  }
}

// Format the product type for display
function formatProductType(type: string | null): string {
  if (!type) return 'Product';
  
  switch (type.toLowerCase()) {
    case 'course':
      return 'Online Course';
    case 'ebook':
      return 'E-Book';
    case 'template':
      return 'Template';
    case 'tool':
      return 'Digital Tool';
    case 'resource':
      return 'Digital Resource';
    case 'consultation':
      return 'Consultation Service';
    case 'blueprint':
      return 'Success Blueprint';
    default:
      // Capitalize first letter of each word
      return type
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
  }
}

// Format a date for display
function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    // Format: "Jan 1, 2023"
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Error';
  }
}

// Format price for display
function formatPrice(price: number | string | null | undefined, currency: string = 'EUR'): string {
  if (price === null || price === undefined) return 'N/A';
  
  // Convert price to number if it's a string
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  // Check if conversion was successful
  if (isNaN(numericPrice)) return 'N/A';
  
  // Format the price (assuming the price is already in the correct unit, not cents)
  const formattedPrice = numericPrice.toLocaleString('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return formattedPrice;
}

// Function to get the link to a product's content
function getProductLink(product: ProductWithEntitlement): string {
  // Check if the product is the Consultation Success Blueprint
  if (product.name.toLowerCase().includes('consultation') || 
      product.name.toLowerCase().includes('blueprint')) {
    return '/dashboard/blueprint';
  }
  
  // Check if the product is the Ad Generator
  if (product.name.toLowerCase().includes('ad generator')) {
    return '/dashboard/ad-generator';
  }
  
  // Default case for other products
  switch (product.type.toLowerCase()) {
    case 'course':
      return `/dashboard/courses/${product.id}`;
    case 'ebook':
      return `/dashboard/ebooks/${product.id}`;
    case 'template':
      return `/dashboard/templates/${product.id}`;
    default:
      return `/dashboard/products/${product.id}`;
  }
} 