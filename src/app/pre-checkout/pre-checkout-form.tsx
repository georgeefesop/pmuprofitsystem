"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { supabase } from "@/utils/supabase/client";

interface PreCheckoutFormProps {
  products: string[];
}

export default function PreCheckoutForm({ products }: PreCheckoutFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError(null);

    try {
      // Validate form data
      if (!loginData.email || !loginData.password) {
        throw new Error("Please fill in all fields");
      }

      console.log("Signing in with Supabase client...");
      // Sign in directly with Supabase client
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) {
        console.error("Error signing in with Supabase client:", error);
        throw new Error(error.message || "Failed to sign in. Please check your credentials.");
      }

      console.log("Supabase sign-in successful:", data);

      // Show success message
      setSuccess("Signed in successfully! Redirecting to checkout...");

      // Construct the product query
      const productQuery = products.length > 0 ? `?products=${products.join(",")}` : "";

      // Set the authenticating flag
      sessionStorage.setItem('isAuthenticating', 'true');

      // Use a more reliable redirection method
      setTimeout(() => {
        console.log('Executing redirect to:', `/checkout${productQuery}`);
        // Force a hard navigation instead of client-side routing
        window.location.href = `/checkout${productQuery}`;
      }, 1500);
    } catch (error) {
      console.error("Login error:", error);
      setLoginError(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate form data
      if (!formData.email || !formData.password || !formData.fullName) {
        throw new Error("Please fill in all fields");
      }

      if (formData.password.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }

      console.log("Creating user account...");
      // Create user account via API route
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
        }),
      });

      const data = await response.json();
      console.log("Signup API response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      console.log("User account created successfully, now signing in directly with Supabase client...");
      
      // Sign in directly with Supabase client (like the old version)
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        console.error("Error signing in with Supabase client:", signInError);
        throw new Error("Account created but couldn't sign in automatically. Please try logging in.");
      }

      console.log("Supabase sign-in successful:", signInData);

      // Show success message
      setSuccess("Account created and signed in successfully! Redirecting to checkout...");

      // Construct the product query
      const productQuery = products.length > 0 ? `?products=${products.join(",")}` : "";

      // Store flags in sessionStorage
      sessionStorage.setItem('justSignedUp', 'true');
      sessionStorage.setItem('isAuthenticating', 'true');
      sessionStorage.setItem('lastSignupEmail', formData.email);

      console.log('Account created and signed in successfully, redirecting to checkout');
      
      // Use a more reliable redirection method
      setTimeout(() => {
        console.log('Executing redirect to:', `/checkout${productQuery}`);
        // Force a hard navigation instead of client-side routing
        window.location.href = `/checkout${productQuery}`;
      }, 1500);
      
    } catch (error) {
      console.error("Signup error:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!showLoginForm ? (
        <>
          

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Your full name"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password (min. 8 characters)"
                disabled={isLoading}
                required
              />
              <p className="text-xs text-gray-500">Must be at least 8 characters</p>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Account & Continue"}
            </Button>
          </form>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <button
                onClick={() => setShowLoginForm(true)}
                className="text-indigo-600 hover:text-indigo-800 font-medium"
                type="button"
              >
                Sign in
              </button>
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
            <p className="text-gray-600 mt-1">
              Sign in to continue to checkout
            </p>
          </div>

          {loginError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {loginError}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                name="email"
                type="email"
                value={loginData.email}
                onChange={handleLoginChange}
                placeholder="your@email.com"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                name="password"
                type="password"
                value={loginData.password}
                onChange={handleLoginChange}
                placeholder="Your password"
                disabled={isLoading}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? "Signing In..." : "Sign In & Continue"}
            </Button>
          </form>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <button
                onClick={() => setShowLoginForm(false)}
                className="text-indigo-600 hover:text-indigo-800 font-medium"
                type="button"
              >
                Create one
              </button>
            </p>
          </div>
        </>
      )}
    </div>
  );
} 
