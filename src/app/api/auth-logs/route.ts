import { NextResponse } from 'next/server';
import { getAuthLogs } from '@/middleware';

export async function GET() {
  try {
    const logs = getAuthLogs();
    return NextResponse.json({ logs }, { status: 200 });
  } catch (error) {
    console.error('Error retrieving auth logs:', error);
    return NextResponse.json({ error: 'Failed to retrieve auth logs' }, { status: 500 });
  }
} 