# Environment Testing Plan

## Overview

This document outlines the testing plan for verifying environment-specific functionality across both local and production environments. The PMU Profit System implements environment isolation to prevent users from accessing their accounts from different environments than where they were created.

## Environment Determination

The system determines the current environment based on the hostname:
- `localhost` or `127.0.0.1` is considered the 'local' environment
- `pmuprofitsystem.com` is considered the 'production' environment

## Test Scenarios

### 1. Local Environment Testing

#### 1.1 Local User in Local Environment
- **Setup**: Create a user with environment='local' in the local environment
- **Test**: Log in with this user in the local environment
- **Expected Result**: Login successful, user can access dashboard

#### 1.2 Production User in Local Environment
- **Setup**: Create a user with environment='production' in the local environment
- **Test**: Log in with this user in the local environment
- **Expected Result**: Login fails with environment mismatch error, user is redirected to the environment mismatch page

#### 1.3 Logout and Login Again (Local User)
- **Setup**: Log in with a local user in the local environment
- **Test**: Log out and log in again with the same user
- **Expected Result**: Both logout and subsequent login are successful

### 2. Production Environment Testing

#### 2.1 Production User in Production Environment
- **Setup**: Create a user with environment='production' in the production environment
- **Test**: Log in with this user in the production environment
- **Expected Result**: Login successful, user can access dashboard

#### 2.2 Local User in Production Environment
- **Setup**: Create a user with environment='local' in the production environment
- **Test**: Log in with this user in the production environment
- **Expected Result**: Login fails with environment mismatch error, user is redirected to the environment mismatch page

#### 2.3 Logout and Login Again (Production User)
- **Setup**: Log in with a production user in the production environment
- **Test**: Log out and log in again with the same user
- **Expected Result**: Both logout and subsequent login are successful

### 3. Cross-Environment Testing

#### 3.1 Local User Created in Local, Accessing from Production
- **Setup**: Create a user in the local environment
- **Test**: Attempt to log in with this user in the production environment
- **Expected Result**: Login fails with environment mismatch error

#### 3.2 Production User Created in Production, Accessing from Local
- **Setup**: Create a user in the production environment
- **Test**: Attempt to log in with this user in the local environment
- **Expected Result**: Login fails with environment mismatch error

## Test Implementation

### Automated Testing

1. **Local Environment Tests**:
   - Use the `test-dashboard-access.js` script to test local user login/logout in the local environment
   - Use the `test-environment-mismatch.js` script to test production user login in the local environment

2. **Production Environment Tests**:
   - Deploy the application to production
   - Create a production version of the test scripts that point to the production URL
   - Run the tests against the production environment

### Manual Testing

1. **Local Environment**:
   - Create test users with both local and production environments
   - Verify login behavior for both types of users
   - Test logout and login again functionality

2. **Production Environment**:
   - Create test users in the production environment
   - Verify login behavior in production
   - Test logout and login again functionality

## Test Data Management

- Use unique email addresses for test users (with timestamps)
- Clean up test users after testing is complete
- Document any persistent test users created for long-term testing

## Reporting

Document test results including:
- Test date and environment
- Test scenarios executed
- Pass/fail status
- Screenshots of any errors
- Browser console logs for debugging

## Conclusion

This testing plan ensures that the environment isolation functionality works correctly across both local and production environments. By testing all combinations of user environments and access environments, we can verify that users are properly restricted to the environment where their account was created. 