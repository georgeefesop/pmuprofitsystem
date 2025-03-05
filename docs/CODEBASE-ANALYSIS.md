# PMU Profit System - Codebase Analysis

## Table of Contents

1. [Introduction](#introduction)
2. [Directory Structure](#directory-structure)
3. [Duplicate and Redundant Files](#duplicate-and-redundant-files)
4. [File Dependencies](#file-dependencies)
5. [Unused Files](#unused-files)
6. [Testing and Diagnostic Files](#testing-and-diagnostic-files)
7. [Recommendations](#recommendations)

## Introduction

This document provides a comprehensive analysis of the PMU Profit System codebase, identifying all files and their purposes, dependencies between files, and potential issues such as duplicate or unused files. This analysis is intended to help developers understand the codebase structure and make informed decisions about code organization and maintenance.

## Directory Structure

### Source Code (`src/`)

#### App Router (`src/app/`)

The `src/app` directory follows the Next.js App Router convention:

- **Main Pages**
  - `page.tsx`: The landing page
  - `layout.tsx`: The root layout component
  - `global-error.tsx`: Global error handling component
  - `error.tsx`: Error handling component for the root route
  - `globals.css`: Global CSS styles

- **Authentication Pages**
  - `login/`: Login page and related components
  - `signup/`: Signup page and related components
  - `register/`: Registration page (redundant with signup)
  - `auth/`: Authentication callback routes for Supabase
  - `forgot-password/`: Password reset functionality

- **Dashboard Pages**
  - `dashboard/`: Dashboard pages and related components

- **Checkout Pages**
  - `checkout/`: Checkout page and related components
  - `pre-checkout/`: Pre-checkout page and related components

- **Information Pages**
  - `about/`: About page
  - `contact/`: Contact page
  - `privacy/`: Privacy policy page
  - `terms/`: Terms of service page
  - `cookies/`: Cookie policy page
  - `account-deleted/`: Account deletion confirmation page

- **API Routes**
  - `api/`: API routes for server-side functionality

- **Test and Diagnostic Pages**
  - `diagnostics/`: Diagnostic pages for development
  - `stripe-diagnostics/`: Stripe-specific diagnostic pages
  - `local-diagnostics/`: Local development diagnostic pages
  - `error-test/`: Pages for testing error handling
  - `logger-test/`: Pages for testing logging functionality
  - `test-auth/`: Pages for testing authentication
  - `test-resend/`: Pages for testing email sending
  - `test-connection/`: Pages for testing API connections
  - `api-test/`: Pages for testing API functionality
  - `another-test/`: Additional test pages

#### Components (`src/components/`)

- **UI Components (`src/components/ui/`)**
  - `alert.tsx`: Alert component
  - `avatar.tsx`: Avatar component (empty file)
  - `badge.tsx`: Badge component
  - `button.tsx`: Button component
  - `card.tsx`: Card component
  - `connection-status.tsx`: Connection status indicator
  - `container.tsx`: Container component
  - `image.tsx`: Image component
  - `input.tsx`: Input component
  - `label.tsx`: Label component
  - `separator.tsx`: Separator component
  - `sheet.tsx`: Sheet/drawer component
  - `skeleton.tsx`: Skeleton loading component
  - `tabs.tsx`: Tabs component
  - `toast.tsx`: Toast notification component
  - `toaster.tsx`: Toast container component
  - `use-toast.tsx`: Toast hook

- **Layout Components**
  - `Navbar.tsx`: Navigation bar component
  - `SiteFooter.tsx`: Footer component
  - `DashboardLayout.tsx`: Layout for dashboard pages
  - `Sidebar.tsx`: Sidebar for dashboard pages

- **Section Components**
  - `sections/features.tsx`: Features section
  - `sections/FeaturesSection.tsx`: Alternative features section (redundant)

- **Form Components**
  - `PaymentForm.tsx`: Payment form for Stripe
  - `SignupForm.tsx`: Signup form

#### Context (`src/context/` and `src/contexts/`)

- **Authentication Context**
  - `context/AuthContext.tsx`: Authentication context provider (577 lines)
  - `contexts/AuthContext.tsx`: Alternative authentication context provider (110 lines, redundant)

- **Purchase Context**
  - `context/PurchaseContext.tsx`: Purchase context provider

#### Utilities (`src/lib/` and `src/utils/`)

- **Supabase Utilities**
  - `utils/supabase/client.ts`: Supabase client-side utilities
  - `utils/supabase/server.ts`: Supabase server-side utilities
  - `utils/supabase/middleware.ts`: Supabase middleware utilities
  - `lib/supabase.ts`: General Supabase utilities
  - `lib/supabase-utils.ts`: Additional Supabase utilities

- **Stripe Utilities**
  - `lib/stripe.ts`: Stripe utilities

- **Error Handling**
  - `lib/error-handler.ts`: Error handling utilities

#### Middleware (`src/middleware.ts`)

- `middleware.ts`: Next.js middleware for route protection and authentication
- `middleware.ts.backup`: Backup of the middleware file

### Scripts (`scripts/`)

- **Development Scripts**
  - `auto-fix-dev.js`: Runs development server with automatic error fixing
  - `auto-open-dev.js`: Starts development server and opens browser
  - `browser-error-logger.js`: Sets up browser console error logging to terminal
  - `direct-dev.js`: Starts development server directly
  - `launcher.js`: Launches development server in background
  - `start-dev.js`: Starts development server
  - `start-dev.bat`: Windows batch file for starting development server
  - `start-dev.sh`: Shell script for starting development server

- **Setup Scripts**
  - `setup-local-dev.js`: Sets up local development environment
  - `setup-supabase.js`: Sets up Supabase for local development
  - `setup-database.js`: Sets up the database
  - `setup-https.js`: Sets up HTTPS for local development
  - `setup-stripe-webhook.js`: Sets up Stripe webhook

- **Error Fixing Scripts**
  - `fix-all-errors.js`: Runs all error fixing scripts
  - `fix-supabase-config.js`: Fixes Supabase configuration issues
  - `fix-viewport-metadata.js`: Fixes viewport metadata issues
  - `fix-database-schema.js`: Fixes database schema issues
  - `check-build-errors.js`: Checks for common build errors

- **Testing Scripts**
  - `test-complete-checkout.js`: Tests complete checkout flow
  - `test-checkout-flow.js`: Tests checkout flow
  - `test-checkout-form.js`: Tests checkout form
  - `test-checkout.js`: Tests checkout functionality
  - `test-login.js`: Tests login functionality
  - `test-signup-flow.js`: Tests signup flow
  - `test-user-creation.js`: Tests user creation
  - `test-webhook-direct.js`: Tests webhook directly
  - `test-webhook-handler.js`: Tests webhook handler
  - `test-account-first-checkout-flow.js`: Tests first-time checkout flow

- **Diagnostic Scripts**
  - `check-site-url.js`: Checks site URL configuration
  - `check-stripe-webhook.js`: Checks Stripe webhook configuration
  - `check-user.js`: Checks user information
  - `check-user-account.js`: Checks user account details
  - `check-project.js`: Checks project configuration
  - `check-image-domains.js`: Checks image domains for Next.js
  - `count-supabase-users.js`: Counts users in Supabase
  - `diagnose-checkout-flow.js`: Diagnoses checkout flow issues

- **User Management Scripts**
  - `create-manual-user.js`: Creates a user manually
  - `create-test-user.js`: Creates a test user
  - `create-test-purchase.js`: Creates a test purchase
  - `delete-test-users.js`: Deletes test users
  - `remove-all-users.js`: Removes all users
  - `remove-test-users.js`: Alternative script to remove test users (redundant)
  - `verify-user-creation.js`: Verifies user creation
  - `verify-test-user.js`: Verifies test user

- **Simulation Scripts**
  - `simulate-complete-checkout.js`: Simulates complete checkout process

- **MCP Server Scripts**
  - `start-mcp-server.js`: Starts MCP server for Supabase
  - `run-mcp-direct.js`: Runs MCP server directly

- **Build Scripts**
  - `vercel-build.js`: Custom build script for Vercel deployment

- **Configuration Scripts**
  - `update-supabase-redirect-urls.js`: Updates Supabase redirect URLs
  - `disable-email-confirmation.js`: Disables email confirmation requirement

- **Documentation**
  - `README.md`: Documentation for scripts

### Documentation (`docs/`)

- `README.md`: Documentation overview
- `API-ROUTES.md`: API routes documentation
- `CODE-STRUCTURE.md`: Codebase structure overview
- `DATABASE-SCHEMA.md`: Database schema documentation
- `DEPLOYMENT.md`: Deployment guide
- `DEVELOPMENT-WORKFLOW.md`: Development workflow guide
- `ERROR_HANDLING.md`: Error handling documentation
- `STRIPE-INTEGRATION.md`: Stripe integration documentation
- `SUPABASE-AUTHENTICATION.md`: Authentication system documentation
- `supabase-setup-instructions.md`: Supabase setup instructions
- `TESTING.md`: Testing guide
- `TROUBLESHOOTING.md`: Troubleshooting guide

## Duplicate and Redundant Files

### Duplicate Context Directories

There are two directories for contexts:
- `src/context/AuthContext.tsx` (577 lines)
- `src/contexts/AuthContext.tsx` (110 lines)

The `src/context/AuthContext.tsx` file is more comprehensive and appears to be the primary implementation. The `src/contexts/AuthContext.tsx` file is likely redundant and should be removed.

### Redundant Authentication Pages

There are multiple authentication-related pages that serve similar purposes:
- `src/app/register/page.tsx`
- `src/app/signup/page.tsx`
- `src/app/signup/signup-form.tsx`

Since the application appears to use "signup" terminology elsewhere, the `register` page is likely redundant.

### Redundant Section Components

There are two files for features section:
- `src/components/sections/features.tsx`
- `src/components/sections/FeaturesSection.tsx`

One of these is likely redundant.

### Redundant User Management Scripts

There are multiple scripts for managing test users:
- `scripts/delete-test-users.js`
- `scripts/remove-test-users.js`

These scripts have similar functionality and one could be removed.

## File Dependencies

### Authentication Flow Dependencies

- `src/context/AuthContext.tsx` depends on:
  - `src/utils/supabase/client.ts`
  - `src/lib/error-handler.ts`

- `src/middleware.ts` depends on:
  - `src/utils/supabase/middleware.ts`

- `src/app/login/page.tsx` depends on:
  - `src/context/AuthContext.tsx`

- `src/app/signup/page.tsx` depends on:
  - `src/context/AuthContext.tsx`

### Checkout Flow Dependencies

- `src/app/checkout/page.tsx` depends on:
  - `src/lib/stripe.ts`
  - `src/utils/supabase/server.ts`

- `src/components/PaymentForm.tsx` depends on:
  - `src/lib/stripe.ts`

### Dashboard Dependencies

- `src/app/dashboard/page.tsx` depends on:
  - `src/context/AuthContext.tsx`
  - `src/context/PurchaseContext.tsx`

## Unused Files

### Potentially Unused UI Components

- `src/components/ui/avatar.tsx`: Empty file, recently added
- `src/components/ui/sheet.tsx`: Recently added, may not be fully integrated

### Potentially Unused Test Pages

- `src/app/error-test/page.tsx`
- `src/app/diagnostics/page.tsx`
- `src/app/diagnostics/config.ts`
- `src/app/stripe-diagnostics/page.tsx`
- `src/app/test-auth/page.tsx`
- `src/app/test-resend/page.tsx`
- `src/app/test-connection/page.tsx`
- `src/app/api-test/page.tsx`
- `src/app/another-test/page.tsx`
- `src/app/logger-test/page.tsx`

These pages are useful during development but should be removed or disabled in production.

### Potentially Unused API Routes

- `src/app/api/test-auth-status/route.ts`
- `src/app/api/test-checkout-flow/route.ts`
- `src/app/api/test-email-verification/route.ts`
- `src/app/api/test-stripe/route.ts`
- `src/app/api/create-test-api/route.ts`
- `src/app/api/debug-stripe/route.ts`
- `src/app/api/stripe-diagnostics/route.ts`
- `src/app/api/dev-logger/route.ts`

These API routes are likely only used for testing and development.

## Testing and Diagnostic Files

The codebase contains numerous files for testing and diagnostics:

### Test Pages

- `src/app/error-test/page.tsx`
- `src/app/diagnostics/page.tsx`
- `src/app/stripe-diagnostics/page.tsx`
- `src/app/test-auth/page.tsx`
- `src/app/test-resend/page.tsx`
- `src/app/test-connection/page.tsx`
- `src/app/api-test/page.tsx`
- `src/app/another-test/page.tsx`
- `src/app/logger-test/page.tsx`

### Test API Routes

- `src/app/api/test-auth-status/route.ts`
- `src/app/api/test-checkout-flow/route.ts`
- `src/app/api/test-email-verification/route.ts`
- `src/app/api/test-stripe/route.ts`
- `src/app/api/create-test-api/route.ts`
- `src/app/api/debug-stripe/route.ts`
- `src/app/api/stripe-diagnostics/route.ts`
- `src/app/api/dev-logger/route.ts`

### Test Scripts

- `scripts/test-complete-checkout.js`
- `scripts/test-checkout-flow.js`
- `scripts/test-checkout-form.js`
- `scripts/test-checkout.js`
- `scripts/test-login.js`
- `scripts/test-signup-flow.js`
- `scripts/test-user-creation.js`
- `scripts/test-webhook-direct.js`
- `scripts/test-webhook-handler.js`
- `scripts/test-account-first-checkout-flow.js`

These files are valuable during development but add complexity to the codebase and should be organized or disabled in production.

## Recommendations

1. **Remove Duplicate Context Directory**: Keep `src/context` and remove `src/contexts`, updating all imports accordingly.

2. **Consolidate Authentication Pages**: Keep `src/app/signup` and remove `src/app/register`, ensuring all links and redirects are updated.

3. **Review UI Components**: Determine if the recently added UI components (`avatar.tsx`, `sheet.tsx`) are needed elsewhere in the application. If not, consider removing them.

4. **Remove Test Pages in Production**: Create a mechanism to disable or remove test and diagnostic pages in production.

5. **Clean Up API Routes**: Remove or disable testing and diagnostic API routes in production.

6. **Consolidate Supabase Utilities**: Review the Supabase utility files and consolidate them where possible.

7. **Organize Scripts Directory**: Create subdirectories in the `scripts` directory to better organize scripts by purpose (e.g., development, testing, deployment).

8. **Document Essential Scripts**: Update the `scripts/README.md` file to clearly document which scripts are essential and which are for specific testing scenarios.

9. **Implement Environment-Based Conditionals**: Add environment-based conditionals to prevent test and diagnostic code from running in production. 