# Testing Documentation

This document outlines the testing procedures for the PMU Profit System, focusing on the checkout flows.

## Automated Tests

### Prerequisites

- Node.js installed
- Puppeteer installed (`npm install puppeteer`)
- Local development server running (`npm run dev`)

### Available Tests

#### Add-on Checkout Flow Test

Tests the checkout flow for add-on products (Blueprint, Pricing Template, Ad Generator) for authenticated users.

**File**: `scripts/testing/test-addon-checkout-flow.js`

**What it tests**:
1. User login
2. Navigation to the add-on product page
3. Clicking the "Buy Now" button
4. Redirection to Stripe checkout
5. Verification of successful checkout flow

**How to run**:
```bash
node scripts/testing/test-addon-checkout-flow.js
```

#### Unauthenticated Checkout Flow Test

Tests the checkout flow for unauthenticated users.

**File**: `scripts/testing/test-unauthenticated-checkout.js`

**What it tests**:
1. Navigation to the add-on product page
2. Clicking the "Buy Now" button
3. Redirection to Stripe checkout
4. Simulation of a successful payment
5. Verification of the success page
6. Checking for login options for unauthenticated users

**How to run**:
```bash
node scripts/testing/test-unauthenticated-checkout.js
```

## Manual Testing Procedures

### Testing the Webhook Handler

1. Use Stripe CLI to forward webhook events to your local environment:
   ```bash
   stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
   ```

2. Trigger a test webhook event:
   ```bash
   stripe trigger checkout.session.completed
   ```

3. Check the console logs for webhook processing information

### Testing the Verified Sessions Table

1. Make a purchase without being logged in
2. Check the `verified_sessions` table in Supabase for the new record
3. Verify that the session data includes the correct metadata

### Testing the Purchase Verification API

1. Make a purchase and get the payment intent ID
2. Call the API with the payment intent ID:
   ```
   GET /api/verify-purchase?product=pricing-template&payment_intent_id=pi_123456789
   ```
3. Verify that the API returns a success response with the purchase details

## Troubleshooting

### Common Issues

1. **Button not found in tests**:
   - Check that the button selector matches the actual button class
   - Try using a more general selector or text-based selection

2. **Webhook not processing**:
   - Verify that the Stripe CLI is running and forwarding events
   - Check the webhook secret in your environment variables

3. **Purchase verification failing**:
   - Check that the product ID is valid
   - Verify that the payment intent ID exists in Stripe
   - Check the database for the purchase record

### Debugging

- All tests save screenshots during execution
- Check the console logs for detailed information
- For webhook issues, check both the Stripe dashboard and your application logs 

# Purchase Verification System Updates

## Overview

We've enhanced the purchase verification system to improve reliability and user experience. The key improvements include:

1. Added support for `purchase_id` parameter in the verification process
2. Updated the success page to handle different verification methods
3. Implemented real Stripe checkout for add-on products
4. Created automated testing for the add-on purchase flow

## Key Changes

### 1. Verify Purchase API (`/api/verify-purchase/route.ts`)

- Added support for verifying purchases using `purchase_id` parameter
- Improved error handling and logging
- Added checks for existing entitlements to prevent duplicates
- Updated purchase status management (pending → completed)
- Added helper function to get user-friendly product names

### 2. Success Page (`/app/checkout/success/page.tsx`)

- Added support for handling `purchase_id` parameter
- Improved verification logic to try multiple methods (purchase_id, session_id, product)
- Enhanced error handling and user feedback
- Added support for add-on product purchases

### 3. Add-on Purchase Pages

- Updated both the Ad Generator and Blueprint purchase pages:
  - Implemented real Stripe checkout integration
  - Added user ID and email to checkout session creation
  - Improved loading states and error handling
  - Updated button text and user experience

### 4. Automated Testing

Created a test script (`scripts/testing/test-addon-purchase-flow.js`) that:
- Logs into the application
- Navigates to the add-on purchase page
- Clicks the purchase button
- Verifies redirection to Stripe checkout
- Checks for the presence of `purchase_id` in the success URL

## Testing Instructions

To test the add-on purchase flow:

```bash
node scripts/testing/test-addon-purchase-flow.js
```

This will:
1. Open a browser window
2. Log in with test credentials
3. Navigate to the add-on purchase page
4. Click the purchase button
5. Verify the Stripe checkout page loads correctly
6. Check that the success URL includes the purchase_id parameter

## Technical Details

### Purchase Verification Flow

1. When a user makes a purchase, we now create a purchase record in the database before redirecting to Stripe
2. The purchase record includes a unique ID that is passed to Stripe as part of the success URL
3. When the user returns from Stripe, we use this purchase ID to verify the purchase status
4. If the purchase is verified, we create entitlements for the user and update the purchase status

This approach is more reliable than using session IDs or payment intent IDs, as it works even if:
- The user's session is lost during checkout
- The user closes the browser and returns later
- The user uses a different device to complete the purchase

### Database Schema

The purchases table now includes:
- `id`: Unique identifier for the purchase
- `user_id`: ID of the user making the purchase
- `product_id`: ID of the purchased product
- `status`: Status of the purchase (pending, completed)
- `stripe_checkout_session_id`: ID of the Stripe checkout session
- `stripe_payment_intent_id`: ID of the Stripe payment intent
- `entitlements_created`: Flag indicating if entitlements have been created 