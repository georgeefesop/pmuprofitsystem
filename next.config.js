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
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'randomuser.me',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'drive.google.com',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
    ],
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
  // Conditionally exclude pages from production builds
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'].filter(ext => {
    // In production, filter out diagnostic pages
    if (process.env.NODE_ENV === 'production') {
      return true;
    }
    return true;
  }),
};

// Special handling for Vercel builds
if (process.env.VERCEL) {
  // Create a custom rewrites configuration for Vercel
  nextConfig.rewrites = async () => {
    return [
      {
        // Redirect any requests to /diagnostics to the home page in production
        source: '/diagnostics',
        destination: '/',
        has: [
          {
            type: 'host',
            value: 'pmuprofitsystem.vercel.app',
          },
        ],
      },
      {
        // Redirect any requests to /diagnostics/* to the home page in production
        source: '/diagnostics/:path*',
        destination: '/',
        has: [
          {
            type: 'host',
            value: 'pmuprofitsystem.vercel.app',
          },
        ],
      },
    ];
  };
}

// Configure server-side only routes
nextConfig.serverRuntimeConfig = {
  // Will only be available on the server side
  testRoutes: true,
};

// Replace unstable_excludeFiles with supported configuration
// These routes should not be statically generated
if (!nextConfig.experimental) {
  nextConfig.experimental = {};
}

// Add these files to the tracing excludes to prevent static generation
if (!nextConfig.experimental.outputFileTracingExcludes) {
  nextConfig.experimental.outputFileTracingExcludes = {};
}

// Add the previously excluded files to the proper configuration
nextConfig.experimental.outputFileTracingExcludes['*'] = [
  ...(nextConfig.experimental.outputFileTracingExcludes['*'] || []),
  'src/app/api/test-auth-status/route.ts',
  'src/app/api/check-verification-status/route.ts',
  'src/app/api/update-supabase-redirect/route.ts',
  'src/app/api/update-supabase-settings/route.ts',
  'src/app/auth/callback/route.ts'
];

module.exports = nextConfig; 