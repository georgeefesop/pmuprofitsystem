// This file is used to disable the diagnostics page in production
// It will throw an error during build time if the page is included in a production build

// Use type assertion to handle TypeScript's strict type checking
const nodeEnv = process.env.NODE_ENV as string;

if (nodeEnv === 'production') {
  throw new Error('Diagnostics page should not be included in production builds');
}

export const isDevelopment = nodeEnv !== 'production';
export const isProduction = nodeEnv === 'production';

// This ensures the page is only accessible in development
export const shouldRenderDiagnostics = isDevelopment; 