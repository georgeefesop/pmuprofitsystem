import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase, getSecureSiteUrl } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const redirectUrl = `${getSecureSiteUrl()}/auth/callback`;
    
    console.log('Checking Supabase redirect URL:', redirectUrl);
    
    // Get the current auth settings
    const { data: authSettings, error: settingsError } = await supabase
      .from('_supabase_config')
      .select('*')
      .eq('name', 'auth.email.redirect_urls')
      .single();
    
    if (settingsError) {
      console.error('Error fetching auth settings:', settingsError);
      return NextResponse.json(
        { error: 'Failed to fetch auth settings', details: settingsError },
        { status: 500 }
      );
    }
    
    console.log('Current auth settings:', authSettings);
    
    // Update the redirect URLs in Supabase
    // Note: This is a workaround since we don't have direct access to the Supabase admin API
    // In a production environment, you would use the Supabase dashboard to update these settings
    
    return NextResponse.json({
      success: true,
      message: 'Supabase redirect URL check completed',
      currentSettings: authSettings,
      recommendedRedirectUrl: redirectUrl,
      instructions: 'Please update the redirect URL in the Supabase dashboard to match your environment'
    });
  } catch (error) {
    console.error('Error checking Supabase redirect URL:', error);
    return NextResponse.json(
      { error: 'Failed to check Supabase redirect URL', details: error },
      { status: 500 }
    );
  }
} 