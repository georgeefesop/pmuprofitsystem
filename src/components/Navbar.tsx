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
    console.log('Mobile menu toggled:', !mobileMenuOpen); // Debug log
  };

  // Close mobile menu when a link is clicked
  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  // Handle logout with menu close
  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
    // Redirect to home page after logout
    window.location.href = '/';
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-800 to-purple-700 text-white shadow-md border-b border-purple-500/30 h-16`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-sm md:text-base font-extrabold tracking-widest text-white">PMU PROFIT SYSTEM</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-5">
            <Link href="/#results" className="text-sm text-white hover:text-purple-100 transition-colors">
              Results
            </Link>
            <Link href="/#features" className="text-sm text-white hover:text-purple-100 transition-colors">
              Features
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
                <div className="relative group">
                  <button className="flex items-center text-sm text-white hover:text-purple-100 transition-colors">
                    <span className="mr-1">{user.email?.split('@')[0] || 'Account'}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <Link href="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50">
                      Dashboard
                    </Link>
                    <Link href="/dashboard/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50">
                      Profile
                    </Link>
                    <Link href="/diagnostics" className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50">
                      System Diagnostics
                    </Link>
                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50">
                      Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-white hover:text-purple-100 transition-colors">
                  Login
                </Link>
                <Link 
                  href="/pre-checkout" 
                  className="bg-white text-purple-700 hover:bg-purple-50 px-3 py-1.5 rounded-md transition-colors font-medium shadow-sm text-sm"
                >
                  Buy Now
                </Link>
                <Link
                  href="/signup"
                  className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
                >
                  Sign Up
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
            mobileMenuOpen ? 'max-h-[90vh] opacity-100 mt-4 pb-4' : 'max-h-0 opacity-0'
          }`}
          style={{ display: mobileMenuOpen ? 'block' : 'none' }} // Force display property
        >
          <div className="space-y-4 px-2 py-2 bg-purple-900/80 rounded-lg shadow-lg overflow-y-auto">
            <Link href="/#results" onClick={handleLinkClick} className="block text-white hover:text-purple-100 transition-colors p-2 rounded hover:bg-purple-800/50">
              Results
            </Link>
            <Link href="/#features" onClick={handleLinkClick} className="block text-white hover:text-purple-100 transition-colors p-2 rounded hover:bg-purple-800/50">
              Features
            </Link>
            <Link href="/#faq" onClick={handleLinkClick} className="block text-white hover:text-purple-100 transition-colors p-2 rounded hover:bg-purple-800/50">
              FAQ
            </Link>
            <Link href="/contact" onClick={handleLinkClick} className="block text-white hover:text-purple-100 transition-colors p-2 rounded hover:bg-purple-800/50">
              Contact
            </Link>
            
            {/* Authentication Links */}
            {user ? (
              <>
                {/* Dashboard Link */}
                <Link href="/dashboard" onClick={handleLinkClick} className="block text-white hover:text-purple-100 transition-colors p-2 rounded hover:bg-purple-800/50">
                  Dashboard
                </Link>
                
                {/* System Diagnostics Link */}
                <Link href="/diagnostics" onClick={handleLinkClick} className="block text-white hover:text-purple-100 transition-colors p-2 rounded hover:bg-purple-800/50">
                  System Diagnostics
                </Link>
                
                {/* Dashboard Navigation Items - Only visible when logged in */}
                <div className="mt-4 pt-4 border-t border-purple-700">
                  <h3 className="text-white text-sm font-medium uppercase tracking-wider mb-3 px-2 opacity-70">Dashboard Menu</h3>
                  <div className="space-y-2">
                    <Link 
                      href="/dashboard/courses" 
                      onClick={handleLinkClick}
                      className="flex items-center text-white hover:text-purple-100 transition-colors p-2 rounded hover:bg-purple-800/50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      All Modules
                    </Link>
                    <Link 
                      href="/dashboard/blueprint" 
                      onClick={handleLinkClick}
                      className="flex items-center text-white hover:text-purple-100 transition-colors p-2 rounded hover:bg-purple-800/50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Consultation Success
                    </Link>
                    <Link 
                      href="/dashboard/handbook" 
                      onClick={handleLinkClick}
                      className="flex items-center text-white hover:text-purple-100 transition-colors p-2 rounded hover:bg-purple-800/50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      PMU Handbook
                    </Link>
                    <Link 
                      href="/dashboard/ad-generator" 
                      onClick={handleLinkClick}
                      className="flex items-center text-white hover:text-purple-100 transition-colors p-2 rounded hover:bg-purple-800/50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Ad Generator
                    </Link>
                    <Link 
                      href="/dashboard/profile" 
                      onClick={handleLinkClick}
                      className="flex items-center text-white hover:text-purple-100 transition-colors p-2 rounded hover:bg-purple-800/50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profile
                    </Link>
                  </div>
                </div>
                
                {/* Logout Button */}
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left bg-white text-purple-700 hover:bg-purple-50 px-4 py-2 rounded-md transition-colors font-medium shadow-sm mt-4"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={handleLinkClick} className="block text-white hover:text-purple-100 transition-colors p-2 rounded hover:bg-purple-800/50">
                  Login
                </Link>
                <Link 
                  href="/pre-checkout" 
                  onClick={handleLinkClick}
                  className="block w-full text-left bg-white text-purple-700 hover:bg-purple-50 px-4 py-2 rounded-md transition-colors font-medium shadow-sm"
                >
                  Buy Now
                </Link>
                <Link 
                  href="/signup" 
                  onClick={handleLinkClick}
                  className="block w-full text-left bg-purple-100 text-purple-800 hover:bg-purple-200 px-4 py-2 rounded-md transition-colors font-medium shadow-sm mt-2"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 