import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Configure this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    // Create a Supabase client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    // Check if all required environment variables are set
    const envCheck = {
      supabaseUrl: {
        exists: !!supabaseUrl,
        value: supabaseUrl ? `${supabaseUrl.substring(0, 15)}...` : 'missing',
        protocol: supabaseUrl ? (supabaseUrl.startsWith('https') ? 'https' : 'http') : 'unknown'
      },
      supabaseServiceKey: {
        exists: !!supabaseServiceKey,
        value: supabaseServiceKey ? `${supabaseServiceKey.substring(0, 5)}...` : 'missing'
      },
      stripeSecretKey: {
        exists: !!stripeSecretKey,
        value: stripeSecretKey ? `${stripeSecretKey.substring(0, 5)}...` : 'missing'
      },
      stripeWebhookSecret: {
        exists: !!stripeWebhookSecret,
        value: stripeWebhookSecret ? `${stripeWebhookSecret.substring(0, 5)}...` : 'missing'
      },
      siteUrl: {
        exists: !!process.env.NEXT_PUBLIC_SITE_URL,
        value: process.env.NEXT_PUBLIC_SITE_URL || 'missing',
        protocol: process.env.NEXT_PUBLIC_SITE_URL ? 
          (process.env.NEXT_PUBLIC_SITE_URL.startsWith('https') ? 'https' : 'http') : 'unknown'
      }
    };
    
    // Check for protocol mismatch
    const protocolMismatch = 
      envCheck.supabaseUrl.protocol === 'http' && 
      envCheck.siteUrl.protocol === 'https';
    
    // Test Supabase connection if credentials exist
    let supabaseStatus: { connected: boolean; error: string | null; details?: any } = { connected: false, error: null };
    if (supabaseUrl && supabaseServiceKey) {
      try {
        console.time('supabase-connection-test');
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // Test basic query
        const { data, error } = await supabase.from('users').select('count').limit(1);
        
        if (error) {
          supabaseStatus.error = error.message;
          supabaseStatus.details = {
            code: error.code,
            hint: error.hint,
            details: error.details
          };
        } else {
          // Test auth functionality
          const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
          
          if (authError) {
            supabaseStatus.error = `Database connected but auth failed: ${authError.message}`;
            supabaseStatus.details = {
              code: authError.code,
              name: authError.name,
              status: authError.status
            };
          } else {
            supabaseStatus.connected = true;
            supabaseStatus.details = {
              userCount: authData?.users?.length || 0,
              queryTime: 0 // Will be updated below
            };
          }
        }
        console.timeEnd('supabase-connection-test');
        
        // Get the query time (approximate)
        const queryTimeMatch = console.timeEnd.toString().match(/(\d+\.\d+)ms/);
        if (queryTimeMatch && queryTimeMatch[1]) {
          if (supabaseStatus.details) {
            supabaseStatus.details.queryTime = parseFloat(queryTimeMatch[1]);
          }
        }
      } catch (error) {
        supabaseStatus.error = error instanceof Error ? error.message : String(error);
        
        // Check for specific error types
        if (supabaseStatus.error.includes('ERR_NAME_NOT_RESOLVED')) {
          supabaseStatus.details = {
            type: 'DNS_ERROR',
            suggestion: 'Check if the Supabase URL is correct and your DNS is working properly'
          };
        } else if (supabaseStatus.error.includes('CORS')) {
          supabaseStatus.details = {
            type: 'CORS_ERROR',
            suggestion: 'CORS policy is preventing the connection. Check Supabase CORS settings.'
          };
        }
      }
    }
    
    // Test Stripe connection if credentials exist
    let stripeStatus: { connected: boolean; error: string | null; details?: any } = { connected: false, error: null };
    if (stripeSecretKey) {
      try {
        console.time('stripe-connection-test');
        const stripe = new Stripe(stripeSecretKey, {
          apiVersion: '2023-10-16' as any,
        });
        
        // Try to fetch a simple resource to test connection
        const balance = await stripe.balance.retrieve();
        stripeStatus.connected = true;
        stripeStatus.details = {
          available: balance.available.map(b => ({ amount: b.amount, currency: b.currency })),
          pending: balance.pending.map(b => ({ amount: b.amount, currency: b.currency }))
        };
        console.timeEnd('stripe-connection-test');
      } catch (error) {
        stripeStatus.error = error instanceof Error ? error.message : String(error);
        
        // Check for specific Stripe error types
        if (error instanceof Error) {
          const stripeError = error as any;
          if (stripeError.type) {
            stripeStatus.details = {
              type: stripeError.type,
              code: stripeError.code,
              statusCode: stripeError.statusCode
            };
          }
        }
      }
    }
    
    // Check for network connectivity
    let networkStatus = { online: true };
    if (typeof window !== 'undefined') {
      networkStatus.online = window.navigator.onLine;
    }
    
    // Get server timing information
    const serverTiming = {
      timestamp: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      uptime: process.uptime()
    };
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      environmentVariables: envCheck,
      protocolMismatch,
      supabase: supabaseStatus,
      stripe: stripeStatus,
      network: networkStatus,
      server: serverTiming,
      recommendations: getRecommendations(envCheck, supabaseStatus, stripeStatus, protocolMismatch)
    });
    
  } catch (error) {
    console.error('Error in test API:', error);
    return NextResponse.json({ 
      error: 'Unexpected error', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Helper function to generate recommendations based on test results
function getRecommendations(
  envCheck: any, 
  supabaseStatus: { connected: boolean; error: string | null; details?: any },
  stripeStatus: { connected: boolean; error: string | null; details?: any },
  protocolMismatch: boolean
) {
  const recommendations = [];
  
  // Check environment variables
  if (!envCheck.supabaseUrl.exists) {
    recommendations.push('Set the NEXT_PUBLIC_SUPABASE_URL environment variable');
  }
  
  if (!envCheck.supabaseServiceKey.exists) {
    recommendations.push('Set the SUPABASE_SERVICE_ROLE_KEY environment variable');
  }
  
  if (!envCheck.stripeSecretKey.exists) {
    recommendations.push('Set the STRIPE_SECRET_KEY environment variable');
  }
  
  if (!envCheck.stripeWebhookSecret.exists) {
    recommendations.push('Set the STRIPE_WEBHOOK_SECRET environment variable');
  }
  
  // Check for protocol mismatch
  if (protocolMismatch) {
    recommendations.push('Fix protocol mismatch: Your site is using HTTPS but Supabase URL is using HTTP. Update NEXT_PUBLIC_SUPABASE_URL to use HTTPS.');
  }
  
  // Check Supabase connection
  if (!supabaseStatus.connected) {
    if (supabaseStatus.error?.includes('ERR_NAME_NOT_RESOLVED')) {
      recommendations.push('DNS resolution error: Check if the Supabase URL is correct and your DNS is working properly');
    } else if (supabaseStatus.error?.includes('CORS')) {
      recommendations.push('CORS error: Update your Supabase project CORS settings to allow requests from your domain');
    } else if (supabaseStatus.error) {
      recommendations.push(`Supabase connection error: ${supabaseStatus.error}`);
    }
  }
  
  // Check Stripe connection
  if (!stripeStatus.connected) {
    if (stripeStatus.error?.includes('invalid api key')) {
      recommendations.push('Invalid Stripe API key: Check your STRIPE_SECRET_KEY environment variable');
    } else if (stripeStatus.error) {
      recommendations.push(`Stripe connection error: ${stripeStatus.error}`);
    }
  }
  
  return recommendations;
} 