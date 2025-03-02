import { NextRequest, NextResponse } from 'next/server';

export function GET(request: NextRequest) {
  // Only allow access in development mode
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // In development, allow access to the page
  return NextResponse.next();
} 