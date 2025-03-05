'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function LoggerTestNav() {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    return pathname === path ? 'bg-purple-700' : 'bg-purple-500 hover:bg-purple-600';
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white p-2 rounded-lg shadow-lg">
      <div className="text-sm font-semibold mb-2 text-center">Logger Test Navigation</div>
      <div className="flex flex-col gap-2">
        <Link 
          href="/" 
          className={`px-3 py-1.5 text-white rounded text-sm ${isActive('/')}`}
        >
          Home
        </Link>
        <Link 
          href="/logger-test" 
          className={`px-3 py-1.5 text-white rounded text-sm ${isActive('/logger-test')}`}
        >
          Logger Test
        </Link>
        <Link 
          href="/another-test" 
          className={`px-3 py-1.5 text-white rounded text-sm ${isActive('/another-test')}`}
        >
          Another Test
        </Link>
        <Link 
          href="/error-test" 
          className={`px-3 py-1.5 text-white rounded text-sm ${isActive('/error-test')}`}
        >
          Error Test
        </Link>
        <button
          className="px-3 py-1.5 bg-green-500 text-white rounded text-sm hover:bg-green-600 mt-2"
          onClick={() => {
            console.log('Test log from navigation');
            console.info('Test info from navigation');
            console.warn('Test warning from navigation');
            console.error('Test error from navigation');
          }}
        >
          Log From Nav
        </button>
      </div>
    </div>
  );
} 