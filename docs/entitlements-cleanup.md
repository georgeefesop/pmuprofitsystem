# Entitlements and Purchases Cleanup

This document describes the functionality for cleaning up user entitlements and purchases in the PMU Profit System.

## Overview

The system includes a cleanup feature that allows administrators and users to:

1. Remove addon entitlements while preserving the main product
2. Clean up phantom entitlements (those with invalid product IDs or non-existent purchase references)
3. Clean up phantom purchases (those with invalid product IDs)
4. Reset purchase metadata to allow re-purchasing of addons

This functionality is particularly useful for testing and for resolving data inconsistencies.

## Implementation

The cleanup functionality is implemented in two main components:

1. **API Route**: `src/app/api/user-entitlements/clear-addons/route.ts`
2. **UI Component**: `src/components/UserEntitlements.tsx`

### API Route

The API route handles the following tasks:

1. Fetches all entitlements and purchases for a user
2. Identifies phantom entitlements (invalid product IDs or non-existent purchase references)
3. Deletes phantom entitlements
4. Deletes addon entitlements (preserving the main product)
5. Identifies phantom purchases (invalid product IDs)
6. Deletes phantom purchases
7. Deletes addon purchases (preserving the main product purchase)
8. Updates the main product purchase metadata to remove addon flags

### UI Component

The UI component provides a button in the profile page that allows users to:

1. Clean up their entitlements and purchases
2. See a success message with details about what was cleaned up
3. View the updated list of products after cleanup

## Testing

The cleanup functionality has been tested using a script located at `scripts/testing/test-cleanup-entitlements.js`. This script:

1. Creates phantom entitlements and purchases
2. Calls the cleanup API
3. Verifies that phantom data was removed
4. Verifies that only the main product remains

## Usage

To use the cleanup functionality:

1. Navigate to the profile page
2. Scroll down to the debug section
3. Click the "Clean Up Entitlements & Purchases" button
4. Confirm the action in the dialog
5. Wait for the cleanup to complete
6. View the success message with details about what was cleaned up

## Considerations

- The cleanup functionality is designed to be safe and only remove data that is invalid or not needed
- The main product entitlement and purchase are always preserved
- The cleanup is performed using the Supabase service role client to bypass RLS
- The cleanup is performed in a transaction to ensure data consistency

## Future Improvements

Potential future improvements to the cleanup functionality include:

1. Adding more detailed logging
2. Adding the ability to selectively clean up specific entitlements or purchases
3. Adding the ability to restore cleaned up data
4. Adding the ability to clean up data for all users at once 