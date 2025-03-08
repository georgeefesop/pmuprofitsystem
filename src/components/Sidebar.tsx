'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEnhancedUser } from '@/hooks/useEnhancedUser';

interface SidebarProps {
  onClose?: () => void;
  currentModuleId?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ onClose, currentModuleId, collapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { signOut } = useEnhancedUser();
  
  // Handle sign out with redirection
  const handleSignOut = () => {
    if (onClose) onClose();
    signOut();
  };
  
  // Determine which link is active
  const isActive = (path: string) => {
    if (path === '/dashboard' && pathname === '/dashboard') {
      return true;
    }
    if (path !== '/dashboard' && pathname.startsWith(path)) {
      return true;
    }
    return false;
  };

  if (collapsed) {
    return (
      <aside id="dashboard-sidebar-collapsed" className="w-full max-w-[60px] bg-gradient-to-b from-purple-800 to-purple-900 text-white h-full flex flex-col shadow-xl">
        <div className="p-3 flex-grow">
          <div className="flex justify-center items-center mb-8">
            {/* Logo or brand icon could go here */}
          </div>
          
          <nav id="sidebar-nav-collapsed" className="space-y-4 flex flex-col items-center">
            <Link 
              id="sidebar-collapsed-dashboard-link"
              href="/dashboard" 
              className={`flex items-center justify-center p-2 rounded-lg transition-all w-10 h-10 ${
                isActive('/dashboard') 
                  ? 'bg-white/15 text-white shadow-sm' 
                  : 'text-purple-100 hover:bg-white/10 hover:text-white'
              }`}
              title="Dashboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </Link>
            <Link 
              id="sidebar-collapsed-courses-link"
              href="/dashboard/modules" 
              className={`flex items-center justify-center p-2 rounded-lg transition-all w-10 h-10 ${
                isActive('/dashboard/modules') 
                  ? 'bg-white/15 text-white shadow-sm' 
                  : 'text-purple-100 hover:bg-white/10 hover:text-white'
              }`}
              title="All Modules"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
              </svg>
            </Link>
            
            <Link 
              href="/dashboard/handbook" 
              className={`flex items-center justify-center p-2 rounded-lg transition-all w-10 h-10 ${
                isActive('/dashboard/handbook') 
                  ? 'bg-white/15 text-white shadow-sm' 
                  : 'text-purple-100 hover:bg-white/10 hover:text-white'
              }`}
              title="Handbook"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </Link>
            
            <Link 
              href="/dashboard/blueprint" 
              className={`flex items-center justify-center p-2 rounded-lg transition-all w-10 h-10 ${
                isActive('/dashboard/blueprint') 
                  ? 'bg-white/15 text-white shadow-sm' 
                  : 'text-purple-100 hover:bg-white/10 hover:text-white'
              }`}
              title="Consultation Success"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </Link>
            
            <Link 
              href="/dashboard/ad-generator" 
              className={`flex items-center justify-center p-2 rounded-lg transition-all w-10 h-10 ${
                isActive('/dashboard/ad-generator') 
                  ? 'bg-white/15 text-white shadow-sm' 
                  : 'text-purple-100 hover:bg-white/10 hover:text-white'
              }`}
              title="Ad Generator"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Link>
            
            <Link 
              href="/dashboard/profile" 
              className={`flex items-center justify-center p-2 rounded-lg transition-all w-10 h-10 ${
                isActive('/dashboard/profile') 
                  ? 'bg-white/15 text-white shadow-sm' 
                  : 'text-purple-100 hover:bg-white/10 hover:text-white'
              }`}
              title="My Profile"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
            
            <button 
              id="sidebar-collapsed-sign-out-button"
              onClick={handleSignOut}
              className={`flex items-center justify-center p-2 rounded-lg transition-all w-10 h-10 hover:bg-purple-700`}
              aria-label="Sign Out"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
            
            {onToggleCollapse && (
              <button 
                id="sidebar-expand-button"
                onClick={onToggleCollapse}
                className="flex items-center justify-center p-2 rounded-lg transition-all w-10 h-10 text-purple-200 hover:bg-white/10 hover:text-white mt-2"
                title="Expand sidebar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </nav>
        </div>
      </aside>
    );
  }

  return (
    <aside id="dashboard-sidebar" className="w-full max-w-[280px] bg-gradient-to-b from-purple-800 to-purple-900 text-white h-full flex flex-col shadow-xl">
      <div className="p-6 flex-grow">
        <div className="flex justify-end items-center mb-8">
          {onClose && (
            <button 
              id="sidebar-close-button"
              className="text-white focus:outline-none hover:text-purple-200 transition-colors"
              onClick={onClose}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        <nav id="sidebar-nav" className="space-y-1.5">
          <Link 
            id="sidebar-dashboard-link"
            href="/dashboard" 
            className={`flex items-center py-2.5 px-4 rounded-lg transition-all ${
              isActive('/dashboard') 
                ? 'bg-white/15 text-white font-medium shadow-sm' 
                : 'text-purple-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="whitespace-nowrap">Dashboard</span>
          </Link>
          
          <Link 
            id="sidebar-courses-link"
            href="/dashboard/modules" 
            className={`flex items-center py-2.5 px-4 rounded-lg transition-all ${
              isActive('/dashboard/modules') || (currentModuleId && isActive(`/dashboard/modules/${currentModuleId}`))
                ? 'bg-white/15 text-white font-medium shadow-sm' 
                : 'text-purple-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
            </svg>
            <span className="whitespace-nowrap">All Modules</span>
          </Link>
          
          {currentModuleId && (
            <div className="mt-4 mb-2">
              <div className="py-2 px-4 text-purple-200 text-xs font-medium uppercase tracking-wider">Current Module</div>
              <div className="bg-purple-700/50 p-3 rounded-lg mx-2 mb-2 border border-purple-600/30">
                <p className="text-white font-medium truncate text-sm">
                  <span className="whitespace-nowrap">Module {currentModuleId}</span>
                </p>
              </div>
            </div>
          )}
          
          <div className="mt-8 mb-2">
            <div className="py-2 px-4 text-purple-200 text-xs font-medium uppercase tracking-wider w-full min-w-[200px]">
              <span className="whitespace-nowrap">Bonus Materials</span>
            </div>
          </div>
          
          <Link 
            href="/dashboard/handbook" 
            className={`flex items-center py-2.5 px-4 rounded-lg transition-all ${
              isActive('/dashboard/handbook') 
                ? 'bg-white/15 text-white font-medium shadow-sm' 
                : 'text-purple-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="whitespace-nowrap">Handbook</span>
          </Link>
          
          <Link 
            href="/dashboard/blueprint" 
            className={`flex items-center py-2.5 px-4 rounded-lg transition-all ${
              isActive('/dashboard/blueprint') 
                ? 'bg-white/15 text-white font-medium shadow-sm' 
                : 'text-purple-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="whitespace-nowrap">Consultation Success</span>
          </Link>
          
          <Link 
            href="/dashboard/ad-generator" 
            className={`flex items-center py-2.5 px-4 rounded-lg transition-all ${
              isActive('/dashboard/ad-generator') 
                ? 'bg-white/15 text-white font-medium shadow-sm' 
                : 'text-purple-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="whitespace-nowrap">Ad Generator</span>
          </Link>
          
          <div className="mt-8 mb-2">
            <div className="py-2 px-4 text-purple-200 text-xs font-medium uppercase tracking-wider">Account</div>
          </div>
          
          <Link 
            href="/dashboard/profile" 
            className={`flex items-center py-2.5 px-4 rounded-lg transition-all ${
              isActive('/dashboard/profile') 
                ? 'bg-white/15 text-white font-medium shadow-sm' 
                : 'text-purple-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="whitespace-nowrap">My Profile</span>
          </Link>
          
          <button 
            id="sidebar-sign-out-button"
            onClick={handleSignOut}
            className={`flex items-center p-2 rounded-lg transition-all hover:bg-purple-700 w-full`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </button>
          
          {onToggleCollapse && (
            <button 
              onClick={onToggleCollapse}
              className="flex items-center py-2.5 px-4 rounded-lg transition-all text-purple-100 hover:bg-white/10 hover:text-white w-full text-left mt-1"
              title="Collapse sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
              <span className="whitespace-nowrap">Collapse Menu</span>
            </button>
          )}
        </nav>
      </div>
    </aside>
  );
} 