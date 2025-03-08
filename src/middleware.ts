import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/middleware';
import { isDevelopment, allowTestPage } from '@/lib/env-utils';
import { PRODUCT_IDS } from '@/lib/product-ids';

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
  if (!purchase || !purchase.user_id) {
    console.error('Cannot create entitlements: Invalid purchase data');
    return { error: 'Invalid purchase data' };
  }

  const userId = purchase.user_id;
  const now = new Date().toISOString();
  const entitlements = [];

  try {
    // Check if this is a legacy purchase with product_id field
    if (purchase.product_id) {
      // Convert legacy product ID to UUID if needed
      let productId = purchase.product_id;
      
      // Create the entitlement
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
        console.error('Error creating entitlement:', entitlementError);
      } else {
        console.log('Created entitlement:', entitlement);
        entitlements.push(entitlement);
      }
    } else {
      // If no product_id, use the metadata or default to main product
      
      // Create entitlement for the main product (PMU Profit System)
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
        console.error('Error creating main product entitlement:', mainError);
      } else {
        console.log('Created main product entitlement:', mainEntitlement);
        entitlements.push(mainEntitlement);
      }

      // Check metadata for add-ons
      const metadata = purchase.metadata || {};
      
      // Create entitlement for Ad Generator if included
      if (metadata.include_ad_generator === true || metadata.includeAdGenerator === 'true') {
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
          console.error('Error creating ad generator entitlement:', adError);
        } else {
          console.log('Created ad generator entitlement:', adEntitlement);
          entitlements.push(adEntitlement);
        }
      }

      // Create entitlement for Blueprint if included
      if (metadata.include_blueprint === true || metadata.includeBlueprint === 'true') {
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
          console.error('Error creating blueprint entitlement:', blueprintError);
        } else {
          console.log('Created blueprint entitlement:', blueprintEntitlement);
          entitlements.push(blueprintEntitlement);
        }
      }
    }

    // Update purchase status to indicate entitlements were created
    const { error: updateError } = await supabaseClient
      .from('purchases')
      .update({ 
        status: 'completed', 
        entitlements_created: true,
        updated_at: now
      })
      .eq('id', purchase.id);
    
    if (updateError) {
      console.error('Error updating purchase status:', updateError);
    }

    return { entitlements };
  } catch (error) {
    console.error('Error creating entitlements:', error);
    return { error };
  }
}

export async function middleware(req: NextRequest) {
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
    // Optionally inject browser error logger for HTML responses in development
    if (process.env.NODE_ENV === 'development') {
      return await injectBrowserErrorLogger(response);
    }
    return response;
  }
  
  // Enhanced authentication check
  console.log('Middleware: Starting enhanced authentication check');
  
  // Check if cookies are present
  const hasCookies = req.cookies.size > 0;
  console.log(`Middleware: Cookies present: ${hasCookies}`);
  
  // Try to get the session
  let session = null;
  try {
    // First try to get the user directly - this is more reliable than getSession
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Middleware: Error getting user:', userError);
    } else if (userData.user) {
      console.log(`Middleware: Found user: ${userData.user.id}`);
      
      // Now get the session
      const { data, error } = await supabase.auth.getSession();
      session = data.session;
      
      if (error) {
        console.error('Middleware: Error getting session:', error);
      } else if (session) {
        console.log(`Middleware: Found session for user: ${session.user.id}`);
      } else {
        console.log('Middleware: User found but no session, trying to refresh token');
        
        // Try to refresh the session
        try {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          session = refreshData.session;
          
          if (refreshError) {
            console.error('Middleware: Error refreshing session:', refreshError);
          } else if (session) {
            console.log(`Middleware: Refreshed session for user: ${session.user.id}`);
          }
        } catch (refreshError) {
          console.error('Middleware: Error refreshing session:', refreshError);
        }
      }
    } else {
      console.log('Middleware: No user found, trying to get session');
      
      // Try to get the session directly
      const { data, error } = await supabase.auth.getSession();
      session = data.session;
      
      if (error) {
        console.error('Middleware: Error getting session:', error);
      } else if (session) {
        console.log(`Middleware: Found session for user: ${session.user.id}`);
      } else {
        console.log('Middleware: No session found in initial check, trying to refresh token');
        
        // Try to refresh the session
        try {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          session = refreshData.session;
          
          if (refreshError) {
            console.error('Middleware: Error refreshing session:', refreshError);
          } else if (session) {
            console.log(`Middleware: Refreshed session for user: ${session.user.id}`);
          }
        } catch (refreshError) {
          console.error('Middleware: Error refreshing session:', refreshError);
        }
      }
    }
  } catch (error) {
    console.error('Middleware: Error checking session:', error);
  }
  
  // Check for auth-status cookie as a fallback
  const authStatusCookie = req.cookies.get('auth-status');
  const sbAccessToken = req.cookies.get('sb-access-token');
  const sbRefreshToken = req.cookies.get('sb-refresh-token');
  
  if (!session && authStatusCookie && authStatusCookie.value === 'authenticated') {
    console.log('Middleware: Found auth-status cookie, but no valid session');
    
    // Check if we have the Supabase tokens
    if (sbAccessToken && sbRefreshToken) {
      console.log('Middleware: Found Supabase tokens, attempting to restore session');
      
      try {
        // Try to set the auth cookies and restore the session
        const { data, error } = await supabase.auth.setSession({
          access_token: sbAccessToken.value,
          refresh_token: sbRefreshToken.value
        });
        
        if (error) {
          console.error('Middleware: Error setting session from cookies:', error);
        } else if (data.session) {
          console.log(`Middleware: Successfully restored session for user: ${data.session.user.id}`);
          session = data.session;
        }
      } catch (error) {
        console.error('Middleware: Error setting session from cookies:', error);
      }
    }
    
    // If we still don't have a session, handle the auth-status cookie
    if (!session) {
      // If the user has the auth-status cookie but no valid session,
      // they need to go through the proper authentication flow
      if (PROTECTED_ROUTES.some(route => path.startsWith(route))) {
        console.log('Middleware: User has auth-status cookie but no valid session, redirecting to login');
        const redirectUrl = new URL('/login', req.url);
        redirectUrl.searchParams.set('redirect', path);
        return NextResponse.redirect(redirectUrl);
      }
      
      if (AUTH_ONLY_ROUTES.some(route => path.startsWith(route))) {
        // For checkout, redirect to pre-checkout to create an account first
        if (path.startsWith('/checkout') && !path.includes('/success')) {
          console.log('Middleware: User has auth-status cookie but no valid session, redirecting to pre-checkout');
          const redirectUrl = new URL('/pre-checkout', req.url);
          // Preserve any product parameters
          const products = searchParams.get('products');
          if (products) {
            redirectUrl.searchParams.set('products', products);
          }
          return NextResponse.redirect(redirectUrl);
        }
        
        // For other auth-only routes, redirect to login
        console.log('Middleware: User has auth-status cookie but no valid session, redirecting to login');
        const redirectUrl = new URL('/login', req.url);
        redirectUrl.searchParams.set('redirect', path);
        return NextResponse.redirect(redirectUrl);
      }
    }
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
    
    // Check if user has entitlements
    try {
      const { data: entitlements, error } = await supabase
        .from('user_entitlements')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('is_active', true);
      
      if (error) {
        console.error('Middleware: Error checking entitlements:', error);
      } else if (entitlements && entitlements.length > 0) {
        console.log(`Middleware: User has ${entitlements.length} active entitlements`);
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } else {
        console.log('Middleware: User has no entitlements, checking for recent purchases');
        
        // Check if user has a recent purchase that might not have entitlements yet
        const { data: purchases, error: purchasesError } = await supabase
          .from('purchases')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (purchasesError) {
          console.error('Middleware: Error checking purchases:', purchasesError);
        } else if (purchases && purchases.length > 0) {
          // User has a completed purchase, try to create entitlements
          console.log('Middleware: User has a completed purchase, creating entitlements');
          
          const result = await createEntitlementsFromPurchase(purchases[0], supabase);
          
          if (result.entitlements && result.entitlements.length > 0) {
            console.log('Middleware: Successfully created entitlements from purchase');
            return NextResponse.next({
              request: {
                headers: requestHeaders,
              },
            });
          }
        }
        
        // If we get here, user has no entitlements and no recent purchases
        console.log('User has no active entitlements or recent purchases, redirecting to checkout');
        return NextResponse.redirect(new URL('/checkout', req.url));
      }
    } catch (error) {
      console.error('Middleware: Error checking entitlements:', error);
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