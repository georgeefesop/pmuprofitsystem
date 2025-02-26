# PMU Profit System Error Handling

This document explains the error handling system implemented in the PMU Profit System. The system is designed to catch, log, and handle various types of errors that might occur during the build process or at runtime.

## Table of Contents

1. [Overview](#overview)
2. [Error Types](#error-types)
3. [Error Handling Components](#error-handling-components)
4. [Utility Functions](#utility-functions)
5. [Scripts](#scripts)
6. [Best Practices](#best-practices)

## Overview

The error handling system consists of several components:

- **Error Handler Library**: A set of utility functions for capturing and handling errors.
- **Error Boundary Component**: A React component that catches errors in its children.
- **SafeImage Component**: A wrapper around Next.js Image component that handles image errors.
- **Global Error Handlers**: Components that handle errors at the application level.
- **Error Checking Scripts**: Scripts that check for common build errors and provide solutions.

## Error Types

The system categorizes errors into the following types:

- **IMAGE**: Errors related to image loading or processing.
- **API**: Errors related to API calls or data fetching.
- **COMPONENT**: Errors that occur within React components.
- **ROUTE**: Errors related to routing or navigation.
- **UNKNOWN**: Errors that don't fit into any of the above categories.

## Error Handling Components

### ErrorBoundary

The `ErrorBoundary` component is a class component that uses React's error boundary feature to catch errors in its children. It displays a fallback UI when an error occurs.

```tsx
import ErrorBoundary from '@/components/ErrorBoundary';

// Usage
<ErrorBoundary fallback={<div>Something went wrong</div>} componentName="MyComponent">
  <MyComponent />
</ErrorBoundary>
```

### SafeImage

The `SafeImage` component is a wrapper around Next.js Image component that handles image loading errors and domain configuration issues.

```tsx
import SafeImage from '@/components/ui/image';

// Usage
<SafeImage
  src="https://example.com/image.jpg"
  alt="Example"
  width={500}
  height={300}
  fallbackSrc="/placeholder.jpg"
/>
```

## Utility Functions

### captureError

Captures and logs an error to the error store.

```tsx
import { captureError, ErrorType } from '@/lib/error-handler';

// Usage
try {
  // Some code that might throw an error
} catch (error) {
  captureError(error, ErrorType.COMPONENT, 'MyComponent');
}
```

### handleImageError

Handles image loading errors.

```tsx
import { handleImageError } from '@/lib/error-handler';

// Usage
const handleError = () => {
  handleImageError('https://example.com/image.jpg', new Error('Image failed to load'));
};
```

### safeExecute

Safely executes a function and handles any errors.

```tsx
import { safeExecute, ErrorType } from '@/lib/error-handler';

// Usage
const result = safeExecute(
  () => someRiskyFunction(),
  ErrorType.API,
  'API Call',
  fallbackValue
);
```

## Scripts

### check-image-domains.js

This script checks for image domains in the codebase and updates the `next.config.js` file accordingly. It runs automatically before each build.

```bash
npm run prebuild
```

### check-build-errors.js

This script checks for common build errors and provides solutions. It can be run manually when you encounter build errors.

```bash
npm run check-errors
```

## Best Practices

1. **Use ErrorBoundary for Critical Components**: Wrap critical components in an ErrorBoundary to prevent the entire application from crashing.

2. **Use SafeImage for External Images**: Always use the SafeImage component for external images to handle domain configuration issues.

3. **Capture Errors in Try-Catch Blocks**: Use try-catch blocks and the captureError function to handle errors in async operations.

4. **Run Error Checking Scripts**: Run the error checking scripts when you encounter build errors to get automatic solutions.

5. **Check Error Logs**: Check the console for error logs with detailed information about the errors.

6. **Add 'use client' Directive**: Remember to add the 'use client' directive at the top of files that use React hooks or browser APIs.

7. **Keep next.config.js Updated**: Keep the `next.config.js` file updated with the domains of external images.

## Conclusion

The error handling system is designed to make the application more robust and provide better feedback when issues arise. By following the best practices and using the provided components and utilities, you can handle errors gracefully and provide a better user experience. 