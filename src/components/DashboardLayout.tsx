'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);
  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex flex-col md:flex-row flex-1">
        {/* Mobile Sidebar Toggle Button */}
        <div className="md:hidden bg-purple-800 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">PMU Profit System</h2>
          <button 
            className="text-white p-2 focus:outline-none"
            onClick={openSidebar}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        
        {/* Background for sidebar on large screens */}
        <div className={`hidden md:block bg-purple-900 w-full ${sidebarCollapsed ? 'max-w-[60px]' : 'max-w-[280px]'} shrink-0 transition-all duration-300`}>
          {/* Desktop Sidebar - Always visible on desktop */}
          <div className="h-screen sticky top-0">
            <Sidebar currentModuleId={currentModuleId} collapsed={sidebarCollapsed} />
          </div>
        </div>
        
        {/* Mobile Sidebar - Only shown when sidebarOpen is true */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            <div 
              className="absolute inset-0 bg-black bg-opacity-50"
              onClick={closeSidebar}
            ></div>
            <div className="relative h-full w-[280px] max-w-[80%]">
              <Sidebar onClose={closeSidebar} currentModuleId={currentModuleId} />
            </div>
          </div>
        )}
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <header className="bg-white shadow-sm">
            <div className="py-4 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 max-w-7xl mx-auto w-full">
              <div className="flex items-center">
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