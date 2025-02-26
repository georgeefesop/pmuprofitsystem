'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll event to change navbar appearance
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Handle mobile menu toggle
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-800 to-purple-700 text-white shadow-md border-b border-purple-500/30 py-3`}>
      <div className="container-custom">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-sm md:text-base font-extrabold tracking-widest text-white">PMU PROFIT SYSTEM</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-5">
            <Link href="/" className="text-sm text-white hover:text-purple-100 transition-colors">
              Home
            </Link>
            <Link href="/#features" className="text-sm text-white hover:text-purple-100 transition-colors">
              Features
            </Link>
            <Link href="/#results" className="text-sm text-white hover:text-purple-100 transition-colors">
              Results
            </Link>
            <Link href="/#faq" className="text-sm text-white hover:text-purple-100 transition-colors">
              FAQ
            </Link>
            <Link href="/contact" className="text-sm text-white hover:text-purple-100 transition-colors">
              Contact
            </Link>
            
            {/* Authentication Links */}
            {user ? (
              <>
                <Link href="/dashboard" className="text-sm text-white hover:text-purple-100 transition-colors">
                  Dashboard
                </Link>
                <button 
                  onClick={logout}
                  className="bg-white text-purple-700 hover:bg-purple-50 px-3 py-1.5 rounded-md transition-colors font-medium shadow-sm text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-white hover:text-purple-100 transition-colors">
                  Login
                </Link>
                <Link 
                  href="/checkout" 
                  className="bg-white text-purple-700 hover:bg-purple-50 px-3 py-1.5 rounded-md transition-colors font-medium shadow-sm text-sm"
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
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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