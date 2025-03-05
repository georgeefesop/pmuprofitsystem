
import { NextRequest, NextResponse } from 'next/server';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  gray: '\x1b[90m',
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
    console.log(`${colorCode}[BROWSER ${data.type.toUpperCase()}]${colors.reset} [${timestamp}] in ${colors.cyan}${data.component || 'Unknown'}${colors.reset} at ${colors.blue}${data.url || 'Unknown URL'}${colors.reset}`);
    
    // Log each message part
    data.message.forEach((msg: string) => {
      if (typeof msg === 'object') {
        try {
          const parsed = JSON.parse(msg);
          console.log(`  ${JSON.stringify(parsed, null, 2)}`);
        } catch (e) {
          console.log(`  ${msg}`);
        }
      } else {
        console.log(`  ${msg}`);
      }
    });
    
    // Log stack trace if available
    if (data.stack) {
      console.log(`${colors.gray}  Stack trace:${colors.reset}`);
      data.stack.split('\n').forEach((line: string) => {
        console.log(`  ${colors.gray}${line}${colors.reset}`);
      });
    }
    
    // Log additional information if available
    if (data.filename && data.lineno) {
      console.log(`${colors.gray}  Location: ${data.filename}:${data.lineno}:${data.colno || 0}${colors.reset}`);
    }
    
    if (data.componentStack) {
      console.log(`${colors.gray}  Component stack:${colors.reset}`);
      data.componentStack.split('\n').forEach((line: string) => {
        console.log(`  ${colors.gray}${line.trim()}${colors.reset}`);
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
