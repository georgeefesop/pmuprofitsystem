import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/middleware';
import { isDevelopment, allowTestPage } from '@/lib/env-utils';
import { PRODUCT_IDS } from '@/lib/product-ids';

// Enhanced logging for debugging
console.log('Middleware: Module loaded with product IDs:', Object.keys(PRODUCT_IDS));

// Define protected routes that require authentication and entitlements
const PROTECTED_ROUTES = [
  '/dashboard',
  '/dashboard/modules',
  '/dashboard/blueprint',
  '/dashboard/handbook',
  '/dashboard/profile',
  // Add other protected routes here
];

// Define routes that require authentication but not entitlements
const AUTH_ONLY_ROUTES = [
  '/checkout',
  '/checkout/success',
  // Add other auth-only routes here
];

// Define public routes that should always be accessible
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/pre-checkout',
  '/forgot-password',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/cookies',
  // Add other public routes here
];

// Helper function to log cookies for debugging
function logCookies(req: NextRequest, prefix: string) {
  const cookieObj: Record<string, string> = {};
  req.cookies.getAll().forEach(cookie => {
    cookieObj[cookie.name] = cookie.value || '';
  });
  
  console.log(`Middleware: ${prefix} Cookies:`, {
    'sb-access-token': cookieObj['sb-access-token'] ? '✓ Present' : '✗ Missing',
    'sb-refresh-token': cookieObj['sb-refresh-token'] ? '✓ Present' : '✗ Missing',
    'auth-status': cookieObj['auth-status'] || 'Missing',
    cookieCount: Object.keys(cookieObj).length
  });
}

// Browser error logger injection (development only)
async function injectBrowserErrorLogger(response: NextResponse) {
  if (process.env.NODE_ENV === 'development' && response) {
    // Only inject in HTML responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      const html = await response.text();
      
      // Inject the error logger script
      const modifiedHtml = html.replace(
        '</head>',
        `<script>

// Error logger for development
(function() {
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleLog = console.log;
  
  // Function to get stack trace
  function getStackTrace() {
    try {
      throw new Error('');
    } catch (error) {
      return error.stack || '';
    }
  }
  
  // Function to get component name from stack trace
  function getComponentName(stack) {
    try {
      // Try to extract component name from stack trace
      const stackLines = stack.split('\n');
      for (let i = 0; i < stackLines.length; i++) {
        const line = stackLines[i];
        // Look for React component names (capitalized)
        const componentMatch = line.match(/at ([A-Z][a-zA-Z0-9]+)/);
        if (componentMatch && componentMatch[1]) {
          return componentMatch[1];
        }
      }
      return 'Unknown Component';
    } catch (e) {
      return 'Unknown Component';
    }
  }
  
  // Function to send errors to the server
  function sendErrorToServer(type, args, extraInfo = {}) {
    try {
      const stack = getStackTrace();
      const componentName = getComponentName(stack);
      
      const errorData = {
        type,
        timestamp: new Date().toISOString(),
        component: componentName,
        url: window.location.href,
        userAgent: navigator.userAgent,
        message: Array.from(args).map(arg => {
          try {
            if (arg instanceof Error) {
              return {
                name: arg.name,
                message: arg.message,
                stack: arg.stack
              };
            }
            return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
          } catch (e) {
            return 'Unstringifiable object';
          }
        }),
        stack: stack.split('\n').slice(1, 6).join('\n'), // First 5 lines of stack
        ...extraInfo
      };
      
      fetch('/api/dev-logger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorData)
      }).catch(e => {
        // Silent fail - don't create infinite loops
      });
    } catch (e) {
      // Silent fail
    }
  }
  
  // Override console.error
  console.error = function() {
    sendErrorToServer('error', arguments);
    originalConsoleError.apply(console, arguments);
  };
  
  // Override console.warn
  console.warn = function() {
    sendErrorToServer('warning', arguments);
    originalConsoleWarn.apply(console, arguments);
  };
  
  // Capture unhandled errors
  window.addEventListener('error', function(event) {
    sendErrorToServer('unhandled', [{
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    }], {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });
  
  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    sendErrorToServer('unhandledrejection', [event.reason]);
  });
  
  // Capture React errors
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    const originalOnErrorHandler = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onErrorOrWarning;
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onErrorOrWarning = function(fiber, type, error, componentStack) {
      if (type === 'error') {
        sendErrorToServer('react', [error], {
          componentStack
        });
      }
      if (originalOnErrorHandler) {
        originalOnErrorHandler.call(this, fiber, type, error, componentStack);
      }
    };
  }
  
  console.log('%c🔍 Browser error logging enabled', 'color: purple; font-weight: bold');
})();

</script></head>`
      );
      
      return new NextResponse(modifiedHtml, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    }
    
    return response;
  }
  
  return response;
}

// Helper function to create entitlements from a purchase
async function createEntitlementsFromPurchase(purchase: any, supabaseClient: any) {
  console.log('Middleware: Creating entitlements from purchase:', {
    purchaseId: purchase.id,
    userId: purchase.user_id,
    hasProductId: !!purchase.product_id,
    hasMetadata: !!purchase.metadata
  });

  if (!purchase || !purchase.user_id) {
    console.error('Middleware: Cannot create entitlements: Invalid purchase data');
    return { error: 'Invalid purchase data' };
  }

  const userId = purchase.user_id;
  const now = new Date().toISOString();
  const entitlements = [];

  try {
    // Check if this is a legacy purchase with product_id field
    if (purchase.product_id) {
      console.log('Middleware: Processing legacy purchase with product_id:', purchase.product_id);
      // Convert legacy product ID to UUID if needed
      let productId = purchase.product_id;
      
      // Create the entitlement
      console.log('Middleware: Creating entitlement for product:', productId);
      const { data: entitlement, error: entitlementError } = await supabaseClient
        .from('user_entitlements')
        .insert({
          user_id: userId,
          product_id: productId,
          source_type: 'purchase',
          source_id: purchase.id,
          valid_from: now,
          is_active: true
        })
        .select()
        .single();

      if (entitlementError) {
        console.error('Middleware: Error creating entitlement:', entitlementError);
      } else {
        console.log('Middleware: Created entitlement:', entitlement);
        entitlements.push(entitlement);
      }
    } else {
      // If no product_id, use the metadata or default to main product
      console.log('Middleware: No product_id found, using metadata or default');
      
      // Create entitlement for the main product (PMU Profit System)
      console.log('Middleware: Creating entitlement for main product:', PRODUCT_IDS['pmu-profit-system']);
      const { data: mainEntitlement, error: mainError } = await supabaseClient
        .from('user_entitlements')
        .insert({
          user_id: userId,
          product_id: PRODUCT_IDS['pmu-profit-system'],
          source_type: 'purchase',
          source_id: purchase.id,
          valid_from: now,
          is_active: true
        })
        .select()
        .single();

      if (mainError) {
        console.error('Middleware: Error creating main product entitlement:', mainError);
      } else {
        console.log('Middleware: Created main product entitlement:', mainEntitlement);
        entitlements.push(mainEntitlement);
      }

      // Check metadata for add-ons
      const metadata = purchase.metadata || {};
      console.log('Middleware: Checking metadata for add-ons:', metadata);
      
      // Create entitlement for Ad Generator if included
      if (metadata.include_ad_generator === true || metadata.includeAdGenerator === 'true') {
        console.log('Middleware: Creating entitlement for Ad Generator');
        const { data: adEntitlement, error: adError } = await supabaseClient
          .from('user_entitlements')
          .insert({
            user_id: userId,
            product_id: PRODUCT_IDS['pmu-ad-generator'],
            source_type: 'purchase',
            source_id: purchase.id,
            valid_from: now,
            is_active: true
          })
          .select()
          .single();

        if (adError) {
          console.error('Middleware: Error creating ad generator entitlement:', adError);
        } else {
          console.log('Middleware: Created ad generator entitlement:', adEntitlement);
          entitlements.push(adEntitlement);
        }
      }

      // Create entitlement for Blueprint if included
      if (metadata.include_blueprint === true || metadata.includeBlueprint === 'true') {
        console.log('Middleware: Creating entitlement for Blueprint');
        const { data: blueprintEntitlement, error: blueprintError } = await supabaseClient
          .from('user_entitlements')
          .insert({
            user_id: userId,
            product_id: PRODUCT_IDS['consultation-success-blueprint'],
            source_type: 'purchase',
            source_id: purchase.id,
            valid_from: now,
            is_active: true
          })
          .select()
          .single();

        if (blueprintError) {
          console.error('Middleware: Error creating blueprint entitlement:', blueprintError);
        } else {
          console.log('Middleware: Created blueprint entitlement:', blueprintEntitlement);
          entitlements.push(blueprintEntitlement);
        }
      }
    }

    // Update purchase status to indicate entitlements were created
    console.log('Middleware: Updating purchase status to completed');
    const { error: updateError } = await supabaseClient
      .from('purchases')
      .update({ 
        status: 'completed', 
        entitlements_created: true,
        updated_at: now
      })
      .eq('id', purchase.id);
    
    if (updateError) {
      console.error('Middleware: Error updating purchase status:', updateError);
    }

    console.log(`Middleware: Created ${entitlements.length} entitlements for user ${userId}`);
    return { entitlements };
  } catch (error) {
    console.error('Middleware: Error creating entitlements:', error);
    return { error };
  }
}

export async function middleware(req: NextRequest) {
  console.log('Middleware: Starting middleware execution');
  
  // Log cookies for debugging
  logCookies(req, 'Initial');
  
  // Create the response and Supabase client
  const { supabase, response } = createClient(req);
  
  // Get the path from the request
  const path = req.nextUrl.pathname;
  
  // Get query parameters
  const { searchParams } = req.nextUrl;
  const purchaseSuccess = searchParams.get('purchase_success');
  const sessionId = searchParams.get('session_id');
  
  // Log the request for debugging
  console.log(`Middleware: Path=${path}, purchaseSuccess=${purchaseSuccess}, sessionId=${sessionId}`);
  
  // Skip middleware for static files, API routes, and other non-page routes
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.startsWith('/static') ||
    path.includes('.') ||
    path === '/favicon.ico'
  ) {
    console.log(`Middleware: Skipping middleware for non-page route: ${path}`);
    // Optionally inject browser error logger for HTML responses in development
    if (process.env.NODE_ENV === 'development') {
      return await injectBrowserErrorLogger(response);
    }
    return response;
  }
  
  // If the path is a public route, allow access regardless of authentication
  if (PUBLIC_ROUTES.some(route => path === route)) {
    console.log(`Middleware: Path ${path} is a public route, allowing access`);
    return response;
  }
  
  // Enhanced authentication check
  console.log('Middleware: Starting enhanced authentication check');
  
  // Check if cookies are present
  const hasCookies = req.cookies.size > 0;
  console.log(`Middleware: Cookies present: ${hasCookies}, count: ${req.cookies.size}`);
  
  // Get all relevant cookies
  const sbAccessToken = req.cookies.get('sb-access-token');
  const sbRefreshToken = req.cookies.get('sb-refresh-token');
  const authStatusCookie = req.cookies.get('auth-status');
  
  console.log('Middleware: Auth cookies:', {
    accessToken: sbAccessToken ? '✓ Present' : '✗ Missing',
    refreshToken: sbRefreshToken ? '✓ Present' : '✗ Missing',
    authStatus: authStatusCookie?.value || 'Missing'
  });
  
  // Try to get the session
  let session = null;
  let userId = null;
  
  // IMPROVED SESSION RESTORATION APPROACH
  try {
    console.log('Middleware: Starting auth check for path:', path);
    
    // First try to get the user directly
    console.log('Middleware: Calling supabase.auth.getUser()');
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('Middleware: Error getting user:', userError.message);
    } else if (userData?.user) {
      userId = userData.user.id;
      console.log(`Middleware: Found user: ${userId}`);
      
      // Get the session
      console.log('Middleware: Calling supabase.auth.getSession()');
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.log('Middleware: Error getting session:', error.message);
      } else if (data?.session) {
        session = data.session;
        console.log(`Middleware: Found session for user: ${session.user.id}`);
        console.log('Middleware: Session details:', {
          expiresAt: new Date(session.expires_at! * 1000).toISOString(),
          hasAccessToken: !!session.access_token?.substring(0, 10),
          hasRefreshToken: !!session.refresh_token?.substring(0, 10)
        });
      } else {
        console.log('Middleware: No session found for authenticated user');
      }
    } else {
      console.log('Middleware: No user found from getUser()');
    }
    
    // If no session but we have tokens, try to restore the session
    if (!session && (sbAccessToken || sbRefreshToken || authStatusCookie?.value === 'authenticated')) {
      console.log('Middleware: No session found but auth indicators exist, attempting to restore session');
      
      // If we have both tokens, try to set the session directly
      if (sbAccessToken && sbRefreshToken) {
        try {
          console.log('Middleware: Attempting to restore session with tokens');
          const { data, error } = await supabase.auth.setSession({
            access_token: sbAccessToken.value,
            refresh_token: sbRefreshToken.value
          });
          
          if (error) {
            console.log('Middleware: Error restoring session from tokens:', error.message);
          } else if (data?.session) {
            session = data.session;
            userId = data.session.user.id;
            console.log(`Middleware: Successfully restored session for user: ${userId}`);
            console.log('Middleware: Restored session details:', {
              expiresAt: new Date(session.expires_at! * 1000).toISOString(),
              hasAccessToken: !!session.access_token?.substring(0, 10),
              hasRefreshToken: !!session.refresh_token?.substring(0, 10)
            });
          } else {
            console.log('Middleware: No session returned from setSession');
          }
        } catch (error) {
          console.log('Middleware: Error in session restoration:', error);
        }
      }
      
      // If still no session but we have the auth-status cookie, try to refresh the session
      if (!session && authStatusCookie?.value === 'authenticated') {
        console.log('Middleware: Attempting to refresh session based on auth-status cookie');
        
        try {
          console.log('Middleware: Calling supabase.auth.refreshSession()');
          const { data, error } = await supabase.auth.refreshSession();
          
          if (error) {
            console.log('Middleware: Error refreshing session:', error.message);
          } else if (data?.session) {
            session = data.session;
            userId = data.session.user.id;
            console.log(`Middleware: Successfully refreshed session for user: ${userId}`);
            console.log('Middleware: Refreshed session details:', {
              expiresAt: new Date(session.expires_at! * 1000).toISOString(),
              hasAccessToken: !!session.access_token?.substring(0, 10),
              hasRefreshToken: !!session.refresh_token?.substring(0, 10)
            });
          } else {
            console.log('Middleware: No session returned from refreshSession');
          }
        } catch (error) {
          console.log('Middleware: Error in session refresh:', error);
        }
      }
    }
  } catch (error) {
    console.log('Middleware: Unexpected error in auth check:', error);
  }
  
  // Special handling for login page - if user is already authenticated, redirect to dashboard
  if ((path === '/login' || path === '/signup') && session) {
    console.log('Middleware: User is already authenticated and trying to access login/signup page, redirecting to dashboard');
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  
  // Special handling for pre-checkout page - if user is already authenticated, redirect to checkout
  if (path === '/pre-checkout' && session) {
    console.log('Middleware: User is already authenticated and trying to access pre-checkout, redirecting to checkout');
    const redirectUrl = new URL('/checkout', req.url);
    // Preserve any product parameters
    const products = searchParams.get('products');
    if (products) {
      redirectUrl.searchParams.set('products', products);
    }
    return NextResponse.redirect(redirectUrl);
  }
  
  // If user is not authenticated and trying to access a protected route, redirect to login
  if (!session) {
    if (PROTECTED_ROUTES.some(route => path.startsWith(route))) {
      console.log('Middleware: User not authenticated, redirecting to login');
      const redirectUrl = new URL('/login', req.url);
      redirectUrl.searchParams.set('redirect', path);
      return NextResponse.redirect(redirectUrl);
    }
    
    if (AUTH_ONLY_ROUTES.some(route => path.startsWith(route))) {
      // For checkout, redirect to pre-checkout to create an account first
      if (path.startsWith('/checkout') && !path.includes('/success')) {
        console.log('Middleware: User not authenticated, redirecting to pre-checkout');
        const redirectUrl = new URL('/pre-checkout', req.url);
        // Preserve any product parameters
        const products = searchParams.get('products');
        if (products) {
          redirectUrl.searchParams.set('products', products);
        }
        return NextResponse.redirect(redirectUrl);
      }
      
      // For other auth-only routes, redirect to login
      console.log('Middleware: User not authenticated, redirecting to login');
      const redirectUrl = new URL('/login', req.url);
      redirectUrl.searchParams.set('redirect', path);
      return NextResponse.redirect(redirectUrl);
    }
    
    // For public routes, allow access
    console.log('Middleware: Path is public and user is not authenticated, allowing access');
    // Optionally inject browser error logger for HTML responses in development
    if (process.env.NODE_ENV === 'development') {
      return await injectBrowserErrorLogger(response);
    }
    return response;
  }
  
  // User is authenticated, set user claim in request headers
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-user-id', session.user.id);
  console.log(`Middleware: User authenticated: ${session.user.id}`);
  
  // For protected routes, check entitlements
  if (PROTECTED_ROUTES.some(route => path.startsWith(route))) {
    console.log('Middleware: User authenticated, checking entitlements');
    
    // Set the user ID in request headers for API routes
    requestHeaders.set('x-user-id', session.user.id);
    
    // Check if user has entitlements
    try {
      // Instead of directly querying the database, we'll make a request to our API endpoint
      // This will use the service role client to bypass RLS
      const apiUrl = new URL('/api/user-entitlements', req.url);
      apiUrl.searchParams.set('userId', session.user.id);
      console.log(`Middleware: Fetching entitlements from API: ${apiUrl.toString()}`);
      
      const apiResponse = await fetch(apiUrl, {
        headers: {
          'x-user-id': session.user.id,
          'Cookie': req.headers.get('cookie') || ''
        }
      });
      
      if (!apiResponse.ok) {
        console.error(`Middleware: API returned error: ${apiResponse.status}`);
        // If the API returns an error, allow access to avoid blocking legitimate users
        // This is a fallback to prevent users from being locked out due to technical issues
        console.log('Middleware: Allowing access despite API error');
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      }
      
      const data = await apiResponse.json();
      console.log(`Middleware: API returned ${data.entitlementCount || 0} entitlements`);
      
      // If user has active entitlements, allow access
      if (data.entitlements && data.entitlements.length > 0) {
        console.log(`Middleware: User has ${data.entitlements.length} active entitlements`);
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      }
      
      // If user has purchases but no entitlements, they might need entitlements created
      if (data.purchases && data.purchases.length > 0) {
        console.log(`Middleware: User has ${data.purchases.length} purchases but no entitlements`);
        console.log('Middleware: Allowing access and will create entitlements asynchronously');
        
        // Allow access but trigger entitlement creation asynchronously
        // This ensures users aren't blocked while entitlements are being created
        fetch(`${req.nextUrl.origin}/api/create-entitlements-from-purchases?userId=${session.user.id}`, {
          method: 'POST',
          headers: {
            'x-user-id': session.user.id
          }
        }).catch(error => {
          console.error('Middleware: Error triggering entitlement creation:', error);
        });
        
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      }
      
      // If user has no entitlements and no purchases, redirect to checkout
      console.log('Middleware: User has no active entitlements or purchases, redirecting to checkout');
      return NextResponse.redirect(new URL('/checkout', req.url));
    } catch (error) {
      console.error('Middleware: Error checking entitlements:', error);
      // If there's an error checking entitlements, allow access to avoid blocking legitimate users
      console.log('Middleware: Allowing access despite entitlement check error');
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  }
  
  // For checkout success page with session_id, verify the purchase
  if (path.startsWith('/checkout/success') && sessionId) {
    console.log(`Middleware: Checkout success with session ID: ${sessionId}`);
    
    // Set the session ID in request headers
    requestHeaders.set('x-session-id', sessionId);
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }
  
  // For all other routes, allow access for authenticated users
  console.log(`Middleware: Allowing access to ${path} for authenticated user`);
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Configure middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 