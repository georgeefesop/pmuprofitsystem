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
 * Set up a Stripe webhook for the site
 */
async function setupStripeWebhook() {
  try {
    console.log('Setting up Stripe webhook...');
    
    // Check if the site URL is configured
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) {
      console.error('Missing site URL in environment variables');
      console.log('Please set NEXT_PUBLIC_SITE_URL in your .env.local file');
      process.exit(1);
    }
    
    console.log('Using site URL:', siteUrl);
    
    // Check if a webhook already exists for this site
    console.log('Checking for existing webhooks...');
    const webhooks = await stripe.webhookEndpoints.list();
    
    const webhookUrl = `${siteUrl}/api/webhooks`;
    const existingWebhook = webhooks.data.find(webhook => webhook.url === webhookUrl);
    
    if (existingWebhook) {
      console.log('Webhook already exists for this site:');
      console.log('  Webhook ID:', existingWebhook.id);
      console.log('  URL:', existingWebhook.url);
      console.log('  Status:', existingWebhook.status);
      console.log('  Events:', existingWebhook.enabled_events.join(', '));
      
      // Check if the webhook is enabled for checkout.session.completed events
      if (!existingWebhook.enabled_events.includes('checkout.session.completed') && !existingWebhook.enabled_events.includes('*')) {
        console.log('Updating webhook to include checkout.session.completed events...');
        
        const updatedWebhook = await stripe.webhookEndpoints.update(existingWebhook.id, {
          enabled_events: [...existingWebhook.enabled_events, 'checkout.session.completed'],
        });
        
        console.log('Webhook updated successfully:');
        console.log('  Events:', updatedWebhook.enabled_events.join(', '));
      }
      
      console.log('\nWebhook is already set up correctly');
    } else {
      console.log('No webhook found for this site, creating a new one...');
      
      // Create a new webhook
      const newWebhook = await stripe.webhookEndpoints.create({
        url: webhookUrl,
        enabled_events: [
          'checkout.session.completed',
          'payment_intent.succeeded',
          'payment_intent.payment_failed',
        ],
        description: 'Webhook for PMU Profit System',
      });
      
      console.log('Webhook created successfully:');
      console.log('  Webhook ID:', newWebhook.id);
      console.log('  URL:', newWebhook.url);
      console.log('  Status:', newWebhook.status);
      console.log('  Events:', newWebhook.enabled_events.join(', '));
      console.log('  Secret:', newWebhook.secret);
      
      console.log('\nIMPORTANT: Update your .env.local file with the webhook secret:');
      console.log(`STRIPE_WEBHOOK_SECRET=${newWebhook.secret}`);
    }
    
    console.log('\nWebhook setup completed');
    console.log('Make sure your server is accessible from the internet');
    console.log('You can test the webhook using the Stripe CLI:');
    console.log('stripe listen --forward-to localhost:3000/api/webhooks');
    
  } catch (error) {
    console.error('Error setting up webhook:', error);
    process.exit(1);
  }
}

// Run the setup
setupStripeWebhook(); 