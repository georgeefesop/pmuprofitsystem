# Supabase Authentication Guide for PMU Profit System

This document provides a comprehensive guide to the authentication system used in the PMU Profit System, which is built on Supabase Auth.

## Table of Contents

1. [Overview](#overview)
2. [Authentication Flow](#authentication-flow)
3. [User Registration](#user-registration)
4. [Email Verification](#email-verification)
5. [User Login](#user-login)
6. [Session Management](#session-management)
7. [Account Recovery](#account-recovery)
8. [Common Issues and Solutions](#common-issues-and-solutions)
9. [Security Considerations](#security-considerations)
10. [Testing Authentication](#testing-authentication)

## Overview

The PMU Profit System uses Supabase Auth for user authentication. Supabase provides a secure, scalable authentication system with features like:

- Email/password authentication
- Email verification
- Password recovery
- Session management
- Row-level security

Our implementation uses the Supabase JavaScript client with the PKCE (Proof Key for Code Exchange) flow for enhanced security.

## Authentication Flow

The authentication flow in the application follows these steps:

1. **User Registration**: User provides email, password, and name during checkout or signup
2. **Email Verification**: Supabase sends a verification email with a secure link
3. **Verification Confirmation**: User clicks the link and is redirected to the application
4. **Login**: User logs in with verified credentials
5. **Session Management**: Supabase manages the user session with secure tokens

## User Registration

Users can register in two ways:

1. **During Checkout**: When purchasing the course, users provide their information and an account is created
2. **Direct Registration**: Users can register directly through a registration form

The registration process:

```typescript
// Registration function in AuthContext.tsx
const register = async (email: string, password: string, name: string) => {
  // Get the site URL, preserving the protocol
  const redirectUrl = `${getSecureSiteUrl()}/auth/callback`;
  
  // Register the user with Supabase
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      },
      emailRedirectTo: redirectUrl,
    },
  });
  
  // Handle the response
  if (error) {
    return { success: false, error: error.message };
  }
  
  // Create a user profile in the database
  try {
    await supabase.from('users').insert({
      id: data.user!.id,
      email: data.user!.email || email,
      full_name: name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  } catch (profileError) {
    console.error('Error creating profile:', profileError);
  }
  
  return { success: true };
};
```

## Email Verification

After registration, users must verify their email address:

1. Supabase sends a verification email with a secure link
2. The link contains a one-time code that is exchanged for a session
3. When clicked, the user is redirected to `/auth/callback?code=XXX`
4. Our callback handler exchanges the code for a session
5. The user is then redirected to the dashboard or success page

The callback handler:

```typescript
// In src/app/auth/callback/route.ts
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  if (code) {
    try {
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error) {
        // Redirect to dashboard on success
        return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
      } else {
        // Handle errors
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(error.message)}`, 
          requestUrl.origin)
        );
      }
    } catch (error) {
      // Handle exceptions
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent('An error occurred')}`, 
        requestUrl.origin)
      );
    }
  }
  
  // Redirect to login if no code
  return NextResponse.redirect(new URL('/login', requestUrl.origin));
}
```

## User Login

Users log in with their email and password:

```typescript
// Login function in AuthContext.tsx
const login = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    };
  }
};
```

## Session Management

Supabase handles session management automatically:

1. After login, Supabase creates a session and stores it in local storage or cookies
2. The session includes an access token and refresh token
3. The access token is used for authenticated requests
4. The refresh token is used to get a new access token when it expires
5. Sessions can be configured to expire after a certain time

Our implementation uses the `onAuthStateChange` event to track session changes:

```typescript
// In AuthContext.tsx
useEffect(() => {
  // Listen for auth changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (session) {
        // User is logged in
        setUser(userData);
      } else {
        // User is logged out
        setUser(null);
      }
    }
  );
  
  // Clean up subscription
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

## Account Recovery

Users can recover their account if they forget their password:

1. User requests a password reset from the login page
2. Supabase sends a password reset email with a secure link
3. User clicks the link and is redirected to a password reset page
4. User sets a new password and is logged in

## Common Issues and Solutions

### 1. Email Verification Issues

**Issue**: User doesn't receive verification email or link doesn't work.

**Solution**:
- Check spam folder
- Resend verification email from the login page
- Ensure Supabase Site URL is configured correctly
- Verify that redirect URLs are properly set in Supabase dashboard

### 2. Account Banned After Verification

**Issue**: Some accounts are incorrectly marked as banned after email verification.

**Solution**:
- The application includes an automatic fix in the login page
- When a user tries to resend verification for a banned account, it automatically unbans it
- Admin can manually unban users in the Supabase dashboard

### 3. Missing User Profile

**Issue**: User exists in auth.users but not in the public.users table.

**Solution**:
- The application automatically creates a profile if missing
- A database trigger should create profiles automatically
- Admin can manually create profiles if needed

### 4. Session Timeout Issues

**Issue**: User session expires unexpectedly or doesn't expire when it should.

**Solution**:
- Check session configuration in Supabase dashboard
- Verify that the client is configured to refresh tokens
- Implement a session timeout handler in the application

## Security Considerations

1. **HTTPS**: Always use HTTPS in production to protect authentication data
2. **PKCE Flow**: Use the PKCE flow for enhanced security
3. **Environment Variables**: Keep API keys and secrets in environment variables
4. **Row-Level Security**: Implement RLS policies to protect data
5. **Password Policies**: Enforce strong password requirements
6. **Rate Limiting**: Implement rate limiting for authentication endpoints

## Testing Authentication

To test the authentication system:

1. **Registration Test**: Register a new user and verify email
2. **Login Test**: Log in with the registered user
3. **Session Test**: Verify that the session persists across page reloads
4. **Logout Test**: Log out and verify that protected routes are inaccessible
5. **Recovery Test**: Test the password recovery flow

You can use the `/test-auth` page in the application to test various authentication scenarios.

For automated testing, use the scripts in the `scripts/` directory:

```bash
# Test authentication
node scripts/test-auth.js
``` 