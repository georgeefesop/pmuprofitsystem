const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function testCheckout() {
  try {
    console.log('Starting checkout test...');
    
    // Generate a unique test email
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'Test123456!';
    const testName = 'Test User';
    
    console.log(`Creating test user: ${testEmail}`);
    
    // Create a test user
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        full_name: testName
      }
    });
    
    if (userError) {
      console.error('Error creating test user:', userError);
      return;
    }
    
    console.log('Test user created successfully:', userData.user.id);
    
    // Create a test purchase
    console.log('Creating test purchase...');
    
    const { error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        user_id: userData.user.id,
        product_id: 'pmu-profit-system',
        amount: 37,
        status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (purchaseError) {
      console.error('Error creating test purchase:', purchaseError);
      return;
    }
    
    console.log('Test purchase created successfully');
    
    // Create a test Stripe checkout session
    console.log('Creating test Stripe checkout session...');
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'PMU Profit System',
              description: 'Complete course for PMU business growth',
            },
            unit_amount: 3700, // $37.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `http://localhost:3000/checkout/success`,
      cancel_url: `http://localhost:3000/checkout?cancelled=true`,
      customer_email: testEmail,
      metadata: {
        userId: userData.user.id,
        email: testEmail,
        fullName: testName
      },
    });
    
    console.log('Test Stripe checkout session created successfully:', session.id);
    console.log('Checkout URL:', session.url);
    
    console.log('\nTest completed successfully!');
    console.log('Test user email:', testEmail);
    console.log('Test user password:', testPassword);
    console.log('Test user ID:', userData.user.id);
    
  } catch (error) {
    console.error('Error in test checkout:', error);
  }
}

testCheckout(); 