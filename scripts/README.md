# Scripts

This directory contains utility scripts for development, testing, and deployment of the PMU Profit System.

## Development Scripts

- `launcher.js` - Main script for launching the development server with options
- `start-dev.js` - Starts the development server directly
- `auto-open-dev.js` - Starts the development server and opens browser preview
- `start-https.js` - Starts the development server with HTTPS
- `setup-https.js` - Sets up HTTPS for local development
- `check-build-errors.js` - Checks for common build errors
- `check-image-domains.js` - Verifies image domains configuration
- `check-project.js` - Performs basic project health checks

## Database Scripts

- `setup-database.js` - Sets up the database schema
- `verify-database.js` - Verifies the database setup
- `fix-database-schema.js` - Fixes common database schema issues

## Supabase Scripts

- `setup-supabase.js` - Sets up Supabase for local development
- `start-mcp-server.js` - Starts the Supabase MCP server for database management
- `run-mcp-direct.js` - Runs the MCP server directly
- `update-supabase-redirect-urls.js` - Updates Supabase redirect URLs for authentication
- `disable-email-confirmation.js` - Disables email confirmation requirement for all users

## User Management Scripts

- `create-test-user.js` - Creates a test user in Supabase
- `check-user.js` - Checks if a user exists and creates one if needed
- `check-user-account.js` - Checks user account details
- `create-manual-user.js` - Manually creates a user with specified details
- `remove-test-users.js` - Removes test users from Supabase
- `remove-all-users.js` - Removes all users from Supabase (preserves admin accounts)
- `count-supabase-users.js` - Counts the number of users in Supabase
- `test-login.js` - Tests user login functionality
- `verify-test-user.js` - Verifies a test user exists and is properly configured
- `verify-user-creation.js` - Verifies user creation process
- `test-user-creation.js` - Tests the user creation process
- `test-signup-flow.js` - Tests the complete signup flow including user creation and profile verification

## Checkout and Payment Scripts

- `create-test-purchase.js` - Creates a test purchase record
- `test-checkout.js` - Tests the checkout process
- `test-checkout-flow.js` - Tests the complete checkout flow
- `test-checkout-form.js` - Tests the new checkout form implementation with user creation
- `test-complete-checkout.js` - Tests the complete checkout flow including user creation and purchase records
- `test-account-first-checkout-flow.js` - Tests the "Create Account First, Then Purchase" flow
- `simulate-complete-checkout.js` - Simulates a complete checkout process
- `diagnose-checkout-flow.js` - Diagnoses issues in the checkout flow
- `setup-stripe-webhook.js` - Sets up Stripe webhook for local development
- `check-stripe-webhook.js` - Checks Stripe webhook configuration

## Webhook Testing Scripts

- `test-webhook-handler.js` - Tests the webhook handler functionality
- `test-webhook-direct.js` - Tests webhook handling directly

## Diagnostic Scripts

- `check-site-url.js` - Checks site URL configuration and tests connections to Supabase and Stripe

## Deployment Scripts

- `vercel-build.js` - Custom build script for Vercel deployment

## Usage Examples

### Testing Checkout Flow

```bash
# Test the complete checkout flow
node scripts/test-complete-checkout.js

# Test the new checkout form implementation
node scripts/test-checkout-form.js

# Test the "Create Account First, Then Purchase" flow
node scripts/test-account-first-checkout-flow.js

# Check site URL configuration
node scripts/check-site-url.js

# Test webhook handler
node scripts/test-webhook-handler.js
```

### User Management

```bash
# Remove all test users
node scripts/remove-all-users.js

# Create a test user
node scripts/create-test-user.js

# Count users in Supabase
node scripts/count-supabase-users.js

# Test the signup flow
node scripts/test-signup-flow.js

# Disable email confirmation requirement
node scripts/disable-email-confirmation.js
```

### Supabase Configuration

```bash
# Update Supabase redirect URLs
node scripts/update-supabase-redirect-urls.js

# Start the MCP server
node scripts/start-mcp-server.js
``` 