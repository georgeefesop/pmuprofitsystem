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

Then, run the development server:

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
   mkcert localhost
   ```

4. Run the HTTPS server:
   ```bash
   node start-https.js
   ```

5. Open [https://localhost:3000](https://localhost:3000) in your browser.

### Option 2: Using next-https

1. Install next-https:
   ```bash
   npm install --save-dev next-https
   # or
   yarn add --dev next-https
   ```

2. Add the following script to your package.json:
   ```json
   "scripts": {
     "dev:https": "next-https"
   }
   ```

3. Run the HTTPS server:
   ```bash
   npm run dev:https
   # or
   yarn dev:https
   ```

4. Open [https://localhost:3000](https://localhost:3000) in your browser.

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

## Testing Stripe Payments

For testing payments, use the following test card numbers:

- **Successful payment**: 4242 4242 4242 4242
- **Authentication required**: 4000 0025 0000 3155
- **Payment declined**: 4000 0000 0000 9995

Use any future expiration date, any 3-digit CVC, and any postal code.

## Deployment

The easiest way to deploy this app is to use the [Vercel Platform](https://vercel.com/new).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
