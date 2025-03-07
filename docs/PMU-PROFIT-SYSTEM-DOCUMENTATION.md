# PMU Profit System Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [System Architecture](#system-architecture)
   - [Technology Stack](#technology-stack)
   - [Code Structure](#code-structure)
   - [File Dependencies](#file-dependencies)
3. [Database](#database)
   - [Database Schema](#database-schema)
   - [Database Setup](#database-setup)
   - [Database Cleanup](#database-cleanup)
   - [Schema Updates](#schema-updates)
4. [Authentication](#authentication)
   - [Supabase Authentication](#supabase-authentication)
   - [User Management](#user-management)
   - [Authentication Flow](#authentication-flow)
   - [Email Verification](#email-verification)
5. [API Routes](#api-routes)
   - [Authentication API](#authentication-api)
   - [Payment API](#payment-api)
   - [User Data API](#user-data-api)
   - [Ad Generator API](#ad-generator-api)
6. [Payment Integration](#payment-integration)
   - [Stripe Setup](#stripe-setup)
   - [Checkout Flow](#checkout-flow)
   - [Direct Card Payment Flow](#direct-card-payment-flow)
   - [Webhooks](#webhooks)
7. [Development Workflow](#development-workflow)
   - [Local Development](#local-development)
   - [Testing](#testing)
   - [Error Handling](#error-handling)
8. [Deployment](#deployment)
   - [Environment Setup](#environment-setup)
   - [Deployment Process](#deployment-process)
   - [Post-Deployment Verification](#post-deployment-verification)
9. [Troubleshooting](#troubleshooting)
   - [Authentication Issues](#authentication-issues)
   - [Payment Issues](#payment-issues)
   - [Database Issues](#database-issues)
   - [Deployment Problems](#deployment-problems)
   - [UI/UX Issues](#uiux-issues)
   - [User Entitlement Issues](#user-entitlement-issues)
10. [Implementation Guide](#implementation-guide)
    - [Step-by-Step Setup](#step-by-step-setup)
    - [Configuration](#configuration)

---

## Introduction

The PMU Profit System is a modern SaaS application designed for Permanent Makeup professionals. It provides a platform for users to purchase and access educational content, tools, and resources to help them grow their PMU business.

The system is built using Next.js for the frontend, Supabase for backend services (database, authentication, storage), and Stripe for payment processing. It follows a modern architecture with server-side rendering, API routes, and a responsive UI built with Tailwind CSS.

This documentation provides a comprehensive guide to understanding, developing, and maintaining the PMU Profit System.

---

## System Architecture

### Technology Stack

The PMU Profit System uses the following technologies:

- **Frontend**: Next.js (React), Tailwind CSS, Shadcn UI, Radix UI
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Payment Processing**: Stripe
- **Deployment**: Vercel

### Code Structure

The project follows a modern Next.js App Router structure:

```
src/
├── app/                         # Next.js App Router pages
│   ├── api/                     # API routes
│   ├── dashboard/               # Dashboard pages
│   ├── auth/                    # Authentication pages
│   ├── checkout/                # Checkout pages
│   └── ...                      # Other pages
├── components/                  # React components
│   ├── ui/                      # UI components
│   └── sections/                # Page sections
├── contexts/                    # React contexts
├── lib/                         # Utility libraries
├── utils/                       # Utility functions
│   └── supabase/                # Supabase utilities
└── middleware.ts                # Next.js middleware
```

#### Key Components

- **Layout Components**: Define the structure of pages (e.g., `DashboardLayout.tsx`)
- **UI Components**: Reusable UI elements (buttons, forms, cards)
- **Page Components**: Components specific to a page or route
- **Context Providers**: Manage global state (auth, cart, etc.)
- **Utility Functions**: Helper functions for common tasks

### File Dependencies

The application has the following key file dependencies:

- **Authentication**: `utils/supabase/auth.ts` provides authentication utilities
- **Database Access**: `utils/supabase/database.ts` handles database operations
- **API Routes**: Files in `app/api/` handle server-side operations
- **Middleware**: `middleware.ts` handles route protection and redirects
- **Environment Variables**: `.env.local` contains configuration variables

---

## Database

### Database Schema

The PMU Profit System uses a PostgreSQL database managed by Supabase. The schema includes the following tables:

#### Users Table
- Extends Supabase's built-in auth.users table
- Stores user profile information and preferences
- Fields:
  - `id` (UUID, PK): References auth.users(id)
  - `email` (TEXT): User's email address
  - `full_name` (TEXT): User's full name
  - `created_at` (TIMESTAMP): When the user was created
  - `updated_at` (TIMESTAMP): When the user was last updated

#### Products Table
- Stores information about available products
- Fields:
  - `id` (UUID, PK): Unique identifier for the product
  - `stripe_product_id` (TEXT): Corresponding product ID in Stripe
  - `name` (TEXT): Product name
  - `description` (TEXT): Product description
  - `price` (DECIMAL): Default price of the product (in EUR)
  - `currency` (TEXT): Currency of the price (EUR)
  - `active` (BOOLEAN): Whether the product is active
  - `type` (TEXT): Product type (course, tool, resource, etc.)
  - `metadata` (JSONB): Additional product metadata
  - `created_at` (TIMESTAMP): When the product was created
  - `updated_at` (TIMESTAMP): When the product was last updated

#### Product Prices Table
- Stores different price points for products
- Fields:
  - `id` (UUID, PK): Unique identifier for the price
  - `product_id` (UUID, FK): References products(id)
  - `stripe_price_id` (TEXT): Corresponding price ID in Stripe
  - `nickname` (TEXT): Human-readable name for the price
  - `unit_amount` (DECIMAL): Price amount (in EUR)
  - `currency` (TEXT): Currency of the price (EUR)
  - `recurring` (BOOLEAN): Whether this is a recurring price
  - `interval` (TEXT): For recurring prices, the interval (month, year, etc.)
  - `active` (BOOLEAN): Whether the price is active
  - `created_at` (TIMESTAMP): When the price was created
  - `updated_at` (TIMESTAMP): When the price was last updated

#### Purchases Table
- Records user purchases
- Fields:
  - `id` (UUID, PK): Unique identifier for the purchase
  - `user_id` (UUID, FK): References auth.users(id)
  - `product_id` (TEXT): Product identifier (legacy field)
  - `amount` (DECIMAL): Purchase amount (in EUR)
  - `status` (TEXT): Purchase status (completed, refunded, etc.)
  - `stripe_customer_id` (TEXT): Stripe customer ID
  - `stripe_checkout_session_id` (TEXT): Stripe checkout session ID
  - `stripe_payment_intent_id` (TEXT): Stripe payment intent ID
  - `currency` (TEXT): Currency of the purchase (EUR)
  - `metadata` (JSONB): Additional purchase metadata
  - `created_at` (TIMESTAMP): When the purchase was created
  - `updated_at` (TIMESTAMP): When the purchase was last updated

#### Purchase Items Table
- Links purchases to specific products
- Fields:
  - `id` (UUID, PK): Unique identifier for the purchase item
  - `purchase_id` (UUID, FK): References purchases(id)
  - `product_id` (UUID, FK): References products(id)
  - `price_id` (UUID, FK): References product_prices(id)
  - `quantity` (INTEGER): Quantity purchased
  - `unit_amount` (DECIMAL): Price per unit
  - `subtotal` (DECIMAL): Total for this line item
  - `created_at` (TIMESTAMP): When the purchase item was created

#### Subscriptions Table
- Manages user subscriptions (if applicable)
- Fields:
  - `id` (UUID, PK): Unique identifier for the subscription
  - `user_id` (UUID, FK): References auth.users(id)
  - `stripe_subscription_id` (TEXT): Stripe subscription ID
  - `stripe_customer_id` (TEXT): Stripe customer ID
  - `status` (TEXT): Subscription status (active, canceled, etc.)
  - `current_period_start` (TIMESTAMP): Start of current billing period
  - `current_period_end` (TIMESTAMP): End of current billing period
  - `cancel_at` (TIMESTAMP): When the subscription is scheduled to cancel
  - `canceled_at` (TIMESTAMP): When the subscription was canceled
  - `metadata` (JSONB): Additional subscription metadata
  - `created_at` (TIMESTAMP): When the subscription was created
  - `updated_at` (TIMESTAMP): When the subscription was last updated

#### Subscription Items Table
- Links subscriptions to specific products
- Fields:
  - `id` (UUID, PK): Unique identifier for the subscription item
  - `subscription_id` (UUID, FK): References subscriptions(id)
  - `product_id` (UUID, FK): References products(id)
  - `price_id` (UUID, FK): References product_prices(id)
  - `quantity` (INTEGER): Quantity subscribed
  - `created_at` (TIMESTAMP): When the subscription item was created
  - `updated_at` (TIMESTAMP): When the subscription item was last updated

#### User Entitlements Table
- Manages user access to products
- Fields:
  - `id` (UUID, PK): Unique identifier for the entitlement
  - `user_id` (UUID, FK): References auth.users(id)
  - `product_id` (UUID, FK): References products(id)
  - `source_type` (TEXT): Source of the entitlement (purchase, subscription, manual)
  - `source_id` (UUID): ID of the source (purchase_id or subscription_id)
  - `is_active` (BOOLEAN): Whether the entitlement is active
  - `valid_from` (TIMESTAMP): When the entitlement becomes valid
  - `valid_until` (TIMESTAMP): When the entitlement expires (null for lifetime)
  - `created_at` (TIMESTAMP): When the entitlement was created
  - `updated_at` (TIMESTAMP): When the entitlement was last updated

#### Ad Generator Logs Table
- Records usage of the ad generator tool
- Fields:
  - `id` (UUID, PK): Unique identifier for the log entry
  - `user_id` (UUID, FK): References auth.users(id)
  - `inputs` (JSONB): Input parameters for the ad generation
  - `generated_ads` (JSONB): Generated ad content
  - `saved` (BOOLEAN): Whether the user saved this ad
  - `created_at` (TIMESTAMP): When the ad was generated

#### Table Relationships

- **users** ← one-to-many → **purchases**: A user can make multiple purchases
- **users** ← one-to-many → **subscriptions**: A user can have multiple subscriptions
- **users** ← one-to-many → **user_entitlements**: A user can have multiple entitlements
- **users** ← one-to-many → **ad_generator_logs**: A user can generate multiple ads

- **products** ← one-to-many → **product_prices**: A product can have multiple price points
- **products** ← one-to-many → **user_entitlements**: A product can be entitled to multiple users

- **purchases** ← one-to-many → **purchase_items**: A purchase can contain multiple items
- **purchases** ← one-to-many → **user_entitlements**: A purchase can grant multiple entitlements

- **subscriptions** ← one-to-many → **subscription_items**: A subscription can contain multiple items
- **subscriptions** ← one-to-many → **user_entitlements**: A subscription can grant multiple entitlements

#### Row Level Security (RLS) Policies

The database uses Row Level Security to ensure that users can only access their own data:

- **products**: Anyone can view active products
- **product_prices**: Anyone can view active prices
- **purchases**: Users can only view their own purchases
- **purchase_items**: Users can only view items from their own purchases
- **subscriptions**: Users can only view their own subscriptions
- **subscription_items**: Users can only view items from their own subscriptions
- **user_entitlements**: Users can only view their own entitlements
- **ad_generator_logs**: Users can only view and manage their own logs

### Database Setup

To set up the database schema:

1. Ensure Supabase is properly configured
2. Run the database setup script:
   ```bash
   node scripts/database/setup-database.js
   ```
3. Verify the setup with:
   ```bash
   node scripts/database/verify-database-schema.js
   ```

The setup script creates all necessary tables, relationships, and initial data for the application.

### Database Cleanup

For development and testing purposes, you can clean up all user data using the database cleanup script:

```bash
node scripts/clean-database.js
```

This script:
1. Deletes all user entitlements
2. Deletes all purchases
3. Deletes all users from the public schema
4. Deletes all auth users (using Supabase Auth Admin API)
5. Verifies that all data has been deleted

The script automatically reads Supabase configuration from environment variables or .env files, so no additional setup is required.

**Warning:** This script will delete ALL user data. Use with caution and only in development/testing environments.

### Schema Updates

When updating the database schema:

1. Create a new migration file in `scripts/sql/`
2. Test the migration locally
3. Apply the migration to the production database

Use the following script to generate SQL commands with IF NOT EXISTS conditions:
```bash
node scripts/database/execute-sql-with-if-not-exists.js
```

#### Data Flow

1. When a user signs up, an entry is created in `auth.users` and `public.users`
2. When a user makes a purchase:
   - A record is created in `purchases`
   - Line items are created in `purchase_items`
   - Entitlements are created in `user_entitlements`
3. When a user subscribes:
   - A record is created in `subscriptions`
   - Line items are created in `subscription_items`
   - Entitlements are created in `user_entitlements`
4. When a user generates an ad:
   - A record is created in `ad_generator_logs`

---

## Authentication

### Supabase Authentication

The PMU Profit System uses Supabase Authentication for user management. Key features include:

- Email/password authentication
- Email verification
- Password reset
- Session management
- Row-level security (RLS) policies

### User Management

#### User Registration

Users can register through:
1. The signup form
2. During checkout (when purchasing a product)

Registration flow:
1. User provides email and password
2. Account is created in Supabase
3. Verification email is sent
4. User verifies email (optional, depending on settings)
5. User can log in and access purchased content

#### User Sessions

- Sessions are managed by Supabase
- JWT tokens are used for authentication
- Session expiration is configurable
- Middleware protects routes based on authentication status

#### Row-Level Security

Supabase RLS policies ensure users can only access their own data:

- Users can only view their own purchases
- Users can only access content they've purchased
- Admin users have additional permissions

### Authentication Flow

The authentication flow in the PMU Profit System works as follows:

1. **User Sign-Up**: Users can sign up via the registration form or during checkout.
2. **Email Verification**: Supabase sends a verification email to the user.
3. **Login**: Users can log in with their email and password.
4. **Session Management**: Supabase handles session management using cookies or local storage.
5. **Route Protection**: Protected routes (like `/dashboard`) are guarded by middleware.

#### Middleware Protection

The middleware (`src/middleware.ts`) protects routes by:

1. Checking if the route is protected (starts with `/dashboard`).
2. Verifying if the user has an active session.
3. If not authenticated, redirecting to the login page.
4. If authenticated, checking if the user has active entitlements.
5. If no entitlements, redirecting to the checkout page.

```typescript
// Example middleware check for entitlements
if (isProtectedRoute && session) {
  try {
    // Check if the user has entitlements for the main product
    const { data: entitlements } = await supabase
      .from('user_entitlements')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_active', true);
    
    // If the user doesn't have any active entitlements, redirect to checkout
    if (!entitlements || entitlements.length === 0) {
      console.log('User has no active entitlements, redirecting to checkout');
      return NextResponse.redirect(new URL('/checkout', request.url));
    }
  } catch (error) {
    console.error('Error checking entitlements:', error);
    // If there's an error, allow access to avoid blocking legitimate users
  }
}
```

#### Session API Endpoint

The system includes a session API endpoint (`/api/auth/session`) that provides a consistent way to check authentication status from client components:

```typescript
// Example API route for checking session
export async function GET() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }
    
    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        user_metadata: session.user.user_metadata
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error getting session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

#### useUser Hook

The `useUser` hook provides a consistent way to access the current user's information in client components:

```typescript
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkUser = async () => {
      try {
        // First try the API endpoint
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated && data.user) {
            setUser(data.user);
            return;
          }
        }
        
        // Fallback to direct Supabase check
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
      } catch (error) {
        console.error("Error checking auth session:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
    
    // Also listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  return { user, isLoading, /* other methods */ };
}
```

### Email Verification

After registration, users must verify their email address:

1. Supabase sends a verification email with a secure link
2. The link contains a one-time code that is exchanged for a session
3. When clicked, the user is redirected to `/auth/callback?code=XXX`
4. Our callback handler exchanges the code for a session
5. The user is then redirected to the dashboard or success page

---

## API Routes

The PMU Profit System uses Next.js API routes to handle server-side operations. These routes are located in the `src/app/api` directory and follow the Next.js App Router convention.

### Authentication API

#### `/api/auth`

Handles authentication operations using Supabase Auth.

- `POST /api/auth/signup`: Creates a new user account
  - Request body: `{ email, password, full_name }`
  - Response: `{ user, session, error }`

- `POST /api/auth/signin`: Signs in an existing user
  - Request body: `{ email, password }`
  - Response: `{ user, session, error }`

- `POST /api/auth/signout`: Signs out the current user
  - Response: `{ error }`

#### `/api/check-verification-status`

Checks the email verification status of a user.

- `GET /api/check-verification-status?email=user@example.com`
  - Response: `{ verified, error }`

#### `/api/manual-send-verification`

Manually sends a verification email to a user.

- `POST /api/manual-send-verification`
  - Request body: `{ email }`
  - Response: `{ success, error }`

### Payment API

#### `/api/checkout/create-session`

Creates a Stripe checkout session for purchasing products.

- `POST /api/checkout/create-session`
  - Request body: `{ email, products, metadata }`
  - Response: `{ sessionId, url, error }`

#### `/api/checkout/success`

Handles successful checkout completion.

- `GET /api/checkout/success?session_id=cs_test_...`
  - Response: Redirects to success page

#### `/api/webhook/stripe`

Processes Stripe webhook events.

- `POST /api/webhook/stripe`
  - Request body: Stripe webhook event
  - Response: `{ received: true }`

### User Data API

#### `/api/user/profile`

Gets or updates user profile information.

- `GET /api/user/profile`
  - Response: `{ user, error }`

- `POST /api/user/profile`
  - Request body: `{ full_name, ... }`
  - Response: `{ success, error }`

#### `/api/user/purchases`

Gets user purchase history.

- `GET /api/user/purchases`
  - Response: `{ purchases, error }`

#### `/api/user/entitlements`

Gets user entitlements.

- `GET /api/user/entitlements`
  - Response: `{ entitlements, error }`

### Ad Generator API

#### `/api/ad-generator/generate`

Generates ad copy using AI.

- `POST /api/ad-generator/generate`
  - Request body: `{ prompt, options }`
  - Response: `{ ads, error }`

#### `/api/ad-generator/save`

Saves generated ad copy.

- `POST /api/ad-generator/save`
  - Request body: `{ adId, content }`
  - Response: `{ success, error }`

---

## Payment Integration

### Stripe Setup

The PMU Profit System uses Stripe for payment processing. Setup includes:

1. Creating products and prices in Stripe
2. Configuring the Stripe API keys
3. Setting up webhook endpoints

Required environment variables:
```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Product Pricing

The PMU Profit System offers the following products:

1. **PMU Profit System Course**: €37.00
2. **PMU Ad Generator Tool**: €27.00
3. **Consultation Success Blueprint**: €33.00

All prices are in euros (EUR).

### Checkout Flow

The checkout flow works as follows:

1. User selects a product (and optional add-ons)
2. User provides email/password (if not logged in)
3. System creates a Stripe checkout session
4. User is redirected to Stripe's checkout page
5. User completes payment on Stripe
6. Stripe redirects back to success page
7. Webhook confirms payment and grants access

#### Server-Side Implementation

```typescript
// Example: Creating a checkout session
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  client_reference_id: userId, // Important for linking the purchase to the user
  line_items: [
    {
      price: 'price_1234567890', // Stripe price ID
      quantity: 1,
    },
  ],
  mode: 'payment',
  success_url: `${YOUR_DOMAIN}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${YOUR_DOMAIN}/checkout/cancel`,
});
```

#### Client-Side Implementation

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

#### Server-Side Implementation

```typescript
// Example: Creating a payment intent
const paymentIntent = await stripe.paymentIntents.create({
  amount,
  currency,
  metadata,
  automatic_payment_methods: {
    enabled: true,
  },
});
```

#### Client-Side Implementation

```tsx
// Example: Using Stripe Elements
const { error, paymentIntent } = await stripe.confirmPayment({
  elements,
  clientSecret,
  confirmParams: {
    return_url: `${window.location.origin}/checkout/success`,
  },
  redirect: 'if_required',
});
```

### Webhooks

Stripe webhooks are used to handle asynchronous events:

- `checkout.session.completed` - Process successful payment
- `invoice.paid` - Process subscription payment
- `customer.subscription.updated` - Update subscription status

The webhook handler:
1. Verifies the webhook signature
2. Processes the event based on type
3. Updates the database accordingly
4. Creates user entitlements for purchased products
5. Returns a 200 response to Stripe

#### Webhook Implementation

```typescript
// Example: Webhook handler
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature') as string;
  
  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    
    // Log the event type for debugging
    console.log(`Processing Stripe webhook event: ${event.type}`);
    
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutSessionCompleted(event.data.object);
          break;
        case 'invoice.paid':
          await handleInvoicePaid(event.data.object);
          break;
        // Handle other event types
      }
    } catch (error) {
      console.error(`Error processing webhook event ${event.type}:`, error);
      // Don't return an error response here, as Stripe will retry the webhook
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}
```

#### Centralized Product ID Management

To ensure consistent usage of product IDs across the application, a centralized module is used:

```typescript
// src/lib/product-ids.ts
export const PRODUCT_IDS = {
  // Main product
  'pmu-profit-system': '4a554622-d759-42b7-b830-79c9136d2f96',
  
  // Add-ons
  'pmu-ad-generator': '4ba5c775-a8e4-449e-828f-19f938e3710b',
  'consultation-success-blueprint': 'e5749058-500d-4333-8938-c8a19b16cd65',
};

// Type for product IDs to enable type checking
export type ProductId = keyof typeof PRODUCT_IDS;

// Helper functions
export function isValidProductId(id: string): id is ProductId {
  return id in PRODUCT_IDS;
}

export function getAllProductIds(): string[] {
  return Object.values(PRODUCT_IDS);
}
```

This module provides:
- Constants for all product IDs
- Type checking for product IDs
- Helper functions for validation and retrieval

#### User Entitlement Creation

When a purchase is completed, the webhook handler creates user entitlements for each purchased product:

```typescript
// Create user entitlement
const { data: entitlement, error: entitlementError } = await supabase
  .from("user_entitlements")
  .insert({
    user_id: userId,
    product_id: productId,
    source_type: "purchase",
    source_id: purchaseId,
    valid_from: new Date().toISOString(),
    is_active: true,
  })
  .select()
  .single();

if (entitlementError) {
  console.error("Error creating main product entitlement:", entitlementError);
} else {
  console.log("Created main product entitlement:", entitlement);
}
```

The system handles both Stripe Checkout Sessions and Payment Intents for entitlement creation. The entitlement creation process automatically detects the type of ID (payment intent or checkout session) and processes it accordingly:

```typescript
// Check if it's a payment intent ID (starts with 'pi_') or a checkout session ID (starts with 'cs_')
if (sessionOrIntentId.startsWith('pi_')) {
  console.log(`[entitlements] Detected payment intent ID: ${sessionOrIntentId}`);
  return await createEntitlementsFromPaymentIntent(sessionOrIntentId, userId);
} else {
  console.log(`[entitlements] Detected checkout session ID: ${sessionOrIntentId}`);
  return await createEntitlementsFromCheckoutSession(sessionOrIntentId, userId);
}
```

This dual handling ensures that entitlements are created correctly regardless of whether the payment was processed through Stripe Checkout or a direct Payment Intent, providing flexibility in the payment flow.

#### Handling User Entitlement Issues

If users are experiencing issues with entitlements, follow these steps:

1. **Missing User Entitlements**: Verify that entitlements exist in the `user_entitlements` table for the user's purchases.

```sql
SELECT * FROM user_entitlements WHERE user_id = 'USER_ID';
```

2. **Inactive Entitlements**: Check if entitlements are marked as inactive.

```sql
SELECT * FROM user_entitlements WHERE user_id = 'USER_ID' AND is_active = false;
```

3. **Check Purchase Records**: Verify that the purchase records exist and are marked as completed.

```sql
SELECT * FROM purchases WHERE user_id = 'USER_ID';
```

4. **Check Payment Status**: Verify the payment status in Stripe.

5. **Verify Purchase API**: Manually trigger the verify purchase API to create missing entitlements:

```
GET /api/create-entitlements?session_id=SESSION_ID&user_id=USER_ID
```

Note that the `session_id` parameter can be either a Stripe Checkout Session ID (starting with `cs_`) or a Payment Intent ID (starting with `pi_`). The system will automatically detect the type and process it accordingly.

The checkout success page (`src/app/checkout/success/page.tsx`) handles the verification of purchases and creation of entitlements. The flow works as follows:

1. After a successful checkout, the user is redirected to the success page with a `session_id` parameter
2. The success page retrieves the session ID from the URL
3. It calls the `/api/verify-purchase` endpoint to verify the payment and create entitlements
4. If successful, it displays a success message and provides a link to the dashboard

---

## Development Workflow

### Local Development

To set up the local development environment:

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `.env.local`
4. Set up the database:
   ```bash
   npm run setup-db
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

### Testing

The PMU Profit System includes several testing utilities:

- Unit tests for utility functions
- Integration tests for API routes
- End-to-end tests for user flows

To run tests:
```bash
npm test
```

For specific test suites:
```bash
npm run test:unit
npm run test:integration
npm run test:e2e
```

#### Authentication Flow Testing

We've implemented comprehensive testing tools to debug and verify the authentication flow between pages. These tools help identify issues with user authentication, session management, and page redirects.

### Available Testing Tools

#### 1. Browser-based Authentication Flow Test

This test uses Puppeteer to run a real browser and simulate the entire authentication flow:

- Navigates to the pre-checkout page
- Clicks the "Create Account & Continue" button
- Fills out the signup form with a test email and password
- Submits the form and waits for the response
- Verifies the redirect to the checkout page
- Checks that the checkout page loads properly

The test captures screenshots at each step, logs console messages, network requests, cookies, localStorage, and sessionStorage to help identify issues.

#### 2. API-based Authentication Flow Test

This test uses HTTP requests to test the authentication API endpoints directly:

- Creates a test user with a unique email
- Tests the signup API
- Tests the login API
- Tests session persistence
- Tests checkout page authentication

#### 3. Full User Journey Test

This test provides the most comprehensive verification of the entire conversion funnel:

- Starts at the homepage
- Clicks the "Get Started" CTA button
- Fills out the pre-checkout form to create an account
- Completes the checkout process
- Verifies the success page
- Navigates to the dashboard

This end-to-end test is particularly valuable for ensuring that the complete user journey works correctly, from initial landing to becoming a paying customer with dashboard access.

### Running the Tests

1. Install the required dependencies:
   ```
   npm run test:install-deps
   ```

2. Run the browser-based authentication test:
   ```
   npm run test:auth:browser
   ```

3. Run the API-based authentication test:
   ```
   npm run test:auth
   ```

4. Run the full user journey test:
   ```
   npm run test:full-journey
   ```

### Test Output

The tests generate detailed logs and screenshots in the `browser-test-output` directory:

- `auth-flow-browser-test-[timestamp].log`: Detailed log of the browser authentication test
- `full-journey-test-[timestamp].log`: Detailed log of the full user journey test
- Screenshots of each step in the process, numbered sequentially

For the full user journey test, screenshots include the homepage, CTA click, pre-checkout form, checkout page, success page, and dashboard access.

### Debugging Authentication Issues

The authentication flow tests help identify several common issues:

1. **Cookie Management**: The tests log all cookies at each step, helping to identify issues with cookie creation, storage, or transmission.

2. **Session Storage**: The tests capture sessionStorage values, which are used to track the "justSignedUp" flag that prevents redirect loops.

3. **Redirect Logic**: The tests verify that users are correctly redirected from pre-checkout to checkout after signup.

4. **Authentication State**: The tests log the authentication state at each step, helping to identify issues with state management.

5. **Network Requests**: The tests capture all network requests and responses, helping to identify issues with API calls.

This documentation provides a comprehensive overview of the PMU Profit System. For specific questions or issues, please refer to the appropriate section or contact the development team. 

### Error Handling

The application uses a centralized error handling approach:

- Client-side errors are caught and displayed using toast notifications
- Server-side errors are logged and return appropriate HTTP status codes
- Validation errors provide specific feedback to users
- Critical errors are reported to monitoring systems

---

## Deployment

### Environment Setup

Before deployment, ensure the following environment variables are set:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_ROLE_KEY=eyJh...

# Stripe
STRIPE_SECRET_KEY=sk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Application
NEXT_PUBLIC_SITE_URL=https://your-site.com
```

### Deployment Process

The PMU Profit System is deployed to Vercel:

1. Push changes to the main branch
2. Vercel automatically builds and deploys the application
3. Verify the deployment by checking the Vercel dashboard
4. Run post-deployment tests to ensure everything works

For manual deployment:
```bash
npm run build
npm run start
```

### Post-Deployment Verification

After deploying, verify the following:

1. The application loads correctly at your production URL
2. User registration works
3. User login works
4. Protected routes (dashboard) are accessible only to authenticated users
5. The purchase flow works correctly

---

## Troubleshooting

### Authentication Issues

#### User Cannot Log In

**Symptoms:**
- User enters correct credentials but receives an error
- Login button seems to do nothing
- User gets redirected back to login page

**Possible Causes and Solutions:**

1. **Email Not Verified**
   - Check if the user has verified their email
   - Resend verification email from the login page
   - Check Supabase logs for verification status

2. **Account Banned**
   - Some accounts may be incorrectly marked as banned after verification
   - Use the "Resend Verification Email" feature which includes an automatic unban
   - Admin can manually unban in Supabase dashboard

3. **Missing User Profile**
   - User exists in auth.users but not in public.users table
   - The application should automatically create a profile if missing
   - Check database for user profile

#### Middleware Authentication and Entitlement Checking

The middleware (`src/middleware.ts`) has been improved to properly check for user entitlements:

```typescript
export async function middleware(request: NextRequest) {
  // Check if the route is protected
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard');
  const isTestPage = request.nextUrl.pathname.startsWith('/test');
  
  // Allow test pages without authentication
  if (isTestPage) {
    return NextResponse.next();
  }
  
  // If it's not a protected route, allow access
  if (!isProtectedRoute) {
    return NextResponse.next();
  }
  
  // Get the user's session
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    // If the user is not authenticated, redirect to login
    if (!session) {
      console.log('User not authenticated, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Check if the user has active entitlements
    const { data: entitlements } = await supabase
      .from('user_entitlements')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_active', true);
    
    // If the user doesn't have any active entitlements, redirect to checkout
    if (!entitlements || entitlements.length === 0) {
      console.log('User has no active entitlements, redirecting to checkout');
      return NextResponse.redirect(new URL('/checkout', request.url));
    }
    
    // User is authenticated and has entitlements, allow access
    return NextResponse.next();
  } catch (error) {
    console.error('Error in middleware:', error);
    // If there's an error, allow access to avoid blocking legitimate users
    return NextResponse.next();
  }
}
```

This middleware ensures that:
1. Protected routes are only accessible to authenticated users
2. Users without active entitlements are redirected to the checkout page
3. Test pages are accessible without authentication (for development purposes)
4. Errors are properly handled to avoid blocking legitimate users

#### Debug API Endpoint

A debug API endpoint has been added at `/api/debug/user-entitlements` to help diagnose user entitlement issues:

```typescript
export async function GET(req: NextRequest) {
  const supabase = createClient(cookies());
  
  try {
    // Get the current user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session:', sessionError);
      return NextResponse.json({ error: 'Error getting session' }, { status: 500 });
    }
    
    if (!session) {
      return NextResponse.json({ authenticated: false, message: 'No active session' }, { status: 200 });
    }
    
    // Get the user's entitlements
    const { data: entitlements, error: entitlementsError } = await supabase
      .from('user_entitlements')
      .select('*, products:product_id(id, name, description, price, type)')
      .eq('user_id', session.user.id)
      .eq('is_active', true);
    
    if (entitlementsError) {
      console.error('Error getting entitlements:', entitlementsError);
      return NextResponse.json({ error: 'Error getting entitlements' }, { status: 500 });
    }
    
    // Get all active products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('active', true);
    
    if (productsError) {
      console.error('Error getting products:', productsError);
      return NextResponse.json({ error: 'Error getting products' }, { status: 500 });
    }
    
    // Return the user's authentication status, entitlements, and products
    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
      },
      entitlements,
      entitlementCount: entitlements?.length || 0,
      products,
      productCount: products?.length || 0,
    }, { status: 200 });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

This endpoint provides detailed information about:
1. The user's authentication status
2. The user's active entitlements
3. All active products in the system
4. Counts of entitlements and products

It's a valuable tool for debugging issues with user entitlements and access control.

### Payment Issues

#### Payment Fails

**Symptoms:**
- User gets an error during checkout
- Payment is declined
- Stripe checkout doesn't load

**Solutions:**
1. Check Stripe dashboard for error logs
2. Verify Stripe API keys are correct
3. Ensure the application is using HTTPS (required for Stripe)
4. Check that product and price IDs match in Stripe and the application
5. Verify webhook endpoints are correctly configured

#### Purchase Not Recorded

**Symptoms:**
- Payment succeeds but user doesn't get access to purchased content
- No record in purchases table

**Solutions:**
1. Check Stripe webhook logs for delivery failures
2. Verify that the webhook handler is correctly processing events
3. Check database connection and permissions
4. Manually add the purchase record if needed

### Database Issues

#### Missing Tables or Columns

**Symptoms:**
- Application throws errors about missing tables or columns
- Features that rely on database fail

**Solutions:**
1. Run the database setup script from `scripts/database/setup-database.js`
2. Check Supabase dashboard for schema issues
3. Manually create missing tables or columns
4. Verify database migrations have been applied

#### Row Level Security Blocking Access

**Symptoms:**
- User can't access their own data
- Queries return no results even though data exists

**Solutions:**
1. Check RLS policies in Supabase dashboard
2. Verify that the user is authenticated when making requests
3. Ensure policies are correctly written to allow access
4. Test queries with service role key to bypass RLS for debugging

### Deployment Problems

#### Build Fails on Vercel

**Symptoms:**
- Deployment fails with TypeScript errors
- Build process terminates with an error

**Solutions:**
1. Check the error logs for specific TypeScript errors
2. Fix type issues in the codebase
3. Ensure all dependencies are correctly installed
4. Verify environment variables are properly set
5. Check for compatibility issues between packages

#### Application Crashes After Deployment

**Symptoms:**
- Application loads but crashes when using certain features
- Server returns 500 errors

**Solutions:**
1. Check server logs for error details
2. Verify environment variables are correctly set in production
3. Ensure database connection is working
4. Check for differences between development and production environments
5. Roll back to a previous working version if necessary

### UI/UX Issues

#### Hydration Errors

**Symptoms:**
- Console shows React hydration errors
- UI elements flicker or behave unexpectedly

**Solutions:**
1. Ensure server and client rendering match
2. Avoid using browser-specific APIs during server rendering
3. Use proper conditional rendering for client-side components
4. Add the 'use client' directive where needed

### User Entitlement Issues

#### Row Level Security (RLS) Policy Mismatch

**Symptoms:**
- User purchases are successful but entitlements don't appear in the user's profile
- User can't access content they've purchased
- Database queries for entitlements return no results even though purchases exist

**Root Cause:**
The issue stems from a mismatch between how JWT claims are set in client-side requests versus server-side requests. When a user makes a purchase, the entitlements are created server-side using the service role key, but when the user tries to access their entitlements client-side, the JWT claims aren't properly set in the request headers.

**Solutions:**

1. **User-Specific Supabase Client**
   - Created a new `createUserSpecificSupabaseClient` function in `src/lib/supabase.ts` that adds the user ID to request headers
   - This ensures that the user ID is available for RLS policies
   ```typescript
   export const createUserSpecificSupabaseClient = (userId: string) => {
     const supabase = createClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
       {
         global: {
           headers: {
             'x-user-id': userId,
           },
         },
       }
     );
     return supabase;
   };
   ```

2. **Middleware for JWT Claims**
   - Updated the Next.js middleware to set the user ID in the request context
   - Added functionality to set JWT claims using the `set_claim` RPC function
   ```typescript
   // In middleware.ts
   if (session) {
     try {
       // Set JWT claims for the user
       await supabase.rpc('set_claim', {
         uid: session.user.id,
         claim: 'user_id',
         value: session.user.id,
       });
     } catch (error) {
       console.error('Error setting JWT claims:', error);
     }
   }
   ```

3. **RLS Functions Setup**
   - Created a script to set up the necessary RPC functions for setting JWT claims
   - Added a `set_claim` function that updates the user's JWT claims in the database
   ```sql
   CREATE OR REPLACE FUNCTION public.set_claim(uid uuid, claim text, value jsonb)
   RETURNS text
   LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public
   AS $$
   BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM auth.users WHERE id = uid
     ) THEN
       RETURN 'User not found';
     END IF;
     
     UPDATE auth.users
     SET raw_app_meta_data = 
       raw_app_meta_data || 
       json_build_object(claim, value)::jsonb
     WHERE id = uid;
     
     RETURN 'OK';
   END;
   $$;
   ```

4. **Fallback Mechanism**
   - Updated the UserEntitlements component to use the user-specific Supabase client
   - Added a fallback to an API endpoint if the direct query fails due to RLS issues
   ```typescript
   // In UserEntitlements.tsx
   async function fetchProductsAndEntitlements() {
     try {
       // First try with user-specific client
       const userClient = createUserSpecificSupabaseClient(user.id);
       const { data, error } = await userClient
         .from('user_entitlements')
         .select('*, products:product_id(*)');
       
       if (error || !data) {
         // Fallback to API endpoint
         const response = await fetch('/api/user-entitlements');
         const apiData = await response.json();
         return apiData.entitlements || [];
       }
       
       return data;
     } catch (error) {
       console.error('Error fetching entitlements:', error);
       return [];
     }
   }
   ```

5. **API Endpoint for Entitlements**
   - Added a server-side API endpoint that uses the service role client to bypass RLS
   - This ensures users can always access their entitlements even if RLS issues occur
   ```typescript
   // In src/app/api/user-entitlements/route.ts
   export async function GET(req: NextRequest) {
     const supabase = createClient(cookies());
     const { data: { session } } = await supabase.auth.getSession();
     
     if (!session) {
       return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
     }
     
     // Use service role client to bypass RLS
     const serviceClient = getServiceSupabase();
     const { data, error } = await serviceClient
       .from('user_entitlements')
       .select('*, products:product_id(*)')
       .eq('user_id', session.user.id);
     
     if (error) {
       return NextResponse.json({ error: error.message }, { status: 500 });
     }
     
     return NextResponse.json({ entitlements: data });
   }
   ```

#### Product ID Format Mismatch

**Symptoms:**
- Purchases are recorded but entitlements aren't created
- Inconsistent product IDs between purchases and entitlements
- Some products use string IDs while others use UUID format

**Root Cause:**
The system was using two different formats for product IDs: legacy string IDs (e.g., 'pmu-profit-system') and UUID format (e.g., '4a554622-d759-42b7-b830-79c9136d2f96'). This inconsistency caused issues when creating entitlements from purchases.

**Solutions:**

1. **Enhanced Product ID Utility**
   - Added robust functions for handling both string and UUID formats in `src/lib/product-ids.ts`
   - Created a `normalizeProductId` function to ensure consistent format conversion
   - Added reverse mapping from UUID to legacy IDs
   ```typescript
   export function normalizeProductId(productId: string): string {
     // If it's already a valid UUID, return it
     if (isValidUuidProductId(productId)) {
       return productId;
     }
     
     // If it's a legacy ID, convert it to UUID
     if (isValidLegacyProductId(productId)) {
       const uuidId = legacyToUuidProductId(productId);
       if (uuidId) {
         return uuidId;
       }
     }
     
     // If we can't normalize it, return the original
     console.warn(`Could not normalize product ID: ${productId}`);
     return productId;
   }
   ```

2. **Updated Entitlements Creation**
   - Modified the entitlements creation function to use the normalized product IDs
   - Ensured consistent handling of product IDs across the application
   ```typescript
   // In src/lib/entitlements.ts
   export async function createEntitlementsFromPurchase(purchase: any) {
     const supabase = getServiceSupabase();
     const now = new Date().toISOString();
     
     // Get the product ID from the purchase
     let productId = purchase.product_id;
     
     // Normalize the product ID to ensure consistent format
     productId = normalizeProductId(productId);
     
     // Create the entitlement
     const { data, error } = await supabase
       .from('user_entitlements')
       .insert({
         user_id: purchase.user_id,
         product_id: productId,
         source_type: 'purchase',
         source_id: purchase.id,
         valid_from: now,
         is_active: true
       })
       .select()
       .single();
     
     if (error) {
       console.error('Error creating entitlement:', error);
       return { success: false, error };
     }
     
     return { success: true, entitlement: data };
   }
   ```

3. **Updated Fix Script**
   - Enhanced the fix-user-entitlements script with the new product ID handling
   - Added helper functions for consistent product ID normalization
   ```javascript
   // In scripts/database/fix-user-entitlements.js
   function normalizeProductId(productId) {
     // If it's already a valid UUID, return it
     if (isValidUuidProductId(productId)) {
       return productId;
     }
     
     // If it's a legacy ID, convert it to UUID
     if (isValidLegacyProductId(productId)) {
       const uuidId = PRODUCT_IDS[productId];
       if (uuidId) {
         return uuidId;
       }
     }
     
     // If we can't normalize it, return the original
     console.warn(`Could not normalize product ID: ${productId}`);
     return productId;
   }
   
   async function createEntitlementsFromPurchase(purchase) {
     // Normalize the product ID
     const productId = normalizeProductId(purchase.product_id);
     
     // Create the entitlement
     // ...
   }
   ```

#### Fixing Existing User Entitlements

If users have purchases but no entitlements, you can run the fix script to create the missing entitlements:

```bash
node scripts/database/fix-user-entitlements.js USER_ID
```

This script:
1. Fetches all purchases for the specified user
2. Checks if entitlements already exist for those purchases
3. Creates missing entitlements using the normalized product IDs
4. Handles both legacy and UUID product ID formats

For all users:

```bash
node scripts/database/fix-user-entitlements.js
```

#### Database Webhook for Automatic Entitlement Creation

To ensure future purchases automatically create entitlements, a database webhook has been set up:

1. The webhook triggers when a new row is inserted into the `purchases` table
2. It sends a POST request to the `/api/webhooks/database` endpoint
3. The endpoint creates entitlements based on the purchase data

To set up the webhook:

```sql
-- Enable the HTTP extension
CREATE EXTENSION IF NOT EXISTS http;

-- Create the webhook function
CREATE OR REPLACE FUNCTION notify_purchase_webhook()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM http_post(
    'https://your-site.com/api/webhooks/database',
    json_build_object('type', 'INSERT', 'table', 'purchases', 'record', row_to_json(NEW)),
    'application/json'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER purchases_webhook_trigger
AFTER INSERT ON purchases
FOR EACH ROW
EXECUTE FUNCTION notify_purchase_webhook();
```

Alternatively, you can use Supabase's built-in Database Webhooks feature in the Supabase dashboard.

---

## Implementation Guide

### Step-by-Step Setup

1. **Set up Supabase project**
   - Create a new project in Supabase
   - Enable email authentication
   - Configure email templates

2. **Set up Stripe account**
   - Create products and prices
   - Configure webhook endpoints
   - Get API keys

3. **Configure environment variables**
   - Create `.env.local` file with required variables
   - Set up variables in deployment environment

4. **Set up database schema**
   - Run the database setup script
   - Verify the schema

5. **Configure authentication**
   - Set up authentication in Supabase
   - Configure redirect URLs
   - Test signup and login flows

6. **Implement checkout flow**
   - Connect to Stripe API
   - Create checkout session
   - Handle success and cancel scenarios
   - Process webhook events

7. **Implement user dashboard**
   - Create protected routes
   - Display user's purchased content
   - Implement ad generator tool

### Configuration

The PMU Profit System can be configured through environment variables and settings in the Supabase and Stripe dashboards. Key configuration options include:

- **Authentication settings**: Email verification, password policies
- **Product configuration**: Available products, prices, features
- **UI customization**: Colors, logos, text
- **Email templates**: Verification, welcome, receipt emails

---

## Authentication Flow Testing

We've implemented comprehensive testing tools to debug and verify the authentication flow between pages. These tools help identify issues with user authentication, session management, and page redirects.

### Available Testing Tools

#### 1. Browser-based Authentication Flow Test

This test uses Puppeteer to run a real browser and simulate the entire authentication flow:

- Navigates to the pre-checkout page
- Clicks the "Create Account & Continue" button
- Fills out the signup form with a test email and password
- Submits the form and waits for the response
- Verifies the redirect to the checkout page
- Checks that the checkout page loads properly

The test captures screenshots at each step, logs console messages, network requests, cookies, localStorage, and sessionStorage to help identify issues.

#### 2. API-based Authentication Flow Test

This test uses HTTP requests to test the authentication API endpoints directly:

- Creates a test user with a unique email
- Tests the signup API
- Tests the login API
- Tests session persistence
- Tests checkout page authentication

#### 3. Full User Journey Test

This test provides the most comprehensive verification of the entire conversion funnel:

- Starts at the homepage
- Clicks the "Get Started" CTA button
- Fills out the pre-checkout form to create an account
- Completes the checkout process
- Verifies the success page
- Navigates to the dashboard

This end-to-end test is particularly valuable for ensuring that the complete user journey works correctly, from initial landing to becoming a paying customer with dashboard access.

### Running the Tests

1. Install the required dependencies:
   ```
   npm run test:install-deps
   ```

2. Run the browser-based authentication test:
   ```
   npm run test:auth:browser
   ```

3. Run the API-based authentication test:
   ```
   npm run test:auth
   ```

4. Run the full user journey test:
   ```
   npm run test:full-journey
   ```

### Test Output

The tests generate detailed logs and screenshots in the `browser-test-output` directory:

- `auth-flow-browser-test-[timestamp].log`: Detailed log of the browser authentication test
- `full-journey-test-[timestamp].log`: Detailed log of the full user journey test
- Screenshots of each step in the process, numbered sequentially

For the full user journey test, screenshots include the homepage, CTA click, pre-checkout form, checkout page, success page, and dashboard access.

### Debugging Authentication Issues

The authentication flow tests help identify several common issues:

1. **Cookie Management**: The tests log all cookies at each step, helping to identify issues with cookie creation, storage, or transmission.

2. **Session Storage**: The tests capture sessionStorage values, which are used to track the "justSignedUp" flag that prevents redirect loops.

3. **Redirect Logic**: The tests verify that users are correctly redirected from pre-checkout to checkout after signup.

4. **Authentication State**: The tests log the authentication state at each step, helping to identify issues with state management.

5. **Network Requests**: The tests capture all network requests and responses, helping to identify issues with API calls.

This documentation provides a comprehensive overview of the PMU Profit System. For specific questions or issues, please refer to the appropriate section or contact the development team. 