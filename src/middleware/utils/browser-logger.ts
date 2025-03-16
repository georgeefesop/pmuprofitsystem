/**
 * Browser Error Logger Module
 * Provides functionality to inject a browser error logger script into HTML responses
 */

import { NextResponse } from 'next/server';
import { logger } from '../logger';

// Get the current log level from environment variables
const MIDDLEWARE_LOG_LEVEL = (process.env.MIDDLEWARE_LOG_LEVEL || 'info').toUpperCase();
const IS_DEBUG_MODE = MIDDLEWARE_LOG_LEVEL === 'DEBUG';

/**
 * Configuration options for the browser error logger
 */
export interface BrowserLoggerOptions {
  enabled?: boolean;
  logEndpoint?: string;
  captureConsoleErrors?: boolean;
  captureUnhandledErrors?: boolean;
  capturePromiseRejections?: boolean;
  captureReactErrors?: boolean;
}

/**
 * Injects a browser error logger script into HTML responses in development mode
 * This helps capture and log client-side errors to the server
 * 
 * @param response - The NextResponse object to potentially modify
 * @returns The original or modified NextResponse
 */
export async function injectBrowserErrorLogger(response: NextResponse): Promise<NextResponse> {
  // Only inject in development
  if (process.env.NODE_ENV !== 'development') {
    return response;
  }
  
  // Only inject in HTML responses
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('text/html')) {
    return response;
  }
  
  try {
    const html = await response.text();
    
    // Skip if the error logger is already injected
    if (html.includes('Browser error logging enabled')) {
      return response;
    }
    
    // Inject the error logger script
    const modifiedHtml = html.replace(
      '</head>',
      `<script>
// Error logger for development
(function() {
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleLog = console.log;
  
  // Function to get stack trace
  function getStackTrace() {
    try {
      throw new Error('');
    } catch (error) {
      return error.stack || '';
    }
  }
  
  // Function to get component name from stack trace
  function getComponentName(stack) {
    try {
      // Try to extract component name from stack trace
      const stackLines = stack.split('\\n');
      for (let i = 0; i < stackLines.length; i++) {
        const line = stackLines[i];
        // Look for React component names (capitalized)
        const componentMatch = line.match(/at ([A-Z][a-zA-Z0-9]+)/);
        if (componentMatch && componentMatch[1]) {
          return componentMatch[1];
        }
      }
      return 'Unknown Component';
    } catch (e) {
      return 'Unknown Component';
    }
  }
  
  // Function to send errors to the server
  function sendErrorToServer(type, args, extraInfo = {}) {
    try {
      const stack = getStackTrace();
      const componentName = getComponentName(stack);
      
      const errorData = {
        type,
        timestamp: new Date().toISOString(),
        component: componentName,
        url: window.location.href,
        userAgent: navigator.userAgent,
        message: Array.from(args).map(arg => {
          try {
            if (arg instanceof Error) {
              return {
                name: arg.name,
                message: arg.message,
                stack: arg.stack
              };
            }
            return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
          } catch (e) {
            return 'Unstringifiable object';
          }
        }),
        stack: stack.split('\\n').slice(1, 6).join('\\n'), // First 5 lines of stack
        ...extraInfo
      };
      
      fetch('/api/dev-logger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorData)
      }).catch(e => {
        // Silent fail - don't create infinite loops
      });
    } catch (e) {
      // Silent fail
    }
  }
  
  // Override console.error
  console.error = function() {
    sendErrorToServer('error', arguments);
    originalConsoleError.apply(console, arguments);
  };
  
  // Override console.warn
  console.warn = function() {
    sendErrorToServer('warning', arguments);
    originalConsoleWarn.apply(console, arguments);
  };
  
  // Capture unhandled errors
  window.addEventListener('error', function(event) {
    sendErrorToServer('unhandled', [{
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    }], {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });
  
  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    sendErrorToServer('unhandledrejection', [event.reason]);
  });
  
  // Capture React errors
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    const originalOnErrorHandler = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onErrorOrWarning;
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onErrorOrWarning = function(fiber, type, error, componentStack) {
      if (type === 'error') {
        sendErrorToServer('react', [error], {
          componentStack
        });
      }
      if (originalOnErrorHandler) {
        originalOnErrorHandler.call(this, fiber, type, error, componentStack);
      }
    };
  }
  
  console.log('%c🔍 Browser error logging enabled', 'color: purple; font-weight: bold');
})();
</script></head>`
    );
    
    logger.debug('Browser error logger injected into HTML response');
    
    return new NextResponse(modifiedHtml, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  } catch (error) {
    logger.error(`Error injecting browser error logger: ${error instanceof Error ? error.message : String(error)}`);
    return response;
  }
} 