'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Add smooth scrolling for anchor links
  useEffect(() => {
    // Add smooth scrolling behavior to the document
    document.documentElement.style.scrollBehavior = 'smooth';

    // Handle anchor links
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (anchor && anchor.hash && anchor.hash.startsWith('#') && anchor.pathname === window.location.pathname) {
        e.preventDefault();
        const element = document.querySelector(anchor.hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          // Update URL without reload
          window.history.pushState(null, '', anchor.hash);
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);
    
    return () => {
      document.removeEventListener('click', handleAnchorClick);
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);

  return (
    <nav className="bg-purple-900 text-white shadow-md sticky top-0 z-50">
      <div className="container-custom py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold">PMU Profit System</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="hover:text-purple-200 transition-colors">
              Home
            </Link>
            <Link href="/#features" className="hover:text-purple-200 transition-colors">
              Features
            </Link>
            <Link href="/#testimonials" className="hover:text-purple-200 transition-colors">
              Testimonials
            </Link>
            <Link href="/#faq" className="hover:text-purple-200 transition-colors">
              FAQ
            </Link>
            
            {/* Authentication Links */}
            {user ? (
              <>
                <Link href="/dashboard" className="hover:text-purple-200 transition-colors">
                  Dashboard
                </Link>
                <button 
                  onClick={logout}
                  className="bg-purple-700 hover:bg-purple-800 px-4 py-2 rounded-md transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-purple-200 transition-colors">
                  Login
                </Link>
                <Link 
                  href="/checkout" 
                  className="bg-purple-700 hover:bg-purple-800 px-4 py-2 rounded-md transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
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
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-4">
            <Link href="/" className="block hover:text-purple-200 transition-colors">
              Home
            </Link>
            <Link href="/#features" className="block hover:text-purple-200 transition-colors">
              Features
            </Link>
            <Link href="/#testimonials" className="block hover:text-purple-200 transition-colors">
              Testimonials
            </Link>
            <Link href="/#faq" className="block hover:text-purple-200 transition-colors">
              FAQ
            </Link>
            
            {/* Authentication Links */}
            {user ? (
              <>
                <Link href="/dashboard" className="block hover:text-purple-200 transition-colors">
                  Dashboard
                </Link>
                <button 
                  onClick={logout}
                  className="block w-full text-left bg-purple-700 hover:bg-purple-800 px-4 py-2 rounded-md transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="block hover:text-purple-200 transition-colors">
                  Login
                </Link>
                <Link 
                  href="/checkout" 
                  className="block bg-purple-700 hover:bg-purple-800 px-4 py-2 rounded-md transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
} 