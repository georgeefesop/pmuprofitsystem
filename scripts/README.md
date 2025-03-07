# PMU Profit System Scripts

This directory contains utility scripts for development, testing, and deployment of the PMU Profit System.

> **Note:** The scripts in this directory have been reorganized into subdirectories for better organization and maintainability. All database-related scripts are now in the `database/` directory, and SQL files are in the `sql/` directory. The npm scripts in package.json have been updated to reflect these changes.

## Directory Structure

- `database/` - Scripts for database setup and management
- `development/` - Scripts for development environment
- `setup/` - Scripts for initial setup and configuration
- `sql/` - SQL scripts for database setup and management
- `testing/` - Scripts for testing functionality
- `utils/` - Utility scripts for various tasks

## Database Scripts

### Database Management Scripts

- `database/setup-database.js` - Node.js script for executing the database schema setup
- `database/setup-database-new.js` - Updated version of the setup script
- `database/verify-database.js` - Verifies the database setup
- `database/verify-database-schema.js` - Verifies the database schema
- `database/fix-database-schema.js` - Fixes database schema issues
- `database/delete-test-users.js` - Deletes test users from the database while preserving admin accounts
- `database/execute-sql.js` - Executes SQL commands
- `database/execute-sql-direct.js` - Executes SQL commands directly
- `database/execute-sql-one-by-one.js` - Executes SQL commands one by one
- `database/execute-sql-with-if-not-exists.js` - Executes SQL commands with IF NOT EXISTS conditions
- `database/output-sql-commands.js` - Outputs SQL commands to a file
- `database/update-prices-and-cleanup.sql` - SQL script to update product prices and clean up user data
- `database/update-prices-direct.js` - Updates product prices and cleans up user data using Supabase client directly
- `database/execute-price-update.js` - Executes the update-prices-and-cleanup.sql script
- `database/create-missing-entitlements.js` - Creates user entitlements for purchases that don't have them
- `database/create-entitlements-from-legacy-purchases.js` - Creates user entitlements from legacy purchases that use the product_id field instead of purchase_items
- `database/create-user-entitlements-from-purchases.js` - Creates user entitlements for a specific user based on their existing purchases
- `database/fix-user-entitlements.js` - Fixes entitlements for users who have purchases but no entitlements

### SQL Scripts

- `sql/setup-database-schema.sql` - SQL script for setting up the database schema
- `sql/sql-commands.sql` - SQL commands for database setup
- `sql/sql-commands-for-manual-execution.sql` - SQL commands for manual execution
- `sql/sql-commands-with-if-not-exists.sql` - SQL commands with IF NOT EXISTS conditions

### Setting Up the Database Schema

To set up the database schema for the PMU Profit System, run:

```bash
node scripts/database/setup-database.js
```

This will create all necessary tables, relationships, and initial data for the application.

**Note:** This script requires the `SUPABASE_SERVICE_ROLE_KEY` to be set in your environment variables.

### Creating Missing User Entitlements

If users have made purchases but don't have corresponding entitlements, you can create them using:

```bash
# Create missing entitlements for all users
node scripts/database/create-missing-entitlements.js

# Create missing entitlements for a specific user
node scripts/database/create-missing-entitlements.js USER_ID
```

This script will:
1. Find all completed purchases in the database
2. Check if each purchase has corresponding user entitlements
3. Create entitlements for any purchases that don't have them
4. Log the results (created, skipped, errors)

**Note:** This script requires the `SUPABASE_SERVICE_ROLE_KEY` to be set in your environment variables.

### Creating User Entitlements from Legacy Purchases

If you have legacy purchases that use the `product_id` field directly instead of having entries in the `purchase_items` table, you can create entitlements for them using:

```bash
# Create entitlements from legacy purchases for all users
node scripts/database/create-entitlements-from-legacy-purchases.js

# Create entitlements from legacy purchases for a specific user
node scripts/database/create-entitlements-from-legacy-purchases.js USER_ID
```

This script will:
1. Find all completed purchases with a `product_id` field
2. Map the product name to the correct UUID from the products table
3. Create entitlements for these purchases
4. Log the results (created, skipped, errors)

**Note:** This script requires the `SUPABASE_SERVICE_ROLE_KEY` to be set in your environment variables.

### Creating User Entitlements from Purchases

If you want to create user entitlements for a specific user based on their existing purchases, you can use:

```bash
node scripts/database/create-user-entitlements-from-purchases.js USER_ID
```

This script will:
1. Find all completed purchases for the specified user
2. Create entitlements for these purchases
3. Log the results (created, skipped, errors)

**Note:** This script requires the `SUPABASE_SERVICE_ROLE_KEY` to be set in your environment variables.

### Updating Product Prices and Cleaning Up User Data

To update product prices to the correct values in euros and clean up user data, run:

```bash
node scripts/database/update-prices-direct.js
```

This script will:
1. Update product prices to the correct values in euros
2. Delete all user entitlements
3. Delete all purchases
4. Delete all users

**Note:** This script requires the `SUPABASE_SERVICE_ROLE_KEY` to be set in your environment variables.

### Cleaning Up User Data for Testing

To clean up all user data for testing purposes, you can use the JavaScript script:

```bash
node scripts/clean-database.js
```

This script will:
1. Delete all user entitlements
2. Delete all purchases
3. Delete all users from the public schema
4. Delete all auth users (using Supabase Auth Admin API)
5. Verify that all data has been deleted

**Warning:** This script will delete ALL user data. Use with caution and only in development/testing environments.

The script automatically reads Supabase configuration from your environment variables or .env files, so no additional setup is required.

### Database Webhook Setup

To set up a database webhook that automatically creates entitlements when a new purchase is recorded:

```bash
# Set up the database webhook
node scripts/database/setup-database-webhook.js
```

This script creates a trigger on the `purchases` table that calls our API endpoint whenever a new purchase is inserted. This provides a fail-safe mechanism to ensure entitlements are created even if the primary entitlement creation process fails.

### Fixing User Entitlements

To fix entitlements for users who have purchases but no entitlements:

```bash
# Fix entitlements for all users with purchases but no entitlements
node scripts/database/fix-user-entitlements.js

# Fix entitlements for a specific user
node scripts/database/fix-user-entitlements.js USER_ID
```

This script finds users who have completed purchases but no corresponding entitlements, and creates the appropriate entitlements for them. It handles both legacy purchases (with `product_id` field) and standard purchases (with `include_*` fields).

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
- `testing/test-auth-flow.js` - Tests authentication flow using API requests
- `testing/browser-auth-test.js` - Tests authentication flow using Puppeteer browser automation
- `testing/install-test-deps.js` - Installs dependencies required for testing scripts

### Authentication Flow Testing

The system includes specialized tools for testing and debugging the authentication flow:

#### API-based Authentication Flow Test

The `test-auth-flow.js` script tests the authentication flow using direct API requests:

```bash
npm run test:auth
```

This script:
1. Creates a test user via the signup API
2. Tests authentication state via the session API
3. Verifies redirect logic and session persistence

Output is saved to `auth-flow-test.log` with detailed information about each API request and response.

#### Browser-based Authentication Flow Test

The `browser-auth-test.js` script uses Puppeteer to simulate a real user navigating through the authentication flow:

```bash
npm run test:auth:browser
```

This script:
1. Navigates to the pre-checkout page
2. Fills out and submits the signup form
3. Verifies redirect to the checkout page
4. Checks authentication state at each step

The test captures screenshots, console logs, network requests, and storage state (cookies, localStorage, sessionStorage) at each step of the process.

Output files are saved to the `browser-test-output` directory, including screenshots of each step in the authentication flow.

#### Installing Test Dependencies

Before running the authentication flow tests, you need to install the required dependencies:

```bash
npm run test:install-deps
```

This script installs:
- `node-fetch@2` for API requests
- `puppeteer` for browser automation

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
npm run create-entitlements # Creates missing user entitlements
npm run create-legacy-entitlements # Creates entitlements from legacy purchases
npm run create-user-entitlements # Creates user entitlements for a specific user based on their existing purchases
npm run fix-user-entitlements # Fixes entitlements for users who have purchases but no entitlements
``` 