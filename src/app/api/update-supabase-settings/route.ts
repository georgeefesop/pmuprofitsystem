import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase, getSecureSiteUrl } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const redirectUrl = `${getSecureSiteUrl()}/auth/callback`;
    
    console.log('Attempting to update Supabase settings...');
    
    // Get the current auth settings
    const { data: authSettings, error: settingsError } = await supabase.auth.admin.listUsers();
    
    if (settingsError) {
      console.error('Error accessing Supabase admin API:', settingsError);
      return NextResponse.json(
        { error: 'Failed to access Supabase admin API', details: settingsError },
        { status: 500 }
      );
    }
    
    // Get the current site URL
    const siteUrl = getSecureSiteUrl();
    
    // Instructions for updating Supabase settings
    const instructions = `
    To update your Supabase settings:
    
    1. Go to the Supabase dashboard: https://app.supabase.com/project/_/auth/url-configuration
    2. Add the following redirect URL: ${redirectUrl}
    3. Save your changes
    
    This will ensure that email verification links work correctly.
    
    Additionally, check your email templates:
    1. Go to https://app.supabase.com/project/_/auth/templates
    2. Ensure the email templates are properly configured
    
    For local development, you can use the test email service that's now implemented.
    When you resend a verification email, you'll get a link to view the test email.
    `;
    
    return NextResponse.json({
      success: true,
      message: 'Supabase settings check completed',
      siteUrl,
      redirectUrl,
      instructions
    });
  } catch (error) {
    console.error('Error checking Supabase settings:', error);
    return NextResponse.json(
      { error: 'Failed to check Supabase settings', details: error },
      { status: 500 }
    );
  }
} 