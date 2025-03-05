
import { NextRequest, NextResponse } from 'next/server';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
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
                     colors.blue;
    
    console.log(`${colorCode}[BROWSER ${data.type.toUpperCase()}] [${timestamp}]${colors.reset}`);
    
    // Log each message part
    data.message.forEach((msg: string) => {
      console.log(`  ${msg}`);
    });
    
    // Add a separator for readability
    console.log('');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing browser log:', error);
    return NextResponse.json({ success: false });
  }
}
