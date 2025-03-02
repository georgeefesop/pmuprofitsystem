/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  // Enable more detailed error logging
  webpack: (config, { isServer, dev }) => {
    if (dev && isServer) {
      // Server-side only logging in development
      console.log('Server-side webpack config');
    }
    
    return config;
  },
  // Add image domains configuration
  images: {
    domains: ['randomuser.me', 'images.pexels.com', 'images.unsplash.com', 'drive.google.com', 'ui-avatars.com'],
  },
  // Exclude development-only pages from production builds
  experimental: {
    // Only include the diagnostics page in development builds
    outputFileTracingExcludes: process.env.NODE_ENV === 'production' 
      ? { 
          '*': ['**/diagnostics/**'] 
        } 
      : {},
  },
};

module.exports = nextConfig; 