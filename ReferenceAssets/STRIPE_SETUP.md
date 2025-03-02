# Setting Up Stripe Test Mode

This guide will help you set up Stripe in test mode for the PMU Profit System checkout flow.

## 1. Stripe Test Keys

Add the following environment variables to your `.env.local` file:

```
# Stripe Configuration (Test Mode)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

Replace the placeholder values with your actual Stripe test API keys from your Stripe dashboard.

## 2. Test Credit Card Information

When testing the checkout flow, use these Stripe test card numbers:

| Card Type | Number | Expiry | CVC | ZIP |
|-----------|--------|--------|-----|-----|
| Visa (Success) | 4242 4242 4242 4242 | Any future date | Any 3 digits | Any 5 digits |
| Visa (Decline) | 4000 0000 0000 0002 | Any future date | Any 3 digits | Any 5 digits |
| Mastercard (Success) | 5555 5555 5555 4444 | Any future date | Any 3 digits | Any 5 digits |
| 3D Secure | 4000 0000 0000 3220 | Any future date | Any 3 digits | Any 5 digits |

## 3. Testing Webhook Events

For local testing with webhooks:
1. Install the Stripe CLI: https://stripe.com/docs/stripe-cli
2. Run `stripe listen --forward-to localhost:3000/api/webhooks`
3. Add the webhook signing secret to your `.env.local`:
```
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_key_here
```

## 4. Testing the Checkout Flow

1. Start your development server: `npm run dev`
2. Navigate to the checkout page
3. Fill in the form with test data
4. Complete the purchase using a test card
5. You should be redirected to the success page

## 5. Verifying Test Payments

1. Check your Stripe dashboard under "Payments" to see test transactions
2. Verify that webhook events are being processed correctly
3. Confirm that user accounts and purchases are being created in Supabase

## 6. Common Test Scenarios

- **Successful Payment**: Use card 4242 4242 4242 4242
- **Failed Payment**: Use card 4000 0000 0000 0002
- **3D Secure Authentication**: Use card 4000 0000 0000 3220
- **Insufficient Funds**: Use card 4000 0000 0000 9995

Remember that in test mode, no actual charges will be made. 