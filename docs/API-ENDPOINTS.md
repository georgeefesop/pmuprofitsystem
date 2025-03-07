# PMU Profit System API Endpoints

This document provides a comprehensive list of all API endpoints available in the PMU Profit System. Use this as a reference when working with the application's backend services.

## Table of Contents

- [Authentication](#authentication)
- [User Management](#user-management)
- [Payments and Purchases](#payments-and-purchases)
- [Entitlements](#entitlements)
- [Webhooks](#webhooks)
- [Admin](#admin)
- [Testing and Debugging](#testing-and-debugging)

## Authentication

### `/api/auth/*`

Authentication endpoints powered by Supabase Auth.

**Note**: These endpoints are managed by Supabase and follow their API patterns.

## User Management

### `/api/user`

Endpoints for managing user data.

#### GET `/api/user`

Retrieves the current authenticated user's information.

**Response:**
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "full_name": "User Name",
  "created_at": "2023-01-01T00:00:00Z"
}
```

### `/api/check-user-details`

#### GET `/api/check-user-details`

Checks if a user exists and returns their details.

**Query Parameters:**
- `email`: User's email address

**Response:**
```json
{
  "exists": true,
  "user": {
    "id": "user-uuid",
    "email": "user@example.com"
  }
}
```

### `/api/check-verification-status`

#### GET `/api/check-verification-status`

Checks the email verification status of a user.

**Query Parameters:**
- `email`: User's email address

**Response:**
```json
{
  "verified": true,
  "message": "Email is verified"
}
```

### `/api/unban-user`

#### POST `/api/unban-user`

Unbans a user who was previously banned.

**Request Body:**
```json
{
  "userId": "user-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User unbanned successfully"
}
```

## Payments and Purchases

### `/api/create-checkout`

#### POST `/api/create-checkout`

Creates a Stripe checkout session for purchasing products.

**Request Body:**
```json
{
  "includeAdGenerator": true,
  "includeBlueprint": false,
  "userId": "user-uuid",
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://checkout.stripe.com/..."
}
```

### `/api/create-payment-intent`

#### POST `/api/create-payment-intent`

Creates a Stripe payment intent for custom payment flows.

**Request Body:**
```json
{
  "amount": 3700,
  "currency": "usd",
  "userId": "user-uuid",
  "includeAdGenerator": false,
  "includeBlueprint": true
}
```

**Response:**
```json
{
  "clientSecret": "pi_..._secret_...",
  "paymentIntentId": "pi_..."
}
```

### `/api/verify-payment-intent`

#### GET `/api/verify-payment-intent`

Verifies a payment intent's status.

**Query Parameters:**
- `payment_intent_id`: The Stripe payment intent ID

**Response:**
```json
{
  "success": true,
  "verified": true,
  "paymentStatus": "succeeded"
}
```

### `/api/verify-purchase`

#### GET `/api/verify-purchase`

Verifies a purchase using a checkout session ID or payment intent ID.

**Query Parameters:**
- `session_id`: The Stripe checkout session ID or payment intent ID

**Response:**
```json
{
  "success": true,
  "verified": true,
  "paymentStatus": "paid",
  "userId": "user-uuid",
  "includeAdGenerator": false,
  "includeBlueprint": true,
  "sessionDetails": {
    "id": "cs_...",
    "customer_email": "user@example.com",
    "amount_total": 70,
    "currency": "usd"
  }
}
```

### `/api/auto-approve-purchase`

#### GET `/api/auto-approve-purchase`

Automatically approves a purchase and creates entitlements.

**Query Parameters:**
- `session_id`: The Stripe checkout session ID or payment intent ID
- `user_id`: The user's UUID

**Response:**
```json
{
  "success": true,
  "message": "Purchase approved and entitlements created successfully",
  "entitlements": [...]
}
```

### `/api/create-payment`

#### POST `/api/create-payment`

Creates a payment record in the database.

**Request Body:**
```json
{
  "userId": "user-uuid",
  "productId": "product-uuid",
  "amount": 37.00
}
```

**Response:**
```json
{
  "success": true,
  "paymentId": "payment-uuid"
}
```

## Entitlements

### `/api/create-entitlements`

#### GET `/api/create-entitlements`

Creates entitlements for a user based on a Stripe checkout session.

**Query Parameters:**
- `session_id`: The Stripe checkout session ID
- `user_id`: The user's UUID

**Response:**
```json
{
  "success": true,
  "message": "Entitlements created successfully",
  "entitlements": [...]
}
```

### `/api/create-entitlements-direct`

#### POST `/api/create-entitlements-direct`

Creates entitlements directly without requiring a Stripe session.

**Request Body:**
```json
{
  "userId": "user-uuid",
  "productIds": ["product-uuid-1", "product-uuid-2"]
}
```

**Response:**
```json
{
  "success": true,
  "entitlements": [...]
}
```

### `/api/user-entitlements`

#### GET `/api/user-entitlements`

Retrieves all entitlements for the current user.

**Response:**
```json
{
  "entitlements": [
    {
      "id": "entitlement-uuid",
      "product_id": "product-uuid",
      "valid_from": "2023-01-01T00:00:00Z",
      "valid_to": null,
      "is_active": true
    }
  ]
}
```

### `/api/fix-user-purchases`

#### POST `/api/fix-user-purchases`

Fixes user purchases that may have issues with entitlements.

**Request Body:**
```json
{
  "userId": "user-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User purchases fixed",
  "fixedCount": 2
}
```

## Webhooks

### `/api/webhooks/stripe`

#### POST `/api/webhooks/stripe`

Handles Stripe webhook events.

**Request Body:**
Stripe webhook event object

**Response:**
```json
{
  "received": true
}
```

## Admin

### `/api/admin/*`

Various admin endpoints for managing the application.

#### GET `/api/admin/users`

Retrieves a list of all users (admin only).

**Response:**
```json
{
  "users": [...]
}
```

## Testing and Debugging

### `/api/debug/auth-state`

#### GET `/api/debug/auth-state`

Checks the current authentication state.

**Response:**
```json
{
  "authenticated": true,
  "user": {
    "id": "user-uuid",
    "email": "user@example.com"
  }
}
```

### `/api/debug/stripe`

#### GET `/api/debug/stripe`

Provides diagnostic information about the Stripe configuration.

**Response:**
```json
{
  "configured": true,
  "mode": "test",
  "webhooksConfigured": true
}
```

### `/api/stripe-diagnostics`

#### GET `/api/stripe-diagnostics`

Runs diagnostics on the Stripe integration.

**Response:**
```json
{
  "apiKeyConfigured": true,
  "webhookSecretConfigured": true,
  "testConnection": "success"
}
```

### `/api/dev-logger`

#### POST `/api/dev-logger`

Logs messages from the client for debugging purposes.

**Request Body:**
```json
{
  "level": "error",
  "message": "Error message",
  "data": { "additional": "context" }
}
```

**Response:**
```json
{
  "logged": true
}
```

### `/api/send-email`

#### POST `/api/send-email`

Sends an email using the application's email service.

**Request Body:**
```json
{
  "to": "recipient@example.com",
  "subject": "Email Subject",
  "html": "<p>Email content</p>"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "email-id"
}
```

---

## How to Use This Document

1. **Finding Endpoints**: Use the Table of Contents to navigate to the relevant section
2. **Understanding Endpoints**: Each endpoint includes its path, HTTP method, description, and example request/response
3. **Implementation**: Refer to the actual implementation in the codebase for detailed logic

## Contributing to This Document

When adding new API endpoints to the application, please update this document with:

1. The endpoint path and HTTP method
2. A brief description of what the endpoint does
3. Required parameters or request body structure
4. Example response format

This will help maintain a comprehensive reference for all developers working on the project. 