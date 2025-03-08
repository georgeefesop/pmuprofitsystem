'use server';

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Get the user ID from the request body
    const body = await req.json();
    const userId = body.userId || 'test-user-id';
    
    // Set the cookies
    const cookieStore = cookies();
    
    // Set auth-status cookie
    cookieStore.set('auth-status', 'authenticated', {
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    
    // Set a mock auth token
    cookieStore.set('sb-auth-token', `mock-token-${userId}-${Date.now()}`, {
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Auth cookies set successfully',
      userId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error setting auth cookies:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to set auth cookies',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 