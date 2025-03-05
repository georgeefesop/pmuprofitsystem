# PMU Profit System

A complete system to help PMU artists reach €5,000/month with marketing tools, consultation frameworks, and business strategies.

## Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

Then, run the setup script to configure your local development environment:

```bash
npm run setup
```

This setup script will:
1. Check if Docker is installed (required for Supabase local development)
2. Set up Supabase locally if needed
3. Configure your environment variables
4. Set up and verify the database
5. Start the development server with browser preview

Alternatively, you can run the development server directly:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Running with HTTPS (Required for Stripe Payments)

Stripe requires a secure connection (HTTPS) for payment forms to work properly. To run the application locally with HTTPS:

### Option 1: Using mkcert (Recommended)

1. Install mkcert:
   ```bash
   # On Windows (with chocolatey)
   choco install mkcert

   # On macOS (with homebrew)
   brew install mkcert
   ```

2. Set up mkcert:
   ```bash
   mkcert -install
   ```

3. Generate certificates for localhost:
   ```bash
   npm run setup:https
   ```

4. Run the HTTPS server:
   ```bash
   npm run dev:https
   ```

5. Open [https://localhost:3000](https://localhost:3000) in your browser.

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://localhost:3000

# Stripe Configuration (Test Mode)
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

## Features

- Complete PMU Profit System
- PMU Ad Generator Tool (Add-on)
- Consultation Success Blueprint (Add-on)
- Secure payment processing with Stripe
- User authentication with Supabase
- Email verification system
- Mobile-responsive design

## Documentation

Comprehensive documentation is available in the `docs` directory:

### System Overview
- [Database Schema](docs/DATABASE-SCHEMA.md) - Comprehensive overview of the database structure
- [Supabase Authentication](docs/SUPABASE-AUTHENTICATION.md) - Guide to the authentication system
- [Code Structure](docs/CODE-STRUCTURE.md) - Overview of the codebase structure

### API Documentation
- [API Routes](docs/API-ROUTES.md) - Documentation for the API routes
- [Stripe Integration](docs/STRIPE-INTEGRATION.md) - Guide to the Stripe payment integration

### Development Guides
- [Development Workflow](docs/DEVELOPMENT-WORKFLOW.md) - Guide to the development workflow
- [Supabase Setup](docs/supabase-setup-instructions.md) - Instructions for setting up Supabase
- [Deployment Guide](docs/DEPLOYMENT.md) - Guide for deploying the application
- [Testing Guide](docs/TESTING.md) - Instructions for testing the application
- [Error Handling](docs/ERROR_HANDLING.md) - Overview of the error handling system

### Troubleshooting
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md) - Solutions for common issues

## Testing Stripe Payments

For testing payments, use the following test card numbers:

- **Successful payment**: 4242 4242 4242 4242
- **Authentication required**: 4000 0025 0000 3155
- **Payment declined**: 4000 0000 0000 9995

Use any future expiration date, any 3-digit CVC, and any postal code.

## Scripts

- `npm run setup` - Complete setup for local development environment
- `npm run setup:supabase` - Set up Supabase for local development
- `npm run dev` - Start the development server with automatic error detection and fixing
- `npm run dev:launcher` - Start the development server using the background launcher
- `npm run dev:preview` - Start the development server and open browser preview
- `npm run dev:direct` - Start the development server directly (bypass launcher)
- `npm run dev:alt` - Start the development server on an alternative port
- `npm run dev:https` - Start the development server with HTTPS
- `npm run setup:https` - Set up HTTPS for local development
- `npm run prebuild` - Check for image domains before building
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Lint the codebase
- `npm run check-errors` - Check for common build errors
- `npm run setup-db` - Set up the database
- `npm run verify-db` - Verify the database setup

### Diagnostic and Testing Scripts

These scripts help diagnose and test various aspects of the application:

- `node scripts/check-site-url.js` - Check site URL configuration and test connections to Supabase and Stripe
- `node scripts/test-complete-checkout.js` - Test the complete checkout flow, including user creation and purchase records
- `node scripts/test-webhook-handler.js` - Test the webhook handler functionality
- `node scripts/remove-all-users.js` - Remove all test users from Supabase (preserves admin accounts)
- `node scripts/update-supabase-redirect-urls.js` - Update Supabase redirect URLs for authentication

## Project Structure

```
pmuprofitsystem/
├── database/                    # Database setup files
│   └── supabase-setup.sql       # SQL setup script
├── docs/                        # Documentation
│   ├── API-ROUTES.md            # API routes documentation
│   ├── CODE-STRUCTURE.md        # Codebase structure overview
│   ├── DATABASE-SCHEMA.md       # Database schema documentation
│   ├── DEPLOYMENT.md            # Deployment guide
│   ├── DEVELOPMENT-WORKFLOW.md  # Development workflow guide
│   ├── ERROR_HANDLING.md        # Error handling documentation
│   ├── README.md                # Documentation overview
│   ├── STRIPE-INTEGRATION.md    # Stripe integration documentation
│   ├── SUPABASE-AUTHENTICATION.md # Authentication system documentation
│   ├── supabase-setup-instructions.md # Supabase setup instructions
│   ├── TESTING.md               # Testing guide
│   └── TROUBLESHOOTING.md       # Troubleshooting guide
├── public/                      # Static assets
│   ├── images/                  # Image assets
│   └── favicon/                 # Favicon assets
├── ReferenceAssets/             # Reference assets
├── scripts/                     # Development and build scripts
│   ├── setup-https.js           # HTTPS setup script
│   ├── start-https.js           # HTTPS server script
│   └── ...                      # Other scripts
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

## Deployment

The easiest way to deploy this app is to use the [Vercel Platform](https://vercel.com/new).

Check out the [Deployment Guide](docs/DEPLOYMENT.md) for more details on deployment options.
