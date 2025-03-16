/**
 * Next.js Middleware Entry Point
 *
 * This file serves as the entry point for Next.js middleware.
 * It imports and re-exports the middleware implementation from the modular structure.
 *
 * Next.js requires this file to be in the src directory to register middleware.
 */

import { middleware, config } from './middleware/implementation';
import { isCustomMiddlewareEnabled } from './middleware/config';

// Only export the middleware if it's enabled
// This replaces the experimental.middleware: true setting
export const enabledMiddleware = isCustomMiddlewareEnabled() ? middleware : null;

// Export the middleware with the correct name
export { enabledMiddleware as middleware, config };
