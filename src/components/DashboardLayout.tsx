'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { FloatingMenuButton } from './FloatingMenuButton';
import Link from 'next/link';
import { useAuthState } from '@/hooks/useAuthState';

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
  const { logout } = useAuthState();
  
  const openMobileMenu = () => setMobileMenuOpen(true);
  const closeMobileMenu = () => setMobileMenuOpen(false);
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
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
            {/* Removed mobile menu toggle button from here */}
          </div>
        </div>
      </div>
      
      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 md:hidden ${
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeMobileMenu}
      ></div>
      
      {/* Mobile Sidebar */}
      <div 
        className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-purple-800 to-purple-900 text-white z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onClose={closeMobileMenu} currentModuleId={currentModuleId} />
      </div>
      
      {/* Floating Menu Button for Mobile */}
      <FloatingMenuButton onClick={toggleMobileMenu} isOpen={mobileMenuOpen} />
      
      <div className="flex flex-col md:flex-row flex-1">
        {/* Desktop Sidebar Container - Only visible on desktop */}
        <div className={`hidden md:block bg-purple-900 w-full ${sidebarCollapsed ? 'max-w-[60px]' : 'max-w-[280px]'} shrink-0 transition-all duration-300`}>
          <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-hidden">
            <Sidebar currentModuleId={currentModuleId} collapsed={sidebarCollapsed} onToggleCollapse={toggleSidebar} />
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          <header className="bg-white shadow-sm sticky top-0 z-10">
            <div className="py-4 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 max-w-7xl mx-auto w-full">
              <div className="flex items-center">
                {/* Removed mobile sidebar toggle button from here */}
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
                <h1 id="dashboard-title" className="text-xl md:text-2xl font-bold text-gray-900">{title}</h1>
              </div>
              
              {/* Action Button - if provided */}
              {actionButton && (
                <div>
                  {actionButton}
                </div>
              )}
            </div>
          </header>
          
          <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
} 