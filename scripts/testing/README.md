# Authentication Flow Testing

This directory contains scripts for testing the authentication flow from signup to checkout.

## Available Tests

### 1. API-based Authentication Flow Test

This test uses HTTP requests to test the authentication flow API endpoints.

```bash
npm run test:auth
```

The test will:
1. Create a test user
2. Test the signup API
3. Test the login API
4. Test session persistence
5. Test checkout page authentication

Logs are saved to `auth-flow-test.log` in this directory.

### 2. Browser-based Authentication Flow Test

This test uses Puppeteer to test the authentication flow in a real browser environment.

```bash
npm run test:auth:browser
```

The test will:
1. Open a browser window
2. Navigate to the pre-checkout page
3. Fill out and submit the signup form
4. Verify redirect to checkout
5. Verify checkout page loads properly

Screenshots and logs are saved to the `browser-test-output` directory.

### 3. Full User Journey Test

This test uses Puppeteer to test the complete user journey from homepage to dashboard access.

```bash
npm run test:full-journey
```

The test will:
1. Start at the homepage
2. Click the "Get Started" CTA button
3. Fill out the pre-checkout form to create an account
4. Complete the checkout process
5. Verify the success page
6. Navigate to the dashboard

This test provides a comprehensive verification of the entire conversion funnel, capturing screenshots and detailed logs at each step of the process.

## Installation

Before running the tests, install the required dependencies:

```bash
npm run test:install-deps
```

This will install:
- `node-fetch` for HTTP requests
- `puppeteer` for browser testing

## Debugging Tips

### Checking Logs

All tests create detailed log files that include:
- API responses
- Cookie information
- Authentication state
- Error messages
- localStorage and sessionStorage contents

### Browser Test Screenshots

The browser tests take screenshots at each step of the process, which can be found in the `browser-test-output` directory.

For the full user journey test, screenshots include:
1. `1-homepage.png` - Homepage
2. `2-before-cta-click.png` - Before clicking the CTA button
3. `3-pre-checkout-page.png` - Pre-checkout page
4. `4-pre-checkout-form.png` - Pre-checkout form
5. `5-form-filled.png` - Form filled out
6. `6-after-form-submission.png` - After submitting the form
7. `8-after-redirect.png` - After redirect to checkout
8. `9-checkout-page.png` - Checkout page
9. `10-before-checkout-completion.png` - Before completing checkout
10. `12-after-checkout-completion.png` - After checkout completion
11. `13-success-page.png` - Success page
12. `15-dashboard.png` - Dashboard page

### Console Logs

The browser tests capture all console logs from the browser, which can help identify JavaScript errors or authentication issues. Look for messages like:

- `AuthContext: Using singleton Supabase client` - Confirms the singleton client is being used
- `Checking session...` - Shows authentication checks in progress
- `Session check result: No session` - Indicates no active session
- `Auth state changed: INITIAL_SESSION No session` - Shows authentication state changes
- `User just signed up, not redirecting` - Indicates the "justSignedUp" flag is working

### Storage Inspection

The tests log both localStorage and sessionStorage at each step:

- `sessionStorage.justSignedUp = 'true'` - Indicates the user just signed up, preventing redirect loops
- `sessionStorage.isAuthenticating = 'true'` - Shows authentication is in progress

### Network Requests

The browser tests log all network requests and responses, particularly focusing on:

- API calls to `/api/auth/signup` and `/api/auth/signin`
- JSON responses from authentication endpoints
- Cookies set during authentication

## Troubleshooting

If the tests fail, check the following:

1. **API Endpoints**: Ensure the authentication API endpoints are working correctly.
2. **Cookie Handling**: Check if cookies are being properly set and sent with requests.
3. **Redirect Logic**: Verify that the redirect from pre-checkout to checkout is working.
4. **Authentication State**: Check if the authentication state is being properly maintained between pages.
5. **Timeouts**: If the checkout page is stuck loading, check for timeouts or race conditions in the authentication flow. 