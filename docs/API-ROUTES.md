# PMU Profit System API Routes

This document provides a comprehensive overview of the API routes used in the PMU Profit System.

## Table of Contents

1. [Overview](#overview)
2. [Authentication API](#authentication-api)
3. [Payment API](#payment-api)
4. [Email API](#email-api)
5. [Supabase API](#supabase-api)
6. [Testing API](#testing-api)
7. [Security Considerations](#security-considerations)

## Overview

The PMU Profit System uses Next.js API routes to handle server-side operations. These routes are located in the `src/app/api` directory and follow the Next.js App Router convention.

API routes are protected using middleware to ensure that only authenticated users can access protected endpoints. The middleware is defined in `src/middleware.ts`.

## Authentication API

### `/api/auth`

Handles authentication operations using Supabase Auth.

**Endpoints:**

- `POST /api/auth/signup`: Creates a new user account
  - Request body: `{ email, password, full_name }`
  - Response: `{ user, session, error }`

- `POST /api/auth/signin`: Signs in an existing user
  - Request body: `{ email, password }`
  - Response: `{ user, session, error }`

- `POST /api/auth/signout`: Signs out the current user
  - Response: `{ error }`

### `/api/check-verification-status`

Checks the email verification status of a user.

- `GET /api/check-verification-status?email=user@example.com`
  - Response: `{ verified, error }`

### `/api/manual-send-verification`

Manually sends a verification email to a user.

- `POST /api/manual-send-verification`
  - Request body: `{ email }`
  - Response: `{ success, error }`

### `/api/unban-user`

Unbans a user account that was incorrectly marked as banned.

- `POST /api/unban-user`
  - Request body: `{ email }`
  - Response: `{ success, error }`

## Payment API

### `/api/create-checkout`

Creates a Stripe checkout session for purchasing products.

- `POST /api/create-checkout`
  - Request body: `{ email, products, metadata }`
  - Response: `{ sessionId, url, error }`

### `/api/create-payment-intent`

Creates a Stripe payment intent for direct card payments.

- `POST /api/create-payment-intent`
  - Request body: `{ amount, currency, metadata }`
  - Response: `{ clientSecret, error }`

### `/api/verify-payment-intent`

Verifies a Stripe payment intent after payment completion.

- `POST /api/verify-payment-intent`
  - Request body: `{ paymentIntentId }`
  - Response: `{ success, error }`

### `/api/webhooks/stripe`

Handles Stripe webhook events for payment processing.

- `POST /api/webhooks/stripe`
  - Request body: Stripe webhook event
  - Response: `{ received: true }`

## Email API

### `/api/send-email`

Sends an email using the configured email service.

- `POST /api/send-email`
  - Request body: `{ to, subject, html }`
  - Response: `{ success, error }`

### `/api/direct-send-email`

Sends an email directly without using the email service (for testing).

- `POST /api/direct-send-email`
  - Request body: `{ to, subject, html }`
  - Response: `{ success, error }`

### `/api/test-email-verification`

Tests the email verification flow.

- `POST /api/test-email-verification`
  - Request body: `{ email }`
  - Response: `{ success, previewUrl, error }`

## Supabase API

### `/api/check-supabase-settings`

Checks the Supabase settings for the current environment.

- `GET /api/check-supabase-settings`
  - Response: `{ url, redirectUrl, error }`

### `/api/update-supabase-settings`

Updates the Supabase settings for the current environment.

- `POST /api/update-supabase-settings`
  - Request body: `{ redirectUrl }`
  - Response: `{ success, error }`

### `/api/update-supabase-redirect`

Updates the Supabase redirect URL for authentication.

- `POST /api/update-supabase-redirect`
  - Request body: `{ redirectUrl }`
  - Response: `{ success, error }`

## Testing API

### `/api/test-supabase`

Tests the Supabase connection.

- `GET /api/test-supabase`
  - Response: `{ success, error }`

### `/api/test-supabase-auth`

Tests the Supabase authentication.

- `GET /api/test-supabase-auth`
  - Response: `{ success, error }`

### `/api/test-auth-status`

Tests the authentication status of the current user.

- `GET /api/test-auth-status`
  - Response: `{ authenticated, user, error }`

### `/api/check-user-details`

Checks the details of a user account.

- `GET /api/check-user-details?email=user@example.com`
  - Response: `{ user, error }`

### `/api/debug-stripe`

Debugs the Stripe configuration.

- `GET /api/debug-stripe`
  - Response: `{ config, error }`

## Security Considerations

1. **Authentication**: All API routes that handle sensitive operations should verify the user's authentication status.

2. **CSRF Protection**: Next.js includes built-in CSRF protection for API routes.

3. **Rate Limiting**: Consider implementing rate limiting for public API routes to prevent abuse.

4. **Input Validation**: Always validate and sanitize input data to prevent injection attacks.

5. **Error Handling**: Return appropriate error responses without exposing sensitive information.

6. **Logging**: Log API requests and errors for debugging and security monitoring.

7. **Environment Variables**: Store sensitive information like API keys in environment variables.

## Example Usage

Here's an example of how to call an API route from the client:

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
    
    return data;
  } catch (error) {
    console.error('Error creating checkout:', error);
    throw error;
  }
};
``` 