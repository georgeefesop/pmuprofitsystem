# PMU Profit System - File Dependencies

## Table of Contents

1. [Introduction](#introduction)
2. [Core Dependencies](#core-dependencies)
3. [Authentication Flow](#authentication-flow)
4. [Checkout Flow](#checkout-flow)
5. [Dashboard Flow](#dashboard-flow)
6. [API Routes Dependencies](#api-routes-dependencies)
7. [Component Dependencies](#component-dependencies)
8. [Script Dependencies](#script-dependencies)
9. [Dependency Graph](#dependency-graph)

## Introduction

This document maps the dependencies between files in the PMU Profit System codebase. Understanding these dependencies is crucial for safely removing or modifying files without breaking functionality. This analysis focuses on the most important dependencies and does not attempt to be exhaustive.

## Core Dependencies

### Root Layout

- `src/app/layout.tsx` depends on:
  - `src/components/Navbar.tsx`
  - `src/components/SiteFooter.tsx`
  - `src/context/AuthContext.tsx`
  - `src/context/PurchaseContext.tsx`

### Middleware

- `src/middleware.ts` depends on:
  - `src/utils/supabase/middleware.ts`
  - `src/lib/error-handler.ts`

### Error Handling

- `src/app/global-error.tsx` depends on:
  - `src/lib/error-handler.ts`

- `src/app/error.tsx` depends on:
  - `src/lib/error-handler.ts`

## Authentication Flow

### Authentication Context

- `src/context/AuthContext.tsx` depends on:
  - `src/utils/supabase/client.ts`
  - `src/lib/error-handler.ts`

### Login Page

- `src/app/login/page.tsx` depends on:
  - `src/context/AuthContext.tsx`
  - `src/components/ui/button.tsx`
  - `src/components/ui/input.tsx`
  - `src/components/ui/card.tsx`

### Signup Page

- `src/app/signup/page.tsx` depends on:
  - `src/context/AuthContext.tsx`
  - `src/app/signup/signup-form.tsx`

- `src/app/signup/signup-form.tsx` depends on:
  - `src/context/AuthContext.tsx`
  - `src/components/ui/button.tsx`
  - `src/components/ui/input.tsx`
  - `src/components/ui/card.tsx`

### Register Page (Redundant)

- `src/app/register/page.tsx` depends on:
  - `src/context/AuthContext.tsx`
  - `src/components/ui/button.tsx`
  - `src/components/ui/input.tsx`
  - `src/components/ui/card.tsx`

### Auth Callback

- `src/app/auth/callback/route.ts` depends on:
  - `src/utils/supabase/server.ts`

### Forgot Password

- `src/app/forgot-password/page.tsx` depends on:
  - `src/context/AuthContext.tsx`
  - `src/components/ui/button.tsx`
  - `src/components/ui/input.tsx`
  - `src/components/ui/card.tsx`

## Checkout Flow

### Checkout Page

- `src/app/checkout/page.tsx` depends on:
  - `src/lib/stripe.ts`
  - `src/utils/supabase/server.ts`
  - `src/components/PaymentForm.tsx`

### Payment Form

- `src/components/PaymentForm.tsx` depends on:
  - `src/lib/stripe.ts`
  - `src/components/ui/button.tsx`
  - `src/components/ui/card.tsx`

### Checkout Success Page

- `src/app/checkout/success/page.tsx` depends on:
  - `src/utils/supabase/server.ts`
  - `src/lib/stripe.ts`

### Pre-Checkout Page

- `src/app/pre-checkout/page.tsx` depends on:
  - `src/context/AuthContext.tsx`
  - `src/components/ui/button.tsx`

## Dashboard Flow

### Dashboard Layout

- `src/app/dashboard/layout.tsx` depends on:
  - `src/components/DashboardLayout.tsx`
  - `src/components/Sidebar.tsx`
  - `src/context/AuthContext.tsx`
  - `src/context/PurchaseContext.tsx`

### Dashboard Home

- `src/app/dashboard/page.tsx` depends on:
  - `src/context/AuthContext.tsx`
  - `src/context/PurchaseContext.tsx`
  - `src/components/ui/card.tsx`
  - `src/components/ui/button.tsx`

### Dashboard Modules

- `src/app/dashboard/module/[id]/page.tsx` depends on:
  - `src/context/AuthContext.tsx`
  - `src/context/PurchaseContext.tsx`
  - `src/components/ui/card.tsx`

### Dashboard Profile

- `src/app/dashboard/profile/page.tsx` depends on:
  - `src/context/AuthContext.tsx`
  - `src/components/ui/button.tsx`
  - `src/components/ui/input.tsx`
  - `src/components/ui/card.tsx`

## API Routes Dependencies

### Auth API Routes

- `src/app/api/auth/route.ts` depends on:
  - `src/utils/supabase/server.ts`
  - `src/lib/error-handler.ts`

### Stripe API Routes

- `src/app/api/stripe/webhook/route.ts` depends on:
  - `src/lib/stripe.ts`
  - `src/utils/supabase/server.ts`
  - `src/lib/error-handler.ts`

- `src/app/api/stripe/create-checkout/route.ts` depends on:
  - `src/lib/stripe.ts`
  - `src/utils/supabase/server.ts`
  - `src/lib/error-handler.ts`

### User API Routes

- `src/app/api/user/route.ts` depends on:
  - `src/utils/supabase/server.ts`
  - `src/lib/error-handler.ts`

### Test API Routes

- `src/app/api/test-auth-status/route.ts` depends on:
  - `src/utils/supabase/server.ts`

- `src/app/api/test-checkout-flow/route.ts` depends on:
  - `src/lib/stripe.ts`
  - `src/utils/supabase/server.ts`

- `src/app/api/test-email-verification/route.ts` depends on:
  - `src/utils/supabase/server.ts`

- `src/app/api/test-stripe/route.ts` depends on:
  - `src/lib/stripe.ts`

- `src/app/api/create-test-api/route.ts` depends on:
  - `src/utils/supabase/server.ts`

- `src/app/api/debug-stripe/route.ts` depends on:
  - `src/lib/stripe.ts`

- `src/app/api/stripe-diagnostics/route.ts` depends on:
  - `src/lib/stripe.ts`

- `src/app/api/dev-logger/route.ts` depends on:
  - No significant dependencies

## Component Dependencies

### Navbar

- `src/components/Navbar.tsx` depends on:
  - `src/context/AuthContext.tsx`
  - `src/components/ui/button.tsx`
  - `src/components/ui/sheet.tsx` (recently added)
  - `src/components/ui/avatar.tsx` (recently added)

### Site Footer

- `src/components/SiteFooter.tsx` depends on:
  - `src/components/ui/container.tsx`

### Dashboard Layout

- `src/components/DashboardLayout.tsx` depends on:
  - `src/components/Sidebar.tsx`
  - `src/context/AuthContext.tsx`
  - `src/context/PurchaseContext.tsx`

### Sidebar

- `src/components/Sidebar.tsx` depends on:
  - `src/context/AuthContext.tsx`
  - `src/context/PurchaseContext.tsx`
  - `src/components/ui/button.tsx`

### UI Components

- Most UI components in `src/components/ui/` are independent and don't have significant dependencies on other files
- Exceptions:
  - `src/components/ui/toast.tsx` depends on `src/components/ui/use-toast.tsx`
  - `src/components/ui/toaster.tsx` depends on `src/components/ui/toast.tsx` and `src/components/ui/use-toast.tsx`

## Script Dependencies

### Development Scripts

- `scripts/auto-fix-dev.js` depends on:
  - `scripts/browser-error-logger.js`
  - `scripts/fix-all-errors.js`

- `scripts/auto-open-dev.js` depends on:
  - `scripts/browser-error-logger.js`

- `scripts/start-dev.js` depends on:
  - `scripts/browser-error-logger.js`

### Setup Scripts

- `scripts/setup-local-dev.js` depends on:
  - `scripts/setup-supabase.js`
  - `scripts/setup-database.js`
  - `scripts/setup-https.js`

- `scripts/setup-database.js` depends on:
  - `scripts/verify-database.js`

### Error Fixing Scripts

- `scripts/fix-all-errors.js` depends on:
  - `scripts/fix-supabase-config.js`
  - `scripts/fix-viewport-metadata.js`
  - `scripts/fix-database-schema.js`

### Testing Scripts

- `scripts/test-complete-checkout.js` depends on:
  - `scripts/create-test-user.js`
  - `scripts/create-test-purchase.js`

- `scripts/test-webhook-handler.js` depends on:
  - `scripts/create-test-user.js`

## Dependency Graph

Below is a simplified dependency graph for the core components of the application:

```
layout.tsx
├── Navbar.tsx
│   ├── AuthContext.tsx
│   │   └── supabase/client.ts
│   ├── ui/button.tsx
│   ├── ui/sheet.tsx
│   └── ui/avatar.tsx
├── SiteFooter.tsx
│   └── ui/container.tsx
├── AuthContext.tsx
└── PurchaseContext.tsx

middleware.ts
└── supabase/middleware.ts

dashboard/layout.tsx
├── DashboardLayout.tsx
│   ├── Sidebar.tsx
│   │   ├── AuthContext.tsx
│   │   ├── PurchaseContext.tsx
│   │   └── ui/button.tsx
│   ├── AuthContext.tsx
│   └── PurchaseContext.tsx
├── AuthContext.tsx
└── PurchaseContext.tsx

checkout/page.tsx
├── stripe.ts
├── supabase/server.ts
└── PaymentForm.tsx
    ├── stripe.ts
    ├── ui/button.tsx
    └── ui/card.tsx

login/page.tsx
├── AuthContext.tsx
├── ui/button.tsx
├── ui/input.tsx
└── ui/card.tsx

signup/page.tsx
└── signup-form.tsx
    ├── AuthContext.tsx
    ├── ui/button.tsx
    ├── ui/input.tsx
    └── ui/card.tsx
```

This dependency graph illustrates the relationships between key files in the application. Understanding these dependencies is crucial for safely removing or modifying files without breaking functionality. 