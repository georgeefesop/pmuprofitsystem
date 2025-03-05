# PMU Profit System Code Structure

This document provides a comprehensive overview of the code structure of the PMU Profit System.

## Table of Contents

1. [Overview](#overview)
2. [Directory Structure](#directory-structure)
3. [Key Components](#key-components)
4. [Authentication Flow](#authentication-flow)
5. [Payment Flow](#payment-flow)
6. [Dashboard Structure](#dashboard-structure)
7. [API Routes](#api-routes)
8. [Utility Functions](#utility-functions)
9. [Error Handling](#error-handling)
10. [Best Practices](#best-practices)

## Overview

The PMU Profit System is built using Next.js with the App Router, TypeScript, Tailwind CSS, Supabase for authentication and database, and Stripe for payment processing. The codebase follows a modular structure with clear separation of concerns.

## Directory Structure

```
pmuprofitsystem/
├── docs/                        # Documentation
├── public/                      # Static assets
│   ├── images/                  # Image assets
│   └── favicon/                 # Favicon assets
├── ReferenceAssets/             # Reference assets
├── scripts/                     # Development and build scripts
├── src/                         # Source code
│   ├── app/                     # Next.js App Router pages
│   │   ├── api/                 # API routes
│   │   ├── dashboard/           # Dashboard pages
│   │   ├── auth/                # Authentication pages
│   │   ├── checkout/            # Checkout pages
│   │   └── ...                  # Other pages
│   ├── components/              # React components
│   │   ├── ui/                  # UI components
│   │   └── sections/            # Page sections
│   ├── contexts/                # React contexts
│   ├── lib/                     # Utility libraries
│   ├── utils/                   # Utility functions
│   │   └── supabase/            # Supabase utilities
│   └── middleware.ts            # Next.js middleware
└── ...                          # Configuration files
```

## Key Components

### App Router Pages

The `src/app` directory contains all the pages of the application, following the Next.js App Router convention:

- `app/page.tsx`: The landing page
- `app/layout.tsx`: The root layout component
- `app/global-error.tsx`: Global error handling component
- `app/error.tsx`: Error handling component for the root route

### Authentication Pages

- `app/login/page.tsx`: Login page
- `app/register/page.tsx`: Registration page
- `app/auth/callback/route.ts`: Auth callback route for Supabase
- `app/verify-email/page.tsx`: Email verification page

### Checkout Pages

- `app/checkout/page.tsx`: Checkout page
- `app/checkout/success/page.tsx`: Checkout success page

### Dashboard Pages

- `app/dashboard/page.tsx`: Dashboard home page
- `app/dashboard/module/[id]/page.tsx`: Module page
- `app/dashboard/ad-generator/page.tsx`: Ad generator page
- `app/dashboard/blueprint/page.tsx`: Blueprint page
- `app/dashboard/profile/page.tsx`: User profile page

### Components

- `components/Navbar.tsx`: Navigation bar component
- `components/SiteFooter.tsx`: Footer component
- `components/DashboardLayout.tsx`: Layout component for dashboard pages
- `components/Sidebar.tsx`: Sidebar component for dashboard pages
- `components/PaymentForm.tsx`: Payment form component for Stripe
- `components/StripeProvider.tsx`: Stripe provider component
- `components/ErrorBoundary.tsx`: Error boundary component

### UI Components

- `components/ui/button.tsx`: Button component
- `components/ui/card.tsx`: Card component
- `components/ui/input.tsx`: Input component
- `components/ui/form.tsx`: Form component

## Authentication Flow

The authentication flow is handled by Supabase Auth and consists of the following steps:

1. **User Registration**:
   - User enters email, password, and name on the checkout page
   - The form is submitted to the server
   - A new user is created in Supabase Auth
   - A verification email is sent to the user
   - The user is redirected to the checkout success page

2. **Email Verification**:
   - User clicks the verification link in the email
   - Supabase Auth verifies the email
   - The user is redirected to the login page

3. **User Login**:
   - User enters email and password on the login page
   - The form is submitted to the server
   - Supabase Auth verifies the credentials
   - The user is redirected to the dashboard

4. **Session Management**:
   - Supabase Auth manages the user session
   - The session is stored in cookies
   - The middleware checks the session for protected routes
   - The user is redirected to the login page if not authenticated

### Authentication Context

The `src/contexts/AuthContext.tsx` file provides a React context for authentication state management:

```tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string, metadata?: { full_name?: string }) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

// ... context implementation
```

### Middleware

The `src/middleware.ts` file handles route protection:

```tsx
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;
  
  // Define protected routes that require authentication
  const isProtectedRoute = path.startsWith('/dashboard');
  
  // Create a Supabase client
  const { supabase, response } = createClient(request);
  
  // Get the user's session
  const { data: { session } } = await supabase.auth.getSession();
  
  // If the route is protected and the user is not authenticated,
  // redirect to the login page with the original URL as a redirect parameter
  if (isProtectedRoute && !session) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', path);
    return NextResponse.redirect(url);
  }
  
  // Continue with the request if authenticated or not a protected route
  return response;
}
```

## Payment Flow

The payment flow is handled by Stripe and consists of the following steps:

1. **Checkout Page**:
   - User selects products and enters email and password
   - The form is submitted to the server
   - A new user is created in Supabase Auth
   - A Stripe checkout session is created
   - The user is redirected to the Stripe checkout page

2. **Stripe Checkout**:
   - User enters payment information on the Stripe checkout page
   - Stripe processes the payment
   - The user is redirected to the checkout success page

3. **Checkout Success Page**:
   - The checkout success page displays a success message
   - The user is prompted to verify their email
   - The user can log in to access the purchased products

### Stripe Integration

The `src/components/PaymentForm.tsx` file handles direct card payments using Stripe Elements:

```tsx
'use client';

import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';

interface PaymentFormProps {
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: Error) => void;
}

export function PaymentForm({ amount, onSuccess, onError }: PaymentFormProps) {
  // ... payment form implementation
}
```

The `src/components/StripeProvider.tsx` file provides a Stripe provider for the payment form:

```tsx
'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function StripeProvider({ children }: { children: React.ReactNode }) {
  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
}
```

## Dashboard Structure

The dashboard is structured as follows:

1. **Dashboard Layout**:
   - The `src/components/DashboardLayout.tsx` file provides a layout for dashboard pages
   - The layout includes a sidebar, header, and main content area

2. **Sidebar**:
   - The `src/components/Sidebar.tsx` file provides a sidebar for navigation
   - The sidebar includes links to modules, ad generator, blueprint, and profile

3. **Module Pages**:
   - The `src/app/dashboard/module/[id]/page.tsx` file displays a module
   - The page includes a video player, content, and a "Mark as Complete" button

4. **Ad Generator**:
   - The `src/app/dashboard/ad-generator/page.tsx` file provides an ad generator
   - The page includes a form for generating ads and displays the generated ads

5. **Blueprint**:
   - The `src/app/dashboard/blueprint/page.tsx` file provides access to the blueprint
   - The page includes a download link for the blueprint

6. **Profile**:
   - The `src/app/dashboard/profile/page.tsx` file displays the user's profile
   - The page includes options to update the profile and delete the account

## API Routes

The API routes are located in the `src/app/api` directory and follow the Next.js App Router convention:

- `api/auth/route.ts`: Authentication API
- `api/create-checkout/route.ts`: Stripe checkout API
- `api/create-payment-intent/route.ts`: Stripe payment intent API
- `api/verify-payment-intent/route.ts`: Stripe payment intent verification API
- `api/webhooks/stripe/route.ts`: Stripe webhook API
- `api/send-email/route.ts`: Email sending API
- `api/check-verification-status/route.ts`: Email verification status API
- `api/manual-send-verification/route.ts`: Manual email verification API
- `api/unban-user/route.ts`: User unbanning API
- `api/check-supabase-settings/route.ts`: Supabase settings API
- `api/update-supabase-settings/route.ts`: Supabase settings update API
- `api/test-supabase/route.ts`: Supabase connection test API
- `api/test-supabase-auth/route.ts`: Supabase auth test API
- `api/test-auth-status/route.ts`: Auth status test API
- `api/check-user-details/route.ts`: User details API
- `api/debug-stripe/route.ts`: Stripe debug API

## Utility Functions

### Supabase Utilities

The `src/utils/supabase` directory contains utilities for Supabase integration:

- `client.ts`: Client-side Supabase client
- `server.ts`: Server-side Supabase client
- `middleware.ts`: Middleware Supabase client

### Error Handling Utilities

The `src/lib/error-handler.ts` file provides utilities for error handling:

```typescript
/**
 * Error handling utilities for the PMU Profit System
 * This module provides functions to catch, log, and handle various types of errors
 */
import React from 'react';

// Define error types for better categorization
export enum ErrorType {
  IMAGE = 'IMAGE',
  API = 'API',
  COMPONENT = 'COMPONENT',
  ROUTE = 'ROUTE',
  UNKNOWN = 'UNKNOWN'
}

// ... error handling utilities
```

### General Utilities

The `src/lib/utils.ts` file provides general utility functions:

```typescript
/**
 * General utility functions for the PMU Profit System
 */

// Get the site URL, preserving the protocol
export const getSecureSiteUrl = () => {
  // ... implementation
};

// ... other utility functions
```

## Error Handling

The error handling system consists of the following components:

1. **Error Handler Library**:
   - The `src/lib/error-handler.ts` file provides utilities for error handling
   - The library includes functions for capturing, logging, and handling errors

2. **Error Boundary Component**:
   - The `src/components/ErrorBoundary.tsx` file provides an error boundary component
   - The component catches errors in its children and displays a fallback UI

3. **Global Error Handlers**:
   - The `src/app/global-error.tsx` file provides a global error handler
   - The `src/app/error.tsx` file provides an error handler for the root route

4. **Error Checking Scripts**:
   - The `scripts/check-build-errors.js` file checks for common build errors
   - The `scripts/check-image-domains.js` file checks for image domain errors

## Best Practices

1. **TypeScript**:
   - Use TypeScript for all code
   - Prefer interfaces over types
   - Use proper type annotations for all functions and variables
   - Avoid using `any` type

2. **React Components**:
   - Use functional components with TypeScript interfaces
   - Use the `function` keyword for pure functions
   - Add the `'use client'` directive at the top of client components
   - Minimize the use of `useEffect` and `useState`
   - Favor React Server Components (RSC) where possible

3. **Styling**:
   - Use Tailwind CSS for styling
   - Follow a mobile-first approach
   - Use Shadcn UI and Radix UI components where appropriate

4. **Error Handling**:
   - Use the error handling utilities in `src/lib/error-handler.ts`
   - Wrap critical components in `ErrorBoundary` components
   - Use try-catch blocks for async operations

5. **API Routes**:
   - Use the Next.js App Router convention for API routes
   - Validate input data
   - Handle errors properly
   - Return appropriate status codes

6. **Authentication**:
   - Use Supabase Auth for authentication
   - Protect routes using middleware
   - Handle email verification properly
   - Provide clear error messages for authentication issues

7. **Payment Processing**:
   - Use Stripe for payment processing
   - Handle webhooks for asynchronous payment events
   - Provide clear error messages for payment issues
   - Test payments thoroughly

8. **Documentation**:
   - Document all code with comments
   - Update documentation when making changes
   - Follow the documentation guidelines in the [README](README.md) 