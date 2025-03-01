# PMU Profit System Deployment Guide

This guide provides instructions for deploying the PMU Profit System to production.

## Prerequisites

- Node.js 16.x or higher
- npm 7.x or higher
- A Supabase project (already set up at https://duxqazuhozfejdocxiyl.supabase.co)
- A production server or hosting platform (e.g., Vercel, Netlify, or a custom server)

## 1. Environment Configuration

Create a `.env.production` file in the root of your project with the following environment variables:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://duxqazuhozfejdocxiyl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHFhenVob3pmZWpkb2N4aXlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA3NTQ5ODYsImV4cCI6MjA1NjMzMDk4Nn0.8od4KIAC_jzSwgbqN-FszKuEZofmdk7xLtbfDaRr7BM
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHFhenVob3pmZWpkb2N4aXlsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDc1NDk4NiwiZXhwIjoyMDU2MzMwOTg2fQ.OAIuklW_jZkkzU0ZmU8hQF7rB_2GBKveVngNH-BFDM4

# Other Configuration
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
```

Replace `https://your-production-domain.com` with your actual production domain.

## 2. Supabase Configuration

1. Log in to your Supabase dashboard at https://app.supabase.com
2. Select your project "pmuprofit"
3. Go to Authentication > Settings
4. Update the Site URL to match your production domain
5. Add your production domain to the Redirect URLs list
6. Save the changes

## 3. Database Setup

Follow the instructions in the `supabase-setup-instructions.md` file to set up the database schema in Supabase.

## 4. Build the Application

Run the following commands to build the application:

```bash
# Install dependencies
npm install

# Build the application
npm run build
```

## 5. Deployment Options

### Option 1: Deploy to Vercel

1. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy to Vercel:
   ```bash
   vercel --prod
   ```

3. Follow the prompts to configure your deployment.

### Option 2: Deploy to Netlify

1. Install the Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Deploy to Netlify:
   ```bash
   netlify deploy --prod
   ```

3. Follow the prompts to configure your deployment.

### Option 3: Deploy to a Custom Server

1. Transfer the build files to your server:
   ```bash
   # Example using rsync
   rsync -avz --exclude 'node_modules' --exclude '.git' ./ user@your-server:/path/to/deployment
   ```

2. Install dependencies on the server:
   ```bash
   cd /path/to/deployment
   npm install --production
   ```

3. Start the application:
   ```bash
   npm start
   ```

4. Set up a process manager (e.g., PM2) to keep the application running:
   ```bash
   npm install -g pm2
   pm2 start npm --name "pmu-profit-system" -- start
   pm2 save
   pm2 startup
   ```

## 6. Post-Deployment Verification

After deploying, verify the following:

1. The application loads correctly at your production URL
2. User registration works
3. User login works
4. Protected routes (dashboard) are accessible only to authenticated users
5. The purchase flow works correctly

## 7. Troubleshooting

If you encounter issues after deployment:

1. Check the server logs for errors
2. Verify that all environment variables are set correctly
3. Ensure that the Supabase Site URL and Redirect URLs are configured correctly
4. Check that the database schema is set up correctly

## 8. Maintenance

To update the application in the future:

1. Make changes to the codebase
2. Build the application
3. Deploy the new build using the same method as the initial deployment 