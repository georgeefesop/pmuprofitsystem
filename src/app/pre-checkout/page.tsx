"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import PreCheckoutForm from "./pre-checkout-form";

export default function PreCheckoutPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<string[]>([]);
  
  // Extract product IDs from URL parameters
  useEffect(() => {
    const productParam = searchParams.get("products");
    if (productParam) {
      setProducts(productParam.split(","));
    } else {
      // Default to main product if no products specified
      setProducts(["pmu-profit-system"]);
    }
  }, [searchParams]);

  // If user is already logged in, redirect to checkout
  useEffect(() => {
    if (user && !isLoading) {
      const productQuery = products.length > 0 ? `?products=${products.join(",")}` : "";
      router.push(`/checkout${productQuery}`);
    }
  }, [user, isLoading, router, products]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-900">Create Account</h1>
          <p className="text-gray-600 mt-2">
            Create an account or sign in before completing your purchase
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : user ? (
          <div className="text-center">
            <p className="text-green-600 mb-4">You're already logged in!</p>
            <p className="text-gray-600 mb-4">Redirecting to checkout...</p>
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          </div>
        ) : (
          <>
            <PreCheckoutForm products={products} />
            
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Already have an account?{" "}
                <Link 
                  href={`/login?redirect=/checkout${products.length > 0 ? `?products=${products.join(",")}` : ""}`}
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 