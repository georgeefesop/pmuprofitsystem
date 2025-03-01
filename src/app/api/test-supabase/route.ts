import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Test connection by querying a non-existent table
    const { data, error } = await supabase.from('_test').select('*').limit(1).maybeSingle();
    
    let status = 'unknown';
    let message = '';
    
    if (error) {
      if (error.code === 'PGRST301') {
        // This error means the table doesn't exist, but the connection works
        status = 'success';
        message = 'Connected to Supabase successfully! (Table does not exist, but connection works)';
      } else {
        status = 'error';
        message = `Error connecting to Supabase: ${error.message}`;
      }
    } else {
      status = 'success';
      message = 'Connected to Supabase successfully!';
    }
    
    // Now try to query the users table if it exists
    const { data: usersData, error: usersError } = await supabase.from('users').select('*').limit(1);
    
    let usersStatus = 'unknown';
    let usersMessage = '';
    
    if (usersError) {
      if (usersError.code === 'PGRST301') {
        usersStatus = 'error';
        usersMessage = 'Users table does not exist. Please run the SQL setup script.';
      } else {
        usersStatus = 'error';
        usersMessage = `Error querying users table: ${usersError.message}`;
      }
    } else {
      usersStatus = 'success';
      usersMessage = 'Users table exists and is accessible.';
    }
    
    return NextResponse.json({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      connectionStatus: status,
      connectionMessage: message,
      usersTableStatus: usersStatus,
      usersTableMessage: usersMessage,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: `Unexpected error: ${error.message}`,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 