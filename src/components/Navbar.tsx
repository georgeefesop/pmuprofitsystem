'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle mobile menu toggle
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="relative bg-gradient-to-r from-purple-800 to-purple-700 text-white shadow-md border-b border-purple-500/30">
      <div className="container-custom py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold tracking-wider text-white">PMU PROFIT SYSTEM</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-white hover:text-purple-100 transition-colors">
              Home
            </Link>
            <Link href="/#features" className="text-white hover:text-purple-100 transition-colors">
              Features
            </Link>
            <Link href="/#results" className="text-white hover:text-purple-100 transition-colors">
              Results
            </Link>
            <Link href="/#faq" className="text-white hover:text-purple-100 transition-colors">
              FAQ
            </Link>
            <Link href="/contact" className="text-white hover:text-purple-100 transition-colors">
              Contact
            </Link>
            
            {/* Authentication Links */}
            {user ? (
              <>
                <Link href="/dashboard" className="text-white hover:text-purple-100 transition-colors">
                  Dashboard
                </Link>
                <button 
                  onClick={logout}
                  className="bg-white text-purple-700 hover:bg-purple-50 px-4 py-2 rounded-md transition-colors font-medium shadow-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-white hover:text-purple-100 transition-colors">
                  Login
                </Link>
                <Link 
                  href="/checkout" 
                  className="bg-white text-purple-700 hover:bg-purple-50 px-4 py-2 rounded-md transition-colors font-medium shadow-sm"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-white/50"
            onClick={toggleMobileMenu}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <div 
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? 'max-h-96 opacity-100 mt-4 pb-4' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="space-y-4 px-2 py-2 bg-purple-900/80 rounded-lg shadow-lg">
            <Link href="/" className="block text-white hover:text-purple-100 transition-colors p-2 rounded hover:bg-purple-800/50">
              Home
            </Link>
            <Link href="/#features" className="block text-white hover:text-purple-100 transition-colors p-2 rounded hover:bg-purple-800/50">
              Features
            </Link>
            <Link href="/#results" className="block text-white hover:text-purple-100 transition-colors p-2 rounded hover:bg-purple-800/50">
              Results
            </Link>
            <Link href="/#faq" className="block text-white hover:text-purple-100 transition-colors p-2 rounded hover:bg-purple-800/50">
              FAQ
            </Link>
            <Link href="/contact" className="block text-white hover:text-purple-100 transition-colors p-2 rounded hover:bg-purple-800/50">
              Contact
            </Link>
            
            {/* Authentication Links */}
            {user ? (
              <>
                <Link href="/dashboard" className="block text-white hover:text-purple-100 transition-colors p-2 rounded hover:bg-purple-800/50">
                  Dashboard
                </Link>
                <button 
                  onClick={logout}
                  className="block w-full text-left bg-white text-purple-700 hover:bg-purple-50 px-4 py-2 rounded-md transition-colors font-medium shadow-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="block text-white hover:text-purple-100 transition-colors p-2 rounded hover:bg-purple-800/50">
                  Login
                </Link>
                <Link 
                  href="/checkout" 
                  className="block w-full text-left bg-white text-purple-700 hover:bg-purple-50 px-4 py-2 rounded-md transition-colors font-medium shadow-sm"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 