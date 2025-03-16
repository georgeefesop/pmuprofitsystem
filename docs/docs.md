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
  - `payment_intent_id` (TEXT): Stripe payment intent ID for direct card payments
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

#### Environment Mismatch Protection

The PMU Profit System implements environment isolation to prevent users from accessing their accounts from different environments than where they were created. This is a security feature that helps maintain separation between development and production environments.

### How It Works

1. **Environment Detection**: The system determines the current environment based on the hostname:
   - `localhost` or `127.0.0.1` is considered the 'local' environment
   - `pmuprofitsystem.com` is considered the 'production' environment

2. **User Environment Tagging**: When a user is created, their account is tagged with the environment where it was created:
   ```javascript
   await supabase.auth.admin.createUser({
     email: email,
     password: password,
     email_confirm: true,
     app_metadata: {
       environment: getCurrentEnvironment(),
       environment_updated_at: new Date().toISOString()
     }
   });
   ```

3. **Login Verification**: During login, the system checks if the user's environment matches the current environment:
   ```javascript
   const userEnvironment = user.app_metadata?.environment;
   const currentEnvironment = getCurrentEnvironment();
   
   if (userEnvironment && userEnvironment !== currentEnvironment) {
     // Environment mismatch detected
     // Redirect to environment mismatch page
   }
   ```

4. **Environment Mismatch Page**: If a mismatch is detected, the user is redirected to a dedicated page that explains the issue and provides guidance.

### Testing Environment Mismatch

The environment mismatch functionality can be tested using the following scripts:

- `scripts/testing/test-environment-mismatch.js`: Tests environment mismatch detection in the local environment
- `scripts/testing/test-production-environment.js`: Tests environment mismatch detection in the production environment

### Updating User Environments

For legacy users without an environment tag, the system provides a script to update their environment:

- `scripts/database/update-user-environments.js`: Updates users without an environment tag to the specified environment

Usage:
```bash
node scripts/database/update-user-environments.js [environment] [force]
```

Where:
- `environment` is either 'local' or 'production'
- `force` is a boolean flag to force update all users regardless of their current environment

### Authentication Flow

The authentication flow in the PMU Profit System works as follows:

1. **User Sign-Up**: Users can sign up via the registration form or during checkout.
2. **Email Verification**: Supabase sends a verification email to the user.
3. **Login**: Users can log in with their email and password.
4. **Session Management**: Supabase handles session management using cookies or local storage.
5. **Route Protection**: Protected routes (like `/dashboard`) are guarded by middleware.

#### Middleware Protection

The middleware system (`src/middleware.ts` and `src/middleware/` directory) protects routes by:

1. Checking if the user is authenticated
2. Verifying user entitlements for protected routes
3. Redirecting unauthenticated users to login
4. Redirecting authenticated users without entitlements to checkout
5. Handling special routes like checkout success pages

The middleware has been refactored into a modular structure for better maintainability:

```
src/
├── middleware.ts                # Entry point that re-exports from middleware/index.ts
└── middleware/
    ├── index.ts                 # Main middleware implementation
    ├── logger/
    │   └── index.ts             # Configurable logging system
    ├── utils/
    │   ├── auth.ts              # Authentication utilities
    │   ├── browser-logger.ts    # Browser error logging for development
    │   ├── entitlements.ts      # Entitlements management
    │   └── routes.ts            # Route configuration and checking
    └── handlers/
        ├── entitlements.ts      # Entitlements checking and handling
        └── special-routes.ts    # Special route handlers
```

The middleware uses a configurable logging system that can be adjusted via the `MIDDLEWARE_LOG_LEVEL` environment variable:

```typescript
// Available log levels: 'debug', 'info', 'warn', 'error', 'none'
const MIDDLEWARE_LOG_LEVEL = process.env.MIDDLEWARE_LOG_LEVEL || 'info';
```

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

> **Note**: For a comprehensive list of all API endpoints with detailed request/response examples, please refer to the [API-ENDPOINTS.md](./API-ENDPOINTS.md) document.

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

The PMU Profit System uses Stripe for payment processing. The integration includes:

- **Stripe Checkout**: For the main course purchase
- **Direct Card Payments**: For add-on purchases using Stripe Elements
- **Webhook Integration**: For handling post-payment events

#### Required Environment Variables

```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Checkout Flow

### Main Checkout Flow
The main checkout flow uses Stripe Checkout Sessions to process payments for the main product and optional add-ons. The flow is as follows:

1. User selects products and clicks "Checkout"
2. The system creates a Stripe Checkout Session with the selected products
3. User is redirected to the Stripe Checkout page
4. User completes payment on the Stripe Checkout page
5. User is redirected to the success page
6. The success page verifies the purchase and creates entitlements

### Add-on Checkout Flow
The add-on checkout flow uses Stripe Payment Intents to process payments for individual add-on products. The flow is as follows:

1. User clicks "Purchase" on an add-on product
2. User is redirected to the add-on checkout page
3. The system creates a Stripe Payment Intent for the add-on product
4. User enters payment details on the add-on checkout page
5. Payment is processed using Stripe Elements
6. User is redirected to the success page
7. The success page verifies the purchase and creates entitlements

### Verified Sessions
To improve the reliability of the checkout process, we've implemented a `verified_sessions` table that stores information about verified checkout sessions and payment intents. This table is used to:

1. Track which sessions and payment intents have been verified
2. Store metadata about the purchase, including user ID, product ID, and email
3. Provide a fallback mechanism for creating entitlements if the webhook fails

The table schema is as follows:

```sql
CREATE TABLE public.verified_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT,
  payment_intent_id TEXT,
  user_id UUID,
  customer_email TEXT,
  payment_status TEXT,
  metadata JSONB,
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Webhook Handler
The webhook handler processes events from Stripe, including `checkout.session.completed` and `payment_intent.succeeded` events. When these events are received, the webhook handler:

1. Stores the session or payment intent in the `verified_sessions` table
2. Creates entitlements for the user based on the products purchased
3. Updates the purchase status to `completed`

If the webhook fails to process an event, the success page will attempt to verify the purchase directly with Stripe and create entitlements.

### Direct Card Payment Flow

Add-on products now use Stripe Checkout for a consistent payment experience:

1. User selects an add-on product (e.g., Blueprint, Pricing Template)
2. User clicks the "Buy Now" button on the product page
3. System creates a Checkout Session via `/api/create-checkout-session` directly from the product page
4. User is redirected to Stripe's hosted checkout page
5. After payment, Stripe redirects the user back to the success page with the product parameter
6. The success page verifies the purchase and grants access to the add-on
7. User is redirected to the appropriate dashboard page for the purchased add-on

#### Add-on Products

The system supports the following add-on products:

| Product | ID | UUID | Price | Description |
|---------|----|----|-------|-------------|
| Consultation Success Blueprint | `consultation-success-blueprint` | `e5749058-500d-4333-8938-c8a19b16cd65` | €33.00 | Transform your consultations into bookings with our proven framework |
| Premium Pricing Template | `pricing-template` | `f2a8c6b1-9d3e-4c7f-b5a2-1e8d7f9b6c3a` | €27.00 | Create professional, conversion-optimized pricing packages in minutes |
| PMU Ad Generator | `pmu-ad-generator` | `4ba5c775-a8e4-449e-828f-19f938e3710b` | €27.00 | AI-powered tool to create high-converting ad copy |

All product IDs are defined in the `src/lib/product-ids.ts` file, which maintains mappings between string IDs (used in URLs and API calls) and UUIDs (used in the database).

#### Add-on Payment Implementation

The add-on payment system consists of:

- **Product Purchase Pages**: Handle the direct creation of checkout sessions
- **create-checkout-session API**: Creates a Stripe Checkout Session for the add-on
- **Stripe Webhook Handler**: Processes the checkout.session.completed event
- **Success Page**: Verifies the purchase and grants access to the add-on
- **PurchaseContext**: Handles recording successful payments, including for unauthenticated users

```typescript
// Example: Creating a checkout session directly from the product page
const handlePurchaseClick = async () => {
  setIsProcessing(true);
  
  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId: 'consultation-success-blueprint',
        successUrl: `${window.location.origin}/checkout/success?product=consultation-success-blueprint`,
        cancelUrl: `${window.location.origin}/dashboard/blueprint/purchase`,
      }),
    });
    
    const { url } = await response.json();
    
    // Redirect directly to Stripe checkout
    window.location.href = url;
  } catch (err) {
    console.error('Checkout error:', err);
  }
};
```

### Webhooks

Stripe webhooks are used to handle asynchronous payment events:

1. Stripe sends webhook events to `/api/webhooks/stripe`
2. The webhook handler verifies the event signature
3. Based on the event type, the system updates the database
4. For successful payments, the system grants access to the purchased product

#### Webhook Implementation

The webhook handler processes several types of events:

- **checkout.session.completed**: Handles completed checkout sessions for both main course and add-on products
  - For add-ons: Creates a purchase record and entitlement based on the product ID in the session metadata
  - For main course: Creates entitlements for all included products


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
   ```

## Unauthenticated Checkout Flow

The system now supports purchases by unauthenticated users through a webhook-first approach. This allows users to complete purchases even if they're not logged in, with the following key components:

### Verified Sessions Table

A new `verified_sessions` table has been added to store information about verified checkout sessions:

```sql
CREATE TABLE public.verified_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  payment_intent_id TEXT,
  user_id UUID,
  customer_email TEXT,
  payment_status TEXT,
  metadata JSONB,
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

This table stores information about verified Stripe checkout sessions, including:
- Session ID and payment intent ID for tracking
- User ID (if available) for linking to authenticated users
- Customer email for communication
- Payment status and metadata for verification

### Webhook Handler Enhancements

The Stripe webhook handler has been enhanced to:

1. Store verified sessions in the `verified_sessions` table
2. Handle unauthenticated users by:
   - Finding existing users by email
   - Creating temporary users when needed
   - Creating purchase records and entitlements

### Purchase Verification API

A new API endpoint at `/api/verify-purchase` allows verification of purchases by:
- Product ID
- Session ID or payment intent ID

The API checks multiple sources:
1. Verified sessions table
2. Purchases table
3. User entitlements

### PurchaseContext Updates

The `PurchaseContext` has been updated to handle unauthenticated users by:
- Checking if the user is authenticated
- Using the verify-purchase API for unauthenticated users
- Providing appropriate redirect URLs based on the product

### Implementation Details

When a webhook event is received:
1. The session is verified and stored in the `verified_sessions` table
2. If the user is not authenticated but has an email, we:
   - Look for an existing user with that email
   - Create a temporary user if needed
   - Create purchase records and entitlements
3. The success page can verify the purchase using the payment intent ID

This approach ensures that:
- Purchases are properly recorded even for unauthenticated users
- Users can access their purchased content after payment
- The system maintains data integrity and security