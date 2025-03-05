"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import PreCheckoutForm from "./pre-checkout-form";
import { motion } from "framer-motion";

function PreCheckoutContent() {
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div 
          className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">Create Account</h1>
              <p className="text-gray-600 mt-2">
                Create an account before completing your purchase
              </p>
            </motion.div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : user ? (
            <div className="text-center py-8">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-500 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-green-600 text-lg font-medium mb-2">You're already logged in!</p>
                <p className="text-gray-600 mb-4">Redirecting to checkout...</p>
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
              </motion.div>
            </div>
          ) : (
            <>
              <PreCheckoutForm products={products} />
              
              <motion.div 
                className="mt-8 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <p className="text-gray-600">
                  Already have an account?{" "}
                  <Link 
                    href={`/login?redirect=/checkout${products.length > 0 ? `?products=${products.join(",")}` : ""}`}
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Sign in
                  </Link>
                </p>
              </motion.div>
            </>
          )}
        </motion.div>
        
        <motion.div 
          className="mt-8 text-center text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex items-center justify-center space-x-2 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span>Secure Account Creation</span>
          </div>
          <p>Your information is protected with industry-standard encryption</p>
        </motion.div>
      </div>
    </div>
  );
}

// Server component that uses the ClientWrapper
import ClientWrapper from "@/components/ClientWrapper";

export default function PreCheckoutPage() {
  return (
    <ClientWrapper>
      <PreCheckoutContent />
    </ClientWrapper>
  );
} 