'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Checkout() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adGenerator, setAdGenerator] = useState(false);
  const [blueprint, setBlueprint] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { register } = useAuth();

  const calculateTotal = () => {
    let total = 37; // Base price
    if (adGenerator) total += 27;
    if (blueprint) total += 33;
    return total;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await register(email, password, '');
      if (success) {
        router.push('/checkout/success');
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during checkout');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="md:flex">
            {/* Product Summary */}
            <div className="md:w-1/2 bg-purple-700 text-white p-8">
              <h1 className="heading-lg mb-4">Secure Checkout</h1>
              <p className="mb-6">You're just one step away from transforming your PMU business!</p>
              
              <div className="bg-purple-600 p-4 rounded-lg mb-6">
                <h2 className="heading-sm mb-2">PMU Profit System</h2>
                <p className="mb-2">The complete system to help you reach €5,000/month as a PMU artist</p>
                <p className="text-xl font-bold">€37</p>
              </div>
              
              {adGenerator && (
                <div className="bg-purple-600 p-4 rounded-lg mb-6">
                  <h2 className="heading-sm mb-2">PMU Ad Generator Tool</h2>
                  <p className="mb-2">AI-powered tool to create high-converting ad copy</p>
                  <p className="text-xl font-bold">€27</p>
                </div>
              )}
              
              {blueprint && (
                <div className="bg-purple-600 p-4 rounded-lg mb-6">
                  <h2 className="heading-sm mb-2">Consultation Success Blueprint</h2>
                  <p className="mb-2">Proven consultation framework that converts prospects into clients</p>
                  <p className="text-xl font-bold">€33</p>
                </div>
              )}
              
              <div className="border-t border-purple-600 pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <p className="font-semibold">Total:</p>
                  <p className="text-2xl font-bold">€{calculateTotal()}</p>
                </div>
              </div>
              
              <div className="space-y-4 mt-6 mb-6">
                <div className="flex items-start">
                  <span className="text-green-300 mr-2 text-xl">✓</span>
                  <p>Step-by-step marketing system</p>
                </div>
                <div className="flex items-start">
                  <span className="text-green-300 mr-2 text-xl">✓</span>
                  <p>Proven ad templates</p>
                </div>
                <div className="flex items-start">
                  <span className="text-green-300 mr-2 text-xl">✓</span>
                  <p>Client attraction strategies</p>
                </div>
                <div className="flex items-start">
                  <span className="text-green-300 mr-2 text-xl">✓</span>
                  <p>Lifetime access</p>
                </div>
              </div>
              
              <p className="text-sm">Your information is secure and encrypted</p>
            </div>
            
            {/* Checkout Form */}
            <div className="md:w-1/2 p-8">
              <h2 className="heading-md mb-6">Complete Your Order</h2>
              
              {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
                  {error}
                </div>
              )}
              
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    placeholder="your@email.com"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Create Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Minimum 8 characters"
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    You'll use this to access your course after purchase
                  </p>
                </div>
                
                {/* Upsell Options */}
                <div className="border-t border-b border-gray-200 py-6">
                  <h3 className="font-semibold mb-4">Enhance Your Experience</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id="adGenerator"
                        name="adGenerator"
                        checked={adGenerator}
                        onChange={(e) => setAdGenerator(e.target.checked)}
                        className="mt-1 mr-3"
                      />
                      <div>
                        <label htmlFor="adGenerator" className="font-medium">
                          PMU Ad Generator Tool (+€27)
                        </label>
                        <p className="text-sm text-gray-600">
                          AI-powered tool to create high-converting ad copy for your PMU business
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id="blueprint"
                        name="blueprint"
                        checked={blueprint}
                        onChange={(e) => setBlueprint(e.target.checked)}
                        className="mt-1 mr-3"
                      />
                      <div>
                        <label htmlFor="blueprint" className="font-medium">
                          Consultation Success Blueprint (+€33)
                        </label>
                        <p className="text-sm text-gray-600">
                          Our proven consultation framework that converts 9 out of 10 prospects into paying clients
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <button
                    type="submit"
                    className="w-full btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Processing...' : `Complete Purchase (€${calculateTotal()})`}
                  </button>
                  <p className="text-xs text-center text-gray-500 mt-2">
                    By clicking "Complete Purchase", you agree to our Terms of Service and Privacy Policy
                  </p>
                </div>
              </form>
              
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-600 mb-2">Have questions before you buy?</p>
                <Link href="/" className="text-purple-600 hover:text-purple-800 font-medium">
                  Return to homepage
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 