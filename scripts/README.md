# PMU Profit System Scripts

This directory contains utility scripts for development, testing, and deployment of the PMU Profit System.

## Development Scripts

- `auto-fix-dev.js` - Runs the development server with automatic error detection and fixing
- `browser-error-logger.js` - Sets up browser console error logging to the terminal
- `launcher.js` - Launches the development server in the background
- `start-dev.js` - Starts the development server directly
- `auto-open-dev.js` - Starts the development server and opens the browser
- `start-https.js` - Starts the development server with HTTPS
- `setup-https.js` - Sets up HTTPS for local development
- `setup-local-dev.js` - Sets up the local development environment
- `setup-supabase.js` - Sets up Supabase for local development
- `check-build-errors.js` - Checks for common build errors and fixes them automatically

## Database Scripts

- `setup-database.js` - Sets up the database
- `verify-database.js` - Verifies the database setup

## Testing Scripts

- `check-site-url.js` - Checks site URL configuration
- `test-complete-checkout.js` - Tests the complete checkout flow
- `test-webhook-handler.js` - Tests the webhook handler functionality
- `remove-all-users.js` - Removes all test users from Supabase

## Build Scripts

- `check-image-domains.js` - Checks for image domains before building
- `vercel-build.js` - Custom build script for Vercel deployment

## MCP Server Scripts

- `start-mcp-server.js` - Starts the MCP server for Supabase

## Usage

Most scripts can be run directly with Node.js:

```bash
node scripts/script-name.js
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
``` 