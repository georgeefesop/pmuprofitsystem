import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/middleware';

// Function to inject the browser error logger into HTML responses
async function injectBrowserErrorLogger(response: NextResponse): Promise<NextResponse> {
  // Only inject in development mode
  if (process.env.NODE_ENV !== 'development') {
    // Browser error logger injection (development only)
  if (process.env.NODE_ENV === 'development') {
    const response = response;
    
    // Only inject in HTML responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      const html = await response.text();
      
      // Inject the error logger script
      const modifiedHtml = html.replace(
        '</head>',
        `<script>

// Error logger for development
(function() {
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleLog = console.log;
  const originalConsoleInfo = console.info;
  const originalConsoleDebug = console.debug;
  
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
      const stackLines = stack.split('\n');
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
  
  // Function to send logs to the server
  function sendLogToServer(type, args, extraInfo = {}) {
    try {
      const stack = getStackTrace();
      const componentName = getComponentName(stack);
      
      const logData = {
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
        stack: stack.split('\n').slice(1, 6).join('\n'), // First 5 lines of stack
        ...extraInfo
      };
      
      fetch('/api/dev-logger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logData)
      }).catch(e => {
        // Silent fail - don't create infinite loops
      });
    } catch (e) {
      // Silent fail
    }
  }
  
  // Override console.error
  console.error = function() {
    sendLogToServer('error', arguments);
    originalConsoleError.apply(console, arguments);
  };
  
  // Override console.warn
  console.warn = function() {
    sendLogToServer('warning', arguments);
    originalConsoleWarn.apply(console, arguments);
  };
  
  // Override console.log
  console.log = function() {
    sendLogToServer('log', arguments);
    originalConsoleLog.apply(console, arguments);
  };
  
  // Override console.info
  console.info = function() {
    sendLogToServer('info', arguments);
    originalConsoleInfo.apply(console, arguments);
  };
  
  // Override console.debug
  console.debug = function() {
    sendLogToServer('debug', arguments);
    originalConsoleDebug.apply(console, arguments);
  };
  
  // Capture unhandled errors
  window.addEventListener('error', function(event) {
    sendLogToServer('unhandled', [{
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
    sendLogToServer('unhandledrejection', [event.reason]);
  });
  
  // Capture React errors
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    const originalOnErrorHandler = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onErrorOrWarning;
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onErrorOrWarning = function(fiber, type, error, componentStack) {
      if (type === 'error') {
        sendLogToServer('react', [error], {
          componentStack
        });
      }
      if (originalOnErrorHandler) {
        originalOnErrorHandler.call(this, fiber, type, error, componentStack);
      }
    };
  }
  
  console.log('%c🔍 Browser console logging enabled - all console output will be visible in the terminal', 'color: purple; font-weight: bold');
})();

</script></head>`
      );
      
      return new NextResponse(modifiedHtml, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    }
    
    return response;
  }
  
  return response;
  }
  
  // Only inject in HTML responses
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('text/html')) {
    return response;
  }
  
  try {
    const html = await response.text();
    
    // Check if the error logger is already injected
    if (html.includes('Browser console logging enabled')) {
      return response;
    }
    
    // Inject the error logger script
    const modifiedHtml = html.replace(
      '</head>',
      `<script>

// Console logger for development
(function() {
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleLog = console.log;
  const originalConsoleInfo = console.info;
  const originalConsoleDebug = console.debug;
  
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
  
  // Function to send logs to the server
  function sendLogToServer(type, args, extraInfo = {}) {
    try {
      const stack = getStackTrace();
      const componentName = getComponentName(stack);
      
      const logData = {
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
        body: JSON.stringify(logData)
      }).catch(e => {
        // Silent fail - don't create infinite loops
      });
    } catch (e) {
      // Silent fail
    }
  }
  
  // Override console.error
  console.error = function() {
    sendLogToServer('error', arguments);
    originalConsoleError.apply(console, arguments);
  };
  
  // Override console.warn
  console.warn = function() {
    sendLogToServer('warning', arguments);
    originalConsoleWarn.apply(console, arguments);
  };
  
  // Override console.log
  console.log = function() {
    sendLogToServer('log', arguments);
    originalConsoleLog.apply(console, arguments);
  };
  
  // Override console.info
  console.info = function() {
    sendLogToServer('info', arguments);
    originalConsoleInfo.apply(console, arguments);
  };
  
  // Override console.debug
  console.debug = function() {
    sendLogToServer('debug', arguments);
    originalConsoleDebug.apply(console, arguments);
  };
  
  // Capture unhandled errors
  window.addEventListener('error', function(event) {
    sendLogToServer('unhandled', [{
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
    sendLogToServer('unhandledrejection', [event.reason]);
  });
  
  // Capture React errors
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    const originalOnErrorHandler = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onErrorOrWarning;
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onErrorOrWarning = function(fiber, type, error, componentStack) {
      if (type === 'error') {
        sendLogToServer('react', [error], {
          componentStack
        });
      }
      if (originalOnErrorHandler) {
        originalOnErrorHandler.call(this, fiber, type, error, componentStack);
      }
    };
  }
  
  console.log('%c🔍 Browser console logging enabled - all console output will be visible in the terminal', 'color: purple; font-weight: bold');
})();

</script></head>`
    );
    
    return new NextResponse(modifiedHtml, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  } catch (error) {
    console.error('Error injecting browser error logger:', error);
    return response;
  }
}

export async function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;
  
  // Define protected routes that require authentication
  const isProtectedRoute = path.startsWith('/dashboard');
  
  // Create a Supabase client
  const { supabase, response } = createClient(request);
  
  // Get the user's session
  const { data: { session } } = await supabase.auth.getSession();
  
  // If the route is protected and the user is not authenticated,
  // redirect to the login page with the original URL as a redirect parameter
  if (isProtectedRoute && !session) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', path);
    
    // Create the redirect response
    const redirectResponse = NextResponse.redirect(url);
    
    // Inject the browser error logger
    return await injectBrowserErrorLogger(redirectResponse);
  }
  
  // If the user is authenticated and trying to access the dashboard,
  // check if they have purchased the main product
  if (isProtectedRoute && session) {
    try {
      // Check if the user has purchased the main product
      const { data: purchases } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('product_id', 'pmu-profit-system')
        .eq('status', 'completed');
      
      // If the user hasn't purchased the main product, redirect to checkout
      if (!purchases || purchases.length === 0) {
        console.log('User has not purchased the main product, redirecting to checkout');
        const redirectResponse = NextResponse.redirect(new URL('/checkout', request.url));
        
        // Inject the browser error logger
        return await injectBrowserErrorLogger(redirectResponse);
      }
    } catch (error) {
      console.error('Error checking purchases:', error);
      // If there's an error, allow access to avoid blocking legitimate users
    }
  }
  
  // Inject the browser error logger into the response for all pages
  return await injectBrowserErrorLogger(response);
}

// Configure the middleware to run on all pages
export const config = {
  matcher: [
    // Match all routes
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 