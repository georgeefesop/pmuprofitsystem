# Stripe Integration Guide for PMU Profit System

This document provides a comprehensive guide to the Stripe payment integration in the PMU Profit System.

## Table of Contents

1. [Overview](#overview)
2. [Setup and Configuration](#setup-and-configuration)
3. [Payment Flows](#payment-flows)
   - [Checkout Flow](#checkout-flow)
   - [Direct Card Payment Flow](#direct-card-payment-flow)
4. [Webhooks](#webhooks)
5. [Testing](#testing)
6. [Error Handling](#error-handling)
7. [Security Considerations](#security-considerations)
8. [Troubleshooting](#troubleshooting)

## Overview

The PMU Profit System uses Stripe for payment processing. There are two main payment flows:

1. **Stripe Checkout**: A hosted payment page provided by Stripe
2. **Direct Card Payment**: Using Stripe Elements for in-app card processing

The integration includes handling webhooks for asynchronous payment events and proper error handling for a smooth user experience.

## Setup and Configuration

### Environment Variables

The following environment variables are required for Stripe integration:

```
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_key_here
```

In development, use Stripe test keys. In production, use live keys.

### Stripe Dashboard Configuration

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Set up products and prices in the Stripe Dashboard:
   - PMU Profit System Course
   - PMU Ad Generator (add-on)
   - Consultation Success Blueprint (add-on)
3. Configure webhook endpoints:
   - Add `https://your-domain.com/api/webhooks/stripe` as a webhook endpoint
   - Select events to listen for: `checkout.session.completed`, `payment_intent.succeeded`, etc.
   - Get the webhook signing secret from the webhook settings

## Payment Flows

### Checkout Flow

The Checkout flow uses Stripe Checkout, a hosted payment page provided by Stripe.

#### Server-Side (API Route)

```typescript
// src/app/api/create-checkout/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const { email, products } = await request.json();
    
    // Create line items based on selected products
    const lineItems = products.map(product => ({
      price: getPriceIdForProduct(product),
      quantity: 1,
    }));
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?cancelled=true`,
      customer_email: email,
    });
    
    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}

// Helper function to get price ID for a product
function getPriceIdForProduct(product: string): string {
  switch (product) {
    case 'pmu-profit-system':
      return 'price_...';
    case 'pmu-ad-generator':
      return 'price_...';
    case 'consultation-success-blueprint':
      return 'price_...';
    default:
      throw new Error(`Unknown product: ${product}`);
  }
}
```

#### Client-Side

```typescript
// Example: Creating a checkout session
const createCheckout = async (email: string, products: string[]) => {
  try {
    const response = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, products }),
    });
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    // Redirect to Stripe Checkout
    window.location.href = data.url;
  } catch (error) {
    console.error('Error creating checkout:', error);
    throw error;
  }
};
```

### Direct Card Payment Flow

The Direct Card Payment flow uses Stripe Elements for in-app card processing.

#### Server-Side (API Route)

```typescript
// src/app/api/create-payment-intent/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const { amount, currency = 'eur', metadata } = await request.json();
    
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });
    
    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json({ error: 'Failed to create payment intent' }, { status: 500 });
  }
}
```

#### Client-Side

```tsx
// src/components/PaymentForm.tsx
'use client';

import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';

interface PaymentFormProps {
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: Error) => void;
}

export function PaymentForm({ amount, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });
      
      const { clientSecret, error } = await response.json();
      
      if (error) {
        throw new Error(error);
      }
      
      // Confirm payment
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
        redirect: 'if_required',
      });
      
      if (stripeError) {
        throw new Error(stripeError.message);
      }
      
      if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent.id);
      }
    } catch (error) {
      console.error('Payment error:', error);
      onError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || !elements || isLoading}
        className="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded"
      >
        {isLoading ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
}
```

## Webhooks

Webhooks are used to handle asynchronous payment events from Stripe.

```typescript
// src/app/api/webhooks/stripe/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature')!;
    
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      // Add more event handlers as needed
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

// Handle checkout.session.completed event
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  // Get customer email
  const customerEmail = session.customer_email;
  
  // Get purchased products from line items
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
  
  // Process the purchase (e.g., create user account, grant access to products)
  // ...
}

// Handle payment_intent.succeeded event
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  // Process the payment (e.g., update purchase status)
  // ...
}
```

## Testing

### Test Cards

Use these test card numbers for testing:

- **Successful payment**: 4242 4242 4242 4242
- **Authentication required**: 4000 0025 0000 3155
- **Payment declined**: 4000 0000 0000 9995

Use any future expiration date, any 3-digit CVC, and any postal code.

### Testing Webhooks Locally

To test webhooks locally, use the Stripe CLI:

1. Install the Stripe CLI: [stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
2. Log in to your Stripe account: `stripe login`
3. Forward webhooks to your local server: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
4. Use the webhook signing secret provided by the CLI in your `.env.local` file

## Error Handling

Proper error handling is essential for a good user experience:

1. **Client-Side Errors**: Display user-friendly error messages
2. **Server-Side Errors**: Log detailed errors but return simplified messages to the client
3. **Network Errors**: Handle timeouts and connection issues
4. **Validation Errors**: Validate input before sending to Stripe
5. **Stripe Errors**: Handle specific Stripe error codes appropriately

## Security Considerations

1. **HTTPS**: Always use HTTPS for payment processing
2. **PCI Compliance**: Use Stripe Elements or Checkout to avoid handling card data directly
3. **Webhook Signatures**: Always verify webhook signatures
4. **API Keys**: Keep API keys secure and use environment variables
5. **Idempotency**: Use idempotency keys for critical operations to prevent duplicates

## Troubleshooting

### Common Issues

1. **Payment Intent Creation Fails**
   - Check that your Stripe API key is correct
   - Ensure the amount is in the smallest currency unit (e.g., cents for USD/EUR)
   - Verify that the currency is supported by your Stripe account

2. **Webhook Verification Fails**
   - Check that the webhook secret is correct
   - Ensure the request body is not modified before verification
   - Verify that the Stripe-Signature header is present

3. **Checkout Redirect Issues**
   - Ensure success and cancel URLs are properly configured
   - Check that the URLs are accessible and properly handle the session ID

4. **Card Element Not Loading**
   - Verify that Stripe.js is loaded correctly
   - Check that the Elements provider is properly set up
   - Ensure you're using HTTPS (required for Stripe Elements)

### Debugging Tools

1. **Stripe Dashboard**: Check the Events and Logs sections
2. **Stripe CLI**: Use `stripe logs tail` to see real-time API requests
3. **Browser Console**: Check for JavaScript errors
4. **Network Tab**: Inspect API requests and responses 