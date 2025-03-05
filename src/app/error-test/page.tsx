'use client';

import React, { useState, useEffect } from 'react';

// Component with a runtime error
function BuggyComponent() {
  // This will cause a runtime error when rendered
  const obj = null;
  // Add a null check to fix the TypeScript error, but still allow the runtime error for testing
  // @ts-ignore - We're intentionally causing an error for testing
  return <div>{obj?.nonExistentProperty || obj!.nonExistentProperty}</div>;
}

// Component with a promise rejection
function PromiseRejectionComponent() {
  useEffect(() => {
    // This will cause an unhandled promise rejection
    Promise.reject(new Error('This is a test promise rejection'));
  }, []);
  
  return <div>This component has an unhandled promise rejection</div>;
}

// Component with console errors and warnings
function ConsoleErrorComponent() {
  useEffect(() => {
    // Generate console errors and warnings
    console.error('This is a test console error');
    console.warn('This is a test console warning');
    
    // Generate an error with an object
    console.error('Error with object:', { 
      name: 'TestError', 
      details: { 
        code: 500, 
        message: 'This is a test error object' 
      } 
    });
  }, []);
  
  return <div>This component logs console errors and warnings</div>;
}

export default function ErrorTestPage() {
  const [showRuntimeError, setShowRuntimeError] = useState(false);
  const [showPromiseRejection, setShowPromiseRejection] = useState(false);
  const [showConsoleError, setShowConsoleError] = useState(false);
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Error Logging Test Page</h1>
      <p className="mb-6">This page contains components that generate various types of errors to test the browser error logging functionality.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Runtime Error</h2>
          <p className="mb-4">This will cause a runtime error when the component renders.</p>
          <button 
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            onClick={() => setShowRuntimeError(true)}
          >
            Trigger Runtime Error
          </button>
          {showRuntimeError && <BuggyComponent />}
        </div>
        
        <div className="border p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Promise Rejection</h2>
          <p className="mb-4">This will cause an unhandled promise rejection.</p>
          <button 
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
            onClick={() => setShowPromiseRejection(true)}
          >
            Trigger Promise Rejection
          </button>
          {showPromiseRejection && <PromiseRejectionComponent />}
        </div>
        
        <div className="border p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Console Errors</h2>
          <p className="mb-4">This will log errors and warnings to the console.</p>
          <button 
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            onClick={() => setShowConsoleError(true)}
          >
            Trigger Console Errors
          </button>
          {showConsoleError && <ConsoleErrorComponent />}
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-semibold mb-4">Manual Error Testing</h2>
        <p className="mb-4">You can also test errors manually by running the following code in your browser console:</p>
        <pre className="bg-gray-800 text-white p-4 rounded overflow-x-auto">
          {`// Console error
console.error('Manual console error test');

// Console warning
console.warn('Manual console warning test');

// Runtime error
throw new Error('Manual runtime error test');

// Promise rejection
Promise.reject(new Error('Manual promise rejection test'));`}
        </pre>
      </div>
    </div>
  );
} 