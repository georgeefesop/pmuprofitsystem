require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error('Missing Stripe secret key');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey);

/**
 * Check Stripe webhook configuration
 */
async function checkStripeWebhook() {
  try {
    console.log('Checking Stripe webhook configuration...');
    
    // Check if the webhook secret is configured
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    console.log('Webhook secret configured:', webhookSecret ? 'Yes' : 'No');
    
    if (!webhookSecret) {
      console.log('WARNING: Webhook secret is not configured. This is required for webhook verification.');
    }
    
    // Check the site URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    console.log('Site URL:', siteUrl);
    
    if (!siteUrl) {
      console.log('WARNING: Site URL is not configured. This is required for webhook endpoints.');
    }
    
    // List all webhooks
    console.log('\nListing all webhooks...');
    const webhooks = await stripe.webhookEndpoints.list();
    
    if (webhooks.data.length === 0) {
      console.log('No webhooks found. You need to create a webhook endpoint in the Stripe dashboard.');
      console.log('The webhook endpoint should point to your site URL + /api/webhooks');
      console.log('Example: https://yourdomain.com/api/webhooks');
    } else {
      console.log(`Found ${webhooks.data.length} webhooks:`);
      
      for (const webhook of webhooks.data) {
        console.log(`\nWebhook ID: ${webhook.id}`);
        console.log(`URL: ${webhook.url}`);
        console.log(`Status: ${webhook.status}`);
        console.log(`Events: ${webhook.enabled_events.join(', ')}`);
        
        // Check if the webhook URL matches the site URL
        if (siteUrl && !webhook.url.includes(siteUrl.replace(/^https?:\/\//, '')) && !webhook.url.includes('localhost')) {
          console.log(`WARNING: Webhook URL does not match the configured site URL (${siteUrl})`);
        }
        
        // Check if the webhook is enabled for checkout.session.completed events
        if (!webhook.enabled_events.includes('checkout.session.completed') && !webhook.enabled_events.includes('*')) {
          console.log('WARNING: Webhook is not configured to receive checkout.session.completed events');
        }
      }
    }
    
    // Check recent webhook events
    console.log('\nChecking recent webhook events...');
    const events = await stripe.events.list({ limit: 5 });
    
    if (events.data.length === 0) {
      console.log('No recent events found.');
    } else {
      console.log(`Found ${events.data.length} recent events:`);
      
      for (const event of events.data) {
        console.log(`\nEvent ID: ${event.id}`);
        console.log(`Type: ${event.type}`);
        console.log(`Created: ${new Date(event.created * 1000).toLocaleString()}`);
        
        if (event.type === 'checkout.session.completed') {
          console.log('This is a checkout.session.completed event, which should trigger user creation');
          
          // Check if the event has customer email
          const session = event.data.object;
          if (session.customer_email) {
            console.log(`Customer email: ${session.customer_email}`);
          }
          
          // Check if the event has metadata
          if (session.metadata && Object.keys(session.metadata).length > 0) {
            console.log(`Metadata: ${JSON.stringify(session.metadata)}`);
          }
        }
      }
    }
    
    console.log('\nWebhook check completed');
    console.log('Recommendations:');
    console.log('1. Ensure your webhook endpoint is correctly configured in the Stripe dashboard');
    console.log('2. Make sure the webhook endpoint URL is accessible from the internet');
    console.log('3. Verify that the webhook secret is correctly configured in your environment variables');
    console.log('4. Check that your webhook handler is correctly processing checkout.session.completed events');
    console.log('5. Consider using Stripe CLI to test webhook events locally during development');
    
  } catch (error) {
    console.error('Error checking webhook configuration:', error);
    process.exit(1);
  }
}

// Run the check
checkStripeWebhook(); 