'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function AnotherTestPage() {
  useEffect(() => {
    // Log different types of messages when the page loads
    console.log('Another Test Page - Page loaded');
    console.info('This is an info message from Another Test Page');
    console.debug('This is a debug message from Another Test Page');
    console.warn('This is a warning message from Another Test Page');
    
    // Log an object
    console.log('Test object:', {
      page: 'another-test',
      timestamp: new Date().toISOString(),
      features: ['console.log', 'console.info', 'console.debug', 'console.warn', 'console.error']
    });
    
    // Log an error
    console.error('This is an error message from Another Test Page');
  }, []);
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Another Test Page</h1>
      <p className="mb-6">This page tests the browser error logger on a different page.</p>
      
      <div className="mb-6">
        <p className="mb-2">Check your terminal to see the console output from this page.</p>
        <p className="mb-2">The logger should capture all console output from any page you visit.</p>
      </div>
      
      <div className="flex gap-4">
        <Link href="/" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Go to Home
        </Link>
        <Link href="/logger-test" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
          Go to Logger Test
        </Link>
        <button 
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          onClick={() => {
            console.log('Button clicked on Another Test Page');
            console.info('This is triggered by a user action on Another Test Page');
          }}
        >
          Log Something
        </button>
      </div>
    </div>
  );
} 