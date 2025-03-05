# PMU Profit System - Production Deployment Checklist

This checklist ensures a smooth deployment process for the PMU Profit System to production environments. Follow these steps in order to minimize downtime and prevent issues.

## Pre-Deployment Preparation

### Code and Repository
- [ ] All feature branches merged to main/master
- [ ] All tests passing (run `npm test`)
- [ ] Code linting issues resolved (run `npm run lint`)
- [ ] TypeScript type checking passed (run `npm run type-check`)
- [ ] Git repository clean (no uncommitted changes)

### Environment Variables
- [ ] Verify all required environment variables are set in production:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL` (production Supabase URL)
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (production Supabase anon key)
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` (production Supabase service role key)
  - [ ] `NEXT_PUBLIC_SITE_URL` (set to production URL with HTTPS)
  - [ ] `STRIPE_SECRET_KEY` (production Stripe secret key)
  - [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (production Stripe publishable key)
  - [ ] `STRIPE_WEBHOOK_SECRET` (production Stripe webhook secret)
  - [ ] `NEXT_PUBLIC_STRIPE_PRICE_ID` (production Stripe price ID)

### Database and Authentication
- [ ] Supabase database migrations applied to production
- [ ] Supabase redirect URLs configured for production domain
  - Run `node scripts/update-supabase-redirect-urls.js` with production environment variables
- [ ] Verify database schema matches expected production schema
- [ ] Backup production database before deployment (if applicable)

### Payment Processing
- [ ] Stripe webhook endpoint configured for production URL
  - Endpoint should be: `https://[your-domain.com]/api/webhooks`
  - Events to listen for: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
- [ ] Stripe products and prices configured correctly in production
- [ ] Test Stripe webhook delivery using Stripe CLI or dashboard

## Deployment Process

### Build and Deploy
- [ ] Run production build locally to verify it builds successfully: `npm run build`
- [ ] Deploy to production environment (Vercel or other platform)
  - For Vercel: Push to GitHub main branch or run manual deployment
  - For other platforms: Follow platform-specific deployment steps
- [ ] Verify deployment completed successfully without build errors

### Post-Deployment Verification

#### Basic Functionality
- [ ] Verify site loads correctly at production URL
- [ ] Check for console errors in browser developer tools
- [ ] Verify static assets (images, fonts, etc.) load correctly
- [ ] Test responsive design on mobile and desktop viewports

#### Authentication
- [ ] Test user registration flow
- [ ] Test user login flow
- [ ] Test password reset flow
- [ ] Verify authentication persistence works correctly
- [ ] Test logout functionality

#### Checkout and Payment
- [ ] Complete a test purchase with a test card
  - Use card number: 4242 4242 4242 4242
  - Any future expiration date
  - Any 3-digit CVC
  - Any postal code
- [ ] Verify successful redirect to success page
- [ ] Verify user account created in Supabase
- [ ] Verify purchase records created in database
- [ ] Verify email confirmation (if applicable)
- [ ] Test login with newly created account

#### Content and Features
- [ ] Verify all pages load correctly
- [ ] Test all interactive features
- [ ] Verify member-only content is properly protected
- [ ] Test search functionality (if applicable)
- [ ] Verify file downloads work correctly (if applicable)

### Performance and Security
- [ ] Run Lighthouse audit to check performance, accessibility, SEO
- [ ] Verify SSL/TLS certificate is valid
- [ ] Check for exposed environment variables or secrets
- [ ] Verify proper HTTP headers are set (Content-Security-Policy, etc.)
- [ ] Test site load time from different geographic locations

## Monitoring and Maintenance

### Monitoring Setup
- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Configure performance monitoring
- [ ] Set up uptime monitoring
- [ ] Configure alerts for critical errors

### Documentation
- [ ] Update internal documentation with deployment details
- [ ] Document any manual steps performed during deployment
- [ ] Update user documentation if needed

### Rollback Plan
- [ ] Document steps to roll back to previous version if needed
- [ ] Verify access to previous deployments
- [ ] Test rollback procedure if possible

## Troubleshooting Common Issues

### User Creation Issues
- Check Supabase logs for authentication errors
- Verify webhook is receiving events from Stripe
- Check for CORS issues with Supabase URL
- Ensure site URL is correctly configured in environment variables
- Run `node scripts/test-complete-checkout.js` to test the full checkout flow

### Payment Processing Issues
- Verify Stripe webhook is correctly configured
- Check Stripe dashboard for failed webhook deliveries
- Ensure webhook secret is correctly set in environment variables
- Check server logs for webhook processing errors

### Performance Issues
- Check for unnecessary client-side JavaScript
- Verify image optimization is working
- Check for slow database queries
- Consider implementing caching strategies

## Final Approval
- [ ] Product owner sign-off
- [ ] Technical lead sign-off
- [ ] Deployment approved for production use

---

**Last Updated:** [Date]  
**Updated By:** [Name] 