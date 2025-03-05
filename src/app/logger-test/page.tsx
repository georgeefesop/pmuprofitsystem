'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function LoggerTestPage() {
  useEffect(() => {
    // Log different types of messages when the page loads
    console.log('Logger Test Page - Page loaded');
    console.info('This is an info message from Logger Test Page');
    console.debug('This is a debug message from Logger Test Page');
    console.warn('This is a warning message from Logger Test Page');
    
    // Log an object
    console.log('Test object:', {
      page: 'logger-test',
      timestamp: new Date().toISOString(),
      features: ['console.log', 'console.info', 'console.debug', 'console.warn', 'console.error']
    });
    
    // Log an error
    console.error('This is an error message from Logger Test Page');
  }, []);
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Logger Test Page</h1>
      <p className="mb-6">This page tests the browser error logger on different pages.</p>
      
      <div className="mb-6">
        <p className="mb-2">Check your terminal to see the console output from this page.</p>
        <p className="mb-2">The logger should capture all console output from any page you visit.</p>
      </div>
      
      <div className="flex gap-4">
        <Link href="/" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Go to Home
        </Link>
        <Link href="/error-test" className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
          Go to Error Test
        </Link>
        <button 
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          onClick={() => {
            console.log('Button clicked on Logger Test Page');
            console.info('This is triggered by a user action');
          }}
        >
          Log Something
        </button>
      </div>
    </div>
  );
} 