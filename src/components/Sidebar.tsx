'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  onClose?: () => void;
  currentModuleId?: string;
  collapsed?: boolean;
}

export function Sidebar({ onClose, currentModuleId, collapsed = false }: SidebarProps) {
  const pathname = usePathname();
  
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
      <aside className="w-full max-w-[60px] bg-gradient-to-b from-purple-800 to-purple-900 text-white h-full flex flex-col shadow-xl">
        <div className="p-3 flex-grow">
          <div className="flex justify-center items-center mb-8">
            <h2 className="text-xl font-bold tracking-tight">P</h2>
          </div>
          
          <nav className="space-y-4 flex flex-col items-center">
            <Link 
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
              href="/dashboard/courses" 
              className={`flex items-center justify-center p-2 rounded-lg transition-all w-10 h-10 ${
                isActive('/dashboard/courses') 
                  ? 'bg-white/15 text-white shadow-sm' 
                  : 'text-purple-100 hover:bg-white/10 hover:text-white'
              }`}
              title="All Modules"
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
              title="Consultation Blueprint"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
          </nav>
        </div>
        
        <div className="p-3 border-t border-purple-700/50 mt-auto flex justify-center">
          <Link 
            href="/logout" 
            className="flex items-center justify-center p-2 rounded-lg transition-all w-10 h-10 text-purple-200 hover:bg-white/10 hover:text-white"
            title="Logout"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </Link>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-full max-w-[280px] bg-gradient-to-b from-purple-800 to-purple-900 text-white h-full flex flex-col shadow-xl">
      <div className="p-6 flex-grow">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold tracking-tight">PMU Profit System</h2>
          <button 
            className="md:hidden text-white focus:outline-none hover:text-purple-200 transition-colors"
            onClick={onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <nav className="space-y-1.5">
          <Link 
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
            href="/dashboard/courses" 
            className={`flex items-center py-2.5 px-4 rounded-lg transition-all ${
              isActive('/dashboard/courses') 
                ? 'bg-white/15 text-white font-medium shadow-sm' 
                : 'text-purple-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="whitespace-nowrap">All Modules</span>
          </Link>
          
          {currentModuleId && (
            <div className="mt-4 mb-2">
              <div className="py-2 px-4 text-purple-200 text-xs font-medium uppercase tracking-wider">Current Module</div>
              <div className="bg-purple-700/50 p-3 rounded-lg mx-2 mb-2 border border-purple-600/30">
                <p className="text-white font-medium truncate text-sm flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-purple-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="whitespace-nowrap">Module {currentModuleId}</span>
                </p>
              </div>
            </div>
          )}
          
          <div className="mt-8 mb-2">
            <div className="py-2 px-4 text-purple-200 text-xs font-medium uppercase tracking-wider">Bonus Materials</div>
          </div>
          
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
            <span className="whitespace-nowrap">Consultation Blueprint</span>
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
        </nav>
      </div>
      
      <div className="p-6 border-t border-purple-700/50 mt-auto">
        <Link 
          href="/logout" 
          className="flex items-center text-sm text-purple-200 hover:text-white transition-colors group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 flex-shrink-0 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="whitespace-nowrap">Logout</span>
        </Link>
      </div>
    </aside>
  );
} 