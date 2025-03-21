const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Function to log with colors that works in all environments
function colorLog(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

// Update the error logging script content to include more detailed error information
const errorLoggerScript = `
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
`;

// Update the API route content to display more detailed error information
const apiRouteContent = `
import { NextRequest, NextResponse } from 'next/server';

// Colors for console output
const colors = {
  reset: '\\x1b[0m',
  red: '\\x1b[31m',
  yellow: '\\x1b[33m',
  blue: '\\x1b[34m',
  magenta: '\\x1b[35m',
  cyan: '\\x1b[36m',
  green: '\\x1b[32m',
  gray: '\\x1b[90m',
};

export async function POST(req: NextRequest) {
  // Only process in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ success: false, message: 'Only available in development' });
  }
  
  try {
    const data = await req.json();
    
    // Format the error message
    const timestamp = new Date(data.timestamp).toLocaleTimeString();
    const colorCode = data.type === 'error' ? colors.red : 
                     data.type === 'warning' ? colors.yellow : 
                     data.type === 'unhandled' ? colors.magenta : 
                     data.type === 'unhandledrejection' ? colors.magenta : 
                     data.type === 'react' ? colors.cyan :
                     colors.blue;
    
    // Print header with timestamp, type, component, and URL
    console.log(\`\${colorCode}[BROWSER \${data.type.toUpperCase()}]\${colors.reset} [\${timestamp}] in \${colors.cyan}\${data.component || 'Unknown'}\${colors.reset} at \${colors.blue}\${data.url || 'Unknown URL'}\${colors.reset}\`);
    
    // Log each message part
    data.message.forEach((msg: string) => {
      if (typeof msg === 'object') {
        try {
          const parsed = JSON.parse(msg);
          console.log(\`  \${JSON.stringify(parsed, null, 2)}\`);
        } catch (e) {
          console.log(\`  \${msg}\`);
        }
      } else {
        console.log(\`  \${msg}\`);
      }
    });
    
    // Log stack trace if available
    if (data.stack) {
      console.log(\`\${colors.gray}  Stack trace:\${colors.reset}\`);
      data.stack.split('\\n').forEach((line: string) => {
        console.log(\`  \${colors.gray}\${line}\${colors.reset}\`);
      });
    }
    
    // Log additional information if available
    if (data.filename && data.lineno) {
      console.log(\`\${colors.gray}  Location: \${data.filename}:\${data.lineno}:\${data.colno || 0}\${colors.reset}\`);
    }
    
    if (data.componentStack) {
      console.log(\`\${colors.gray}  Component stack:\${colors.reset}\`);
      data.componentStack.split('\\n').forEach((line: string) => {
        console.log(\`  \${colors.gray}\${line.trim()}\${colors.reset}\`);
      });
    }
    
    // Add a separator for readability
    console.log('');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing browser log:', error);
    return NextResponse.json({ success: false });
  }
}
`;

// Function to inject the error logger script into the HTML
function injectErrorLogger() {
  try {
    colorLog(colors.cyan, '=== Browser Error Logger ===\n');
    colorLog(colors.blue, 'Setting up browser error logging...');
    
    // Create the API route for receiving errors
    const apiDir = path.join(process.cwd(), 'src', 'app', 'api', 'dev-logger');
    const apiFilePath = path.join(apiDir, 'route.ts');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(apiDir)) {
      fs.mkdirSync(apiDir, { recursive: true });
      colorLog(colors.green, 'Created API directory for error logger');
    }
    
    // Create the API route file
    fs.writeFileSync(apiFilePath, apiRouteContent);
    colorLog(colors.green, `Created API route at ${apiFilePath}`);
    
    // Check if middleware/index.ts exists before creating middleware.ts
    const middlewareDirPath = path.join(process.cwd(), 'src', 'middleware');
    const middlewareIndexPath = path.join(middlewareDirPath, 'index.ts');
    const middlewarePath = path.join(process.cwd(), 'src', 'middleware.ts');

    // Check if the new modular middleware structure exists
    const hasModularMiddleware = fs.existsSync(middlewareDirPath) && fs.existsSync(middlewareIndexPath);

    // Check if we should preserve the middleware file
    const shouldPreserveMiddleware = process.env.PRESERVE_MIDDLEWARE === 'true';

    if (hasModularMiddleware) {
      // If middleware/index.ts exists, check if middleware.ts is a proper import
      if (fs.existsSync(middlewarePath)) {
        try {
          // Read the content of middleware.ts
          const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
          
          // Check if it's a proper import of the modular middleware
          if (middlewareContent.includes("import { middleware, config } from './middleware/index'") || 
              middlewareContent.includes("import { middleware, config } from './middleware/implementation'") || 
              shouldPreserveMiddleware) {
            // This is a proper import, keep the file
            colorLog(colors.green, 'Found proper middleware.ts file that imports the modular middleware');
          } else {
            // This is not a proper import, create a backup and remove it
            const backupPath = path.join(process.cwd(), 'src', 'middleware.ts.backup');
            fs.copyFileSync(middlewarePath, backupPath);
            fs.unlinkSync(middlewarePath);
            colorLog(colors.yellow, `Removed conflicting middleware.ts file (backup created at ${backupPath})`);
            
            // Create a proper middleware.ts file
            const properMiddlewareContent = `/**
 * Next.js Middleware Entry Point
 * 
 * This file serves as the entry point for Next.js middleware.
 * It imports and re-exports the middleware implementation from the modular structure.
 * 
 * Next.js requires this file to be in the src directory to register middleware.
 */

import { middleware, config } from './middleware/implementation';

export { middleware, config };`;
            fs.writeFileSync(middlewarePath, properMiddlewareContent);
            colorLog(colors.green, `Created proper middleware.ts file that imports the modular middleware`);
          }
        } catch (err) {
          colorLog(colors.yellow, `Warning: Could not check middleware.ts file: ${err.message}`);
        }
      } else if (!shouldPreserveMiddleware) {
        // Create a proper middleware.ts file
        const properMiddlewareContent = `/**
 * Next.js Middleware Entry Point
 * 
 * This file serves as the entry point for Next.js middleware.
 * It imports and re-exports the middleware implementation from the modular structure.
 * 
 * Next.js requires this file to be in the src directory to register middleware.
 */

import { middleware, config } from './middleware/implementation';

export { middleware, config };`;
        fs.writeFileSync(middlewarePath, properMiddlewareContent);
        colorLog(colors.green, `Created proper middleware.ts file that imports the modular middleware`);
      }
      colorLog(colors.green, 'Error logger already injected in middleware');
    } else if (!fs.existsSync(middlewarePath) && !shouldPreserveMiddleware) {
      // Only create middleware.ts if it doesn't exist and middleware/index.ts doesn't exist
      const middlewareContent = `import { NextRequest, NextResponse } from 'next/server';

// Browser error logger
export async function middleware(request: NextRequest) {
  // Process the request normally
  const response = NextResponse.next();
  
  // Only inject in development
  if (process.env.NODE_ENV === 'development') {
    // Only inject in HTML responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      const html = await response.text();
      
      // Inject the error logger script
      const modifiedHtml = html.replace(
        '</head>',
        \`<script>\n${errorLoggerScript}\n</script></head>\`
      );
      
      return new NextResponse(modifiedHtml, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    }
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (API endpoints)
     */
    {
      source: '/((?!_next/static|_next/image|favicon.ico|api/).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
`;
      
      fs.writeFileSync(middlewarePath, middlewareContent);
      colorLog(colors.green, `Created middleware at ${middlewarePath}`);
    }
    
    colorLog(colors.green, '\nBrowser error logger setup complete!');
    colorLog(colors.cyan, 'Now browser console errors will be automatically logged to your terminal.');
    colorLog(colors.yellow, 'Note: You need to restart your development server for changes to take effect.\n');
  } catch (error) {
    colorLog(colors.red, 'Error setting up browser error logger:');
    console.error(error);
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  injectErrorLogger();
}

module.exports = { injectErrorLogger }; 