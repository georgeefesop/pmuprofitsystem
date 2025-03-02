# PMU Profit System Testing Guide

This guide provides instructions for testing the PMU Profit System to ensure all features are working correctly.

## Prerequisites

- The application is running locally or on a test environment
- Supabase is set up with the correct schema (see `supabase-setup-instructions.md`)
- You have access to the Supabase dashboard

## 1. Authentication Testing

### 1.1 User Registration

1. Navigate to the checkout page (`/checkout`)
2. Fill in the registration form with:
   - Full Name: `Test User`
   - Email: `test@example.com`
   - Password: `password123`
3. Select any upsell options if desired
4. Complete the purchase
5. Verify that:
   - You are redirected to the success page
   - A new user is created in Supabase (check Authentication > Users)
   - A new record is created in the `users` table
   - Purchase records are created in the `purchases` table

### 1.2 User Login

1. Navigate to the login page (`/login`)
2. Enter the credentials:
   - Email: `test@example.com`
   - Password: `password123`
3. Click "Log In"
4. Verify that:
   - You are redirected to the dashboard
   - The user's information is displayed correctly

### 1.3 Protected Routes

1. Log out of the application
2. Try to access a protected route (e.g., `/dashboard`)
3. Verify that:
   - You are redirected to the login page
   - The redirect parameter is included in the URL (e.g., `/login?redirect=/dashboard`)

### 1.4 Logout

1. Log in to the application
2. Navigate to any page with a logout button
3. Click the logout button
4. Verify that:
   - You are redirected to the home page
   - You can no longer access protected routes

## 2. Purchase Flow Testing

### 2.1 Basic Purchase

1. Navigate to the checkout page (`/checkout`)
2. Fill in the registration form with new user details
3. Do not select any upsell options
4. Complete the purchase
5. Verify that:
   - You are redirected to the success page
   - A purchase record is created in the `purchases` table with `product_id` set to `pmu-profit-system`

### 2.2 Purchase with Upsells

1. Navigate to the checkout page (`/checkout`)
2. Fill in the registration form with new user details
3. Select both upsell options:
   - PMU Ad Generator
   - Consultation Success Blueprint
4. Complete the purchase
5. Verify that:
   - You are redirected to the success page
   - Three purchase records are created in the `purchases` table:
     - One with `product_id` set to `pmu-profit-system`
     - One with `product_id` set to `pmu-ad-generator`
     - One with `product_id` set to `consultation-success-blueprint`

## 3. Dashboard Testing

### 3.1 Dashboard Access

1. Log in with a user who has purchased the basic package
2. Navigate to the dashboard (`/dashboard`)
3. Verify that:
   - The dashboard loads correctly
   - The user's information is displayed correctly
   - The sidebar shows the correct navigation items

### 3.2 Module Access

1. Log in with a user who has purchased the basic package
2. Navigate to different modules in the dashboard
3. Verify that:
   - Each module loads correctly
   - Content is displayed properly
   - Navigation between modules works

### 3.3 Ad Generator Access

1. Log in with a user who has purchased the Ad Generator
2. Navigate to the Ad Generator page (`/dashboard/ad-generator`)
3. Verify that:
   - The Ad Generator loads correctly
   - You can input parameters (tone, pricing, offer type)
   - The generator produces ad copy when submitted
   - The generated ads are displayed correctly

### 3.4 Blueprint Access

1. Log in with a user who has purchased the Consultation Success Blueprint
2. Navigate to the Blueprint page (`/dashboard/blueprint`)
3. Verify that:
   - The Blueprint loads correctly
   - You can view and download the blueprint

### 3.5 Access Restrictions

1. Log in with a user who has only purchased the basic package
2. Try to access the Ad Generator page (`/dashboard/ad-generator`)
3. Verify that:
   - You are redirected to the purchase page for the Ad Generator
4. Try to access the Blueprint page (`/dashboard/blueprint`)
5. Verify that:
   - You are redirected to the purchase page for the Blueprint

## 4. Email Notification Testing

### 4.1 Account Deletion Email

1. Log in with a test user
2. Navigate to the profile page (`/dashboard/profile`)
3. Go to the delete account page (`/dashboard/profile/delete-account`)
4. Fill in the required information and confirm the deletion
5. Verify that:
   - An email notification is sent to `pmuprofitsystem@gmail.com`
   - The email contains the user's information and reason for deletion
   - A record is created in the `email_logs` table

## 5. Mobile Responsiveness Testing

1. Open the application on a mobile device or use browser developer tools to simulate a mobile device
2. Test the following pages:
   - Home page
   - Login page
   - Checkout page
   - Dashboard
   - Module pages
   - Ad Generator
   - Blueprint
3. Verify that:
   - All pages display correctly on mobile
   - Navigation works properly
   - Forms are usable on small screens

## 6. Error Handling Testing

### 6.1 Invalid Login

1. Navigate to the login page (`/login`)
2. Enter invalid credentials:
   - Email: `test@example.com`
   - Password: `wrongpassword`
3. Click "Log In"
4. Verify that:
   - An error message is displayed
   - You remain on the login page

### 6.2 Invalid Registration

1. Navigate to the checkout page (`/checkout`)
2. Fill in the registration form with:
   - Full Name: `Test User`
   - Email: `test@example.com` (an email that already exists)
   - Password: `password123`
3. Complete the purchase
4. Verify that:
   - An error message is displayed
   - You remain on the checkout page

## 7. Performance Testing

1. Use browser developer tools to measure page load times
2. Check for any console errors or warnings
3. Verify that images load quickly and are properly optimized
4. Test the application with slow network conditions to ensure it remains usable

## 8. Security Testing

1. Verify that all API routes are protected from unauthorized access
2. Check that sensitive data is not exposed in the client-side code
3. Ensure that authentication tokens are stored securely
4. Test for common security vulnerabilities (e.g., XSS, CSRF) 