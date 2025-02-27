'use client';

import React from 'react';
import Link from 'next/link';

interface ModuleNavBarProps {
  currentModuleId: string;
  totalModules: number;
  moduleTitle: string;
}

export function ModuleNavBar({
  currentModuleId,
  totalModules,
  moduleTitle
}: ModuleNavBarProps) {
  const currentId = parseInt(currentModuleId);
  const hasPrevious = currentId > 1;
  const hasNext = currentId < totalModules;
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        {hasPrevious ? (
          <Link
            href={`/dashboard/module/${currentId - 1}`}
            className="inline-flex items-center justify-center p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="sr-only">Previous Module</span>
          </Link>
        ) : (
          <div className="w-9 h-9"></div>
        )}
        
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{moduleTitle}</h2>
          <p className="text-sm text-gray-500">Module {currentModuleId} of {totalModules}</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Link
          href="/dashboard/courses"
          className="text-sm text-purple-600 hover:text-purple-800 font-medium"
        >
          All Modules
        </Link>
        
        {hasNext && (
          <Link
            href={`/dashboard/module/${currentId + 1}`}
            className="inline-flex items-center justify-center p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="sr-only">Next Module</span>
          </Link>
        )}
      </div>
    </div>
  );
} 