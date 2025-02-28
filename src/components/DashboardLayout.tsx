'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  actionButton?: React.ReactNode;
  currentModuleId?: string;
}

export function DashboardLayout({ 
  children, 
  title, 
  actionButton,
  currentModuleId
}: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { logout } = useAuth();
  
  const openMobileMenu = () => setMobileMenuOpen(true);
  const closeMobileMenu = () => setMobileMenuOpen(false);
  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  const handleLogout = () => {
    closeMobileMenu();
    logout();
    // Redirect to home page after logout
    window.location.href = '/';
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* TopNav - Main site navigation header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-purple-800 to-purple-700 text-white shadow-md border-b border-purple-500/30 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">PMU PROFIT SYSTEM</h2>
            {/* Mobile Menu Toggle Button */}
            <button 
              className="text-white p-2 focus:outline-none"
              onClick={openMobileMenu}
              aria-label="Open navigation menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden" onClick={closeMobileMenu}>
          {/* Prevent clicks inside the menu from closing it */}
          <div className="absolute top-0 left-0 right-0 bg-purple-900 shadow-lg overflow-y-auto max-h-[90vh] animate-slideDown" onClick={(e) => e.stopPropagation()}>
            {/* Menu Header */}
            <div className="sticky top-0 z-10 bg-purple-800 p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">PMU PROFIT SYSTEM</h2>
              <button 
                className="text-white p-2 rounded-full hover:bg-purple-700"
                onClick={closeMobileMenu}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Menu Content */}
            <div className="p-4">
              {/* Main Navigation Section */}
              <div className="mb-6">
                <h3 className="text-white text-sm font-medium uppercase tracking-wider mb-3 opacity-70">Main Navigation</h3>
                <nav className="space-y-2">
                  <Link 
                    href="/dashboard" 
                    className="block py-3 px-4 text-white text-lg font-medium hover:bg-purple-800 rounded-lg"
                    onClick={closeMobileMenu}
                  >
                    Features
                  </Link>
                  <Link 
                    href="/dashboard/courses" 
                    className="block py-3 px-4 text-white text-lg font-medium hover:bg-purple-800 rounded-lg"
                    onClick={closeMobileMenu}
                  >
                    Results
                  </Link>
                  <Link 
                    href="/dashboard/blueprint" 
                    className="block py-3 px-4 text-white text-lg font-medium hover:bg-purple-800 rounded-lg"
                    onClick={closeMobileMenu}
                  >
                    FAQ
                  </Link>
                  <Link 
                    href="/dashboard/handbook" 
                    className="block py-3 px-4 text-white text-lg font-medium hover:bg-purple-800 rounded-lg"
                    onClick={closeMobileMenu}
                  >
                    Contact
                  </Link>
                </nav>
              </div>
              
              {/* Dashboard Navigation Section */}
              <div className="mb-6 pt-4 border-t border-purple-800">
                <h3 className="text-white text-sm font-medium uppercase tracking-wider mb-3 opacity-70">Dashboard</h3>
                <nav className="space-y-2">
                  <Link 
                    href="/dashboard" 
                    className="flex items-center py-3 px-4 text-white text-lg font-medium hover:bg-purple-800 rounded-lg"
                    onClick={closeMobileMenu}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Dashboard
                  </Link>
                  <Link 
                    href="/dashboard/courses" 
                    className="flex items-center py-3 px-4 text-white text-lg font-medium hover:bg-purple-800 rounded-lg"
                    onClick={closeMobileMenu}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    All Modules
                  </Link>
                  <Link 
                    href="/dashboard/blueprint" 
                    className="flex items-center py-3 px-4 text-white text-lg font-medium hover:bg-purple-800 rounded-lg"
                    onClick={closeMobileMenu}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Consultation Success
                  </Link>
                  <Link 
                    href="/dashboard/handbook" 
                    className="flex items-center py-3 px-4 text-white text-lg font-medium hover:bg-purple-800 rounded-lg"
                    onClick={closeMobileMenu}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    PMU Handbook
                  </Link>
                  <Link 
                    href="/dashboard/ad-generator" 
                    className="flex items-center py-3 px-4 text-white text-lg font-medium hover:bg-purple-800 rounded-lg"
                    onClick={closeMobileMenu}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Ad Generator
                  </Link>
                  <Link 
                    href="/dashboard/profile" 
                    className="flex items-center py-3 px-4 text-white text-lg font-medium hover:bg-purple-800 rounded-lg"
                    onClick={closeMobileMenu}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </Link>
                </nav>
                
                <div className="mt-4 space-y-3">
                  <button 
                    className="flex items-center justify-center py-3 px-4 text-white text-lg font-medium bg-white/10 hover:bg-white/20 rounded-lg w-full"
                    onClick={handleLogout}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                  <Link 
                    href="/dashboard/courses" 
                    className="flex items-center justify-center py-3 px-4 text-white text-lg font-medium bg-purple-600 hover:bg-purple-700 rounded-lg"
                    onClick={closeMobileMenu}
                  >
                    View Modules
                  </Link>
                </div>
              </div>
              
              {/* Bonus Materials Section */}
              <div className="pt-4 border-t border-purple-800">
                <h3 className="text-white text-lg font-medium mb-4">Bonus Materials</h3>
                <div className="space-y-4">
                  <div className="bg-white/5 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h4 className="text-white font-medium">Consultation Success Blueprint</h4>
                    </div>
                    <p className="text-purple-200 text-sm mb-2">Our proven framework that helps you convert more prospects into paying clients.</p>
                    <Link 
                      href="/dashboard/blueprint" 
                      className="text-purple-300 hover:text-white text-sm flex items-center"
                      onClick={closeMobileMenu}
                    >
                      View Blueprint <span className="ml-1">→</span>
                    </Link>
                  </div>
                  
                  <div className="bg-white/5 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <h4 className="text-white font-medium">PMU Business Handbook</h4>
                    </div>
                    <p className="text-purple-200 text-sm mb-2">A comprehensive guide to building and growing your PMU business.</p>
                    <Link 
                      href="/dashboard/handbook" 
                      className="text-purple-300 hover:text-white text-sm flex items-center"
                      onClick={closeMobileMenu}
                    >
                      View Handbook <span className="ml-1">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Add top padding for mobile to account for fixed header */}
      <div className="md:hidden h-14"></div>
      
      <div className="flex flex-col md:flex-row flex-1">
        {/* Desktop Sidebar Container - Only visible on desktop */}
        <div className={`hidden md:block bg-purple-900 w-full ${sidebarCollapsed ? 'max-w-[60px]' : 'max-w-[280px]'} shrink-0 transition-all duration-300`}>
          <div className="h-screen sticky top-0">
            <Sidebar currentModuleId={currentModuleId} collapsed={sidebarCollapsed} />
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          <header className="bg-white shadow-sm">
            <div className="py-4 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 max-w-7xl mx-auto w-full">
              <div className="flex items-center">
                {/* Desktop Sidebar Toggle Button - Only visible on desktop */}
                <button 
                  className="mr-4 text-gray-700 focus:outline-none hover:text-purple-600 transition-colors md:block hidden"
                  onClick={toggleSidebar}
                  aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {sidebarCollapsed ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                  )}
                </button>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h1>
              </div>
              {actionButton}
            </div>
          </header>
          
          <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-auto">
            <div className="max-w-7xl mx-auto w-full">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 