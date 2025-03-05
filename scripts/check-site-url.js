require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

async function checkSiteUrl() {
  try {
    // Load environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    console.log('Environment variables:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl || 'undefined');
    console.log('- SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '[REDACTED]' : 'undefined');
    console.log('- STRIPE_SECRET_KEY:', stripeSecretKey ? '[REDACTED]' : 'undefined');
    console.log('- NEXT_PUBLIC_SITE_URL:', siteUrl || 'undefined');
    console.log('- STRIPE_WEBHOOK_SECRET:', stripeWebhookSecret ? '[REDACTED]' : 'undefined');

    if (!supabaseUrl || !supabaseServiceKey || !stripeSecretKey) {
      console.error('Missing required environment variables. Please check your .env.local file.');
      process.exit(1);
    }

    // Check site URL configuration
    if (!siteUrl) {
      console.error('NEXT_PUBLIC_SITE_URL is not defined. This is required for proper redirect URLs.');
      console.log('Please add NEXT_PUBLIC_SITE_URL to your .env.local file:');
      console.log('For local development: NEXT_PUBLIC_SITE_URL=http://localhost:3000');
      console.log('For production: NEXT_PUBLIC_SITE_URL=https://pmuprofitsystem.com');
      process.exit(1);
    }

    // Check if site URL has protocol
    if (!siteUrl.startsWith('http://') && !siteUrl.startsWith('https://')) {
      console.error('NEXT_PUBLIC_SITE_URL must include the protocol (http:// or https://)');
      console.log('Current value:', siteUrl);
      console.log('Please update to include the protocol.');
      process.exit(1);
    }

    // Check if site URL has trailing slash
    if (siteUrl.endsWith('/')) {
      console.warn('Warning: NEXT_PUBLIC_SITE_URL has a trailing slash. This may cause issues with URL construction.');
      console.log('Current value:', siteUrl);
      console.log('Consider removing the trailing slash.');
    }

    // Check protocol mismatch between Supabase URL and site URL
    const supabaseProtocol = supabaseUrl.startsWith('https://') ? 'https' : 'http';
    const siteProtocol = siteUrl.startsWith('https://') ? 'https' : 'http';

    if (supabaseProtocol !== siteProtocol) {
      console.warn('Warning: Protocol mismatch between Supabase URL and site URL.');
      console.log('Supabase URL protocol:', supabaseProtocol);
      console.log('Site URL protocol:', siteProtocol);
      console.log('This may cause CORS issues. Consider using the same protocol for both.');
    }

    // Initialize Supabase client
    console.log('\nInitializing Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Test Supabase connection
    console.log('Testing Supabase connection...');
    const { data: connectionTest, error: connectionError } = await supabase.from('users').select('count').limit(1);
    
    if (connectionError) {
      console.error('Error connecting to Supabase:', connectionError.message);
      console.log('Please check your Supabase URL and service role key.');
      process.exit(1);
    }
    
    console.log('Supabase connection successful');

    // Initialize Stripe
    console.log('\nInitializing Stripe client...');
    const stripe = new Stripe(stripeSecretKey);

    // Test Stripe connection
    console.log('Testing Stripe connection...');
    try {
      const account = await stripe.account.retrieve();
      console.log('Stripe connection successful');
      console.log('Account ID:', account.id);
    } catch (error) {
      console.error('Error connecting to Stripe:', error.message);
      console.log('Please check your Stripe secret key.');
      process.exit(1);
    }

    // Check Stripe webhook configuration
    if (!stripeWebhookSecret) {
      console.warn('Warning: STRIPE_WEBHOOK_SECRET is not defined.');
      console.log('This is required for verifying Stripe webhook events.');
      console.log('Please add STRIPE_WEBHOOK_SECRET to your .env.local file.');
    }

    // Test creating a checkout session with the site URL
    console.log('\nTesting checkout session creation with site URL...');
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: 'Test Product',
              },
              unit_amount: 1000,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/checkout`,
        expires_at: Math.floor(Date.now() / 1000) + 60 * 30, // Expires in 30 minutes
      });

      console.log('Checkout session created successfully');
      console.log('Session ID:', session.id);
      console.log('Success URL:', session.success_url);
      console.log('Cancel URL:', session.cancel_url);
    } catch (error) {
      console.error('Error creating checkout session:', error.message);
      console.log('This may indicate an issue with the site URL configuration.');
      process.exit(1);
    }

    // Check for local development vs production
    if (siteUrl.includes('localhost')) {
      console.log('\nLocal development environment detected.');
      console.log('For local testing of webhooks, consider using Stripe CLI:');
      console.log('stripe listen --forward-to http://localhost:3000/api/webhooks');
    } else {
      console.log('\nProduction environment detected.');
      console.log('Ensure your Stripe webhook endpoint is configured correctly:');
      console.log(`${siteUrl}/api/webhooks`);
    }

    console.log('\nSite URL configuration check completed successfully.');
    
  } catch (error) {
    console.error('Unexpected error during site URL check:', error);
    process.exit(1);
  }
}

checkSiteUrl()
  .then(() => {
    console.log('Script execution completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script execution failed:', err);
    process.exit(1);
  }); 