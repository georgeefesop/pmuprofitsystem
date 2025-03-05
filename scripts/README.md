# PMU Profit System Scripts

This directory contains utility scripts for development, testing, and deployment of the PMU Profit System.

## Directory Structure

- `development/` - Scripts for development environment
- `testing/` - Scripts for testing functionality
- `database/` - Scripts for database setup and management
- `setup/` - Scripts for initial setup and configuration
- `utils/` - Utility scripts for various tasks

## Development Scripts

- `development/auto-fix-dev.js` - Runs development server with automatic error detection and fixing
- `development/auto-open-dev.js` - Starts development server and opens browser
- `development/browser-error-logger.js` - Sets up browser console error logging to terminal
- `development/direct-dev.js` - Starts development server directly
- `development/launcher.js` - Launches development server in background
- `development/start-dev.js` - Starts development server
- `development/start-dev.bat` - Windows batch file for starting development server
- `development/start-dev.sh` - Shell script for starting development server
- `development/start-https.js` - Starts development server with HTTPS

## Setup Scripts

- `setup/setup-local-dev.js` - Sets up local development environment
- `setup/setup-supabase.js` - Sets up Supabase for local development
- `setup/setup-https.js` - Sets up HTTPS for local development
- `setup/setup-stripe-webhook.js` - Sets up Stripe webhook

## Database Scripts

- `database/setup-database.js` - Sets up the database
- `database/verify-database.js` - Verifies the database setup
- `database/fix-database-schema.js` - Fixes database schema issues
- `database/delete-test-users.js` - Deletes test users from the database while preserving admin accounts

## Testing Scripts

- `testing/test-complete-checkout.js` - Tests complete checkout flow
- `testing/test-checkout-flow.js` - Tests checkout flow
- `testing/test-checkout-form.js` - Tests checkout form
- `testing/test-checkout.js` - Tests checkout functionality
- `testing/test-login.js` - Tests login functionality
- `testing/test-signup-flow.js` - Tests signup flow
- `testing/test-user-creation.js` - Tests user creation
- `testing/test-webhook-direct.js` - Tests webhook directly
- `testing/test-webhook-handler.js` - Tests webhook handler
- `testing/test-account-first-checkout-flow.js` - Tests first-time checkout flow
- `testing/verify-test-user.js` - Verifies test user
- `testing/verify-user-creation.js` - Verifies user creation
- `testing/diagnose-checkout-flow.js` - Diagnoses checkout flow issues
- `testing/check-user-account.js` - Checks user account details
- `testing/check-stripe-webhook.js` - Checks Stripe webhook configuration
- `testing/simulate-complete-checkout.js` - Simulates complete checkout process

## Utility Scripts

- `utils/check-image-domains.js` - Checks for image domains before building
- `utils/check-build-errors.js` - Checks for common build errors
- `utils/fix-all-errors.js` - Runs all error fixing scripts
- `utils/fix-viewport-metadata.js` - Fixes viewport metadata issues
- `utils/fix-supabase-config.js` - Fixes Supabase configuration issues
- `utils/check-site-url.js` - Checks site URL configuration
- `utils/check-user.js` - Checks user information
- `utils/check-project.js` - Checks project configuration
- `utils/count-supabase-users.js` - Counts users in Supabase
- `utils/create-manual-user.js` - Creates a user manually
- `utils/create-test-purchase.js` - Creates a test purchase
- `utils/create-test-user.js` - Creates a test user
- `utils/remove-all-users.js` - Removes all users
- `utils/update-supabase-redirect-urls.js` - Updates Supabase redirect URLs
- `utils/disable-email-confirmation.js` - Disables email confirmation requirement
- `utils/vercel-build.js` - Custom build script for Vercel deployment

## MCP Server Scripts

- `start-mcp-server.js` - Starts MCP server for Supabase
- `run-mcp-direct.js` - Runs MCP server directly

## Usage

Most scripts can be run directly with Node.js:

```bash
node scripts/development/auto-fix-dev.js
```

However, it's recommended to use the npm scripts defined in package.json:

```bash
npm run dev           # Runs auto-fix-dev.js
npm run dev:launcher  # Runs launcher.js
npm run dev:direct    # Runs start-dev.js
npm run dev:preview   # Runs auto-open-dev.js
npm run dev:https     # Runs start-https.js
npm run setup         # Runs setup-local-dev.js
npm run setup:https   # Runs setup-https.js
npm run setup:error-logger # Sets up browser error logging
npm run check-errors  # Runs check-build-errors.js
npm run fix:all       # Runs fix-all-errors.js
npm run fix:viewport  # Runs fix-viewport-metadata.js
npm run fix:supabase  # Runs fix-supabase-config.js
npm run delete-users  # Deletes test users from the database
``` 