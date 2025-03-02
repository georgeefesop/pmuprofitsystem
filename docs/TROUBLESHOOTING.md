# PMU Profit System Troubleshooting Guide

This document provides solutions for common issues you might encounter when working with the PMU Profit System.

## Table of Contents

1. [Authentication Issues](#authentication-issues)
2. [Email Verification Problems](#email-verification-problems)
3. [Payment Processing Issues](#payment-processing-issues)
4. [Deployment Problems](#deployment-problems)
5. [Database Issues](#database-issues)
6. [UI/UX Issues](#uiux-issues)
7. [Performance Problems](#performance-problems)
8. [Development Environment Setup](#development-environment-setup)

## Authentication Issues

### User Cannot Log In

**Symptoms:**
- User enters correct credentials but receives an error
- Login button seems to do nothing
- User gets redirected back to login page

**Possible Causes and Solutions:**

1. **Email Not Verified**
   - Check if the user has verified their email
   - Resend verification email from the login page
   - Check Supabase logs for verification status

2. **Account Banned**
   - Some accounts may be incorrectly marked as banned after verification
   - Use the "Resend Verification Email" feature which includes an automatic unban
   - Admin can manually unban in Supabase dashboard: Authentication > Users > Select user > Unban

3. **Missing User Profile**
   - User exists in auth.users but not in public.users table
   - The application should automatically create a profile if missing
   - Check database for user profile: `SELECT * FROM public.users WHERE email = 'user@example.com'`

4. **Incorrect Password**
   - Reset password using "Forgot Password" link
   - Check for caps lock or keyboard layout issues

### Session Expires Too Quickly

**Symptoms:**
- User is logged out unexpectedly
- Needs to log in frequently

**Solutions:**
- Check session duration settings in Supabase dashboard
- Verify that token refresh is working correctly
- Check for network issues that might interrupt token refresh

## Email Verification Problems

### Verification Email Not Received

**Symptoms:**
- User registers but doesn't receive verification email
- Resend verification doesn't work

**Solutions:**
1. Check spam/junk folder
2. Verify email address is correct
3. Check Supabase logs for email sending errors
4. Ensure email service is properly configured
5. Try using the test email service for development

### Verification Link Doesn't Work

**Symptoms:**
- User clicks verification link but gets an error
- Link redirects to login page with an error message

**Solutions:**
1. Check if the link has expired (default is 24 hours)
2. Ensure the Site URL in Supabase settings matches your application URL
3. Verify redirect URLs are properly configured
4. Check for URL encoding issues in the callback handler
5. Resend verification email to get a fresh link

## Payment Processing Issues

### Payment Fails

**Symptoms:**
- User gets an error during checkout
- Payment is declined
- Stripe checkout doesn't load

**Solutions:**
1. Check Stripe dashboard for error logs
2. Verify Stripe API keys are correct
3. Ensure the application is using HTTPS (required for Stripe)
4. Check that product and price IDs match in Stripe and the application
5. Verify webhook endpoints are correctly configured

### Purchase Not Recorded

**Symptoms:**
- Payment succeeds but user doesn't get access to purchased content
- No record in purchases table

**Solutions:**
1. Check Stripe webhook logs for delivery failures
2. Verify that the webhook handler is correctly processing events
3. Check database connection and permissions
4. Manually add the purchase record if needed

## Deployment Problems

### Build Fails on Vercel

**Symptoms:**
- Deployment fails with TypeScript errors
- Build process terminates with an error

**Solutions:**
1. Check the error logs for specific TypeScript errors
2. Fix type issues in the codebase
3. Ensure all dependencies are correctly installed
4. Verify environment variables are properly set
5. Check for compatibility issues between packages

### Application Crashes After Deployment

**Symptoms:**
- Application loads but crashes when using certain features
- Server returns 500 errors

**Solutions:**
1. Check server logs for error details
2. Verify environment variables are correctly set in production
3. Ensure database connection is working
4. Check for differences between development and production environments
5. Roll back to a previous working version if necessary

## Database Issues

### Missing Tables or Columns

**Symptoms:**
- Application throws errors about missing tables or columns
- Features that rely on database fail

**Solutions:**
1. Run the database setup script from `supabase-setup.sql`
2. Check Supabase dashboard for schema issues
3. Manually create missing tables or columns
4. Verify database migrations have been applied

### Row Level Security Blocking Access

**Symptoms:**
- User can't access their own data
- Queries return no results even though data exists

**Solutions:**
1. Check RLS policies in Supabase dashboard
2. Verify that the user is authenticated when making requests
3. Ensure policies are correctly written to allow access
4. Test queries with service role key to bypass RLS for debugging

## UI/UX Issues

### Hydration Errors

**Symptoms:**
- Console shows React hydration errors
- UI elements flicker or behave unexpectedly

**Solutions:**
1. Ensure server and client rendering match
2. Avoid using browser-specific APIs during server rendering
3. Use proper conditional rendering for client-side components
4. Add the 'use client' directive where needed

### Responsive Design Issues

**Symptoms:**
- UI looks broken on mobile devices
- Elements overlap or overflow

**Solutions:**
1. Use browser dev tools to test different screen sizes
2. Ensure Tailwind responsive classes are correctly applied
3. Test on actual mobile devices if possible
4. Fix specific breakpoint issues with appropriate media queries

## Performance Problems

### Slow Page Loads

**Symptoms:**
- Pages take a long time to load
- UI feels sluggish

**Solutions:**
1. Optimize image sizes and use WebP format
2. Implement lazy loading for non-critical components
3. Use React Server Components where appropriate
4. Minimize client-side JavaScript
5. Implement proper caching strategies

### Memory Leaks

**Symptoms:**
- Application becomes slower over time
- Browser tab uses increasing amounts of memory

**Solutions:**
1. Check for missing cleanup in useEffect hooks
2. Ensure event listeners are properly removed
3. Use React DevTools to profile component renders
4. Fix components that re-render unnecessarily

## Development Environment Setup

### Environment Variables Not Working

**Symptoms:**
- Application can't connect to Supabase or other services
- Environment variables are undefined

**Solutions:**
1. Ensure `.env.local` file exists with all required variables
2. Restart the development server after changing environment variables
3. Verify that variables are correctly prefixed with `NEXT_PUBLIC_` if needed
4. Check for typos in variable names

### HTTPS Setup for Local Development

**Symptoms:**
- Features requiring secure context don't work locally
- Payment processing fails in development

**Solutions:**
1. Use the provided `start-https.js` script to run with HTTPS
2. Generate local SSL certificates if needed
3. Trust the local certificates in your browser
4. Update environment variables to use HTTPS URLs

---

If you encounter issues not covered in this guide, please check the application logs, Supabase dashboard, and Stripe dashboard for more information. For persistent problems, consider opening an issue in the project repository. 