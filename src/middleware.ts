import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/middleware';
import { allowTestPage } from '@/lib/env-utils';
import { PRODUCT_IDS, legacyToUuidProductId, isValidLegacyProductId } from '@/lib/product-ids';

// Helper function to create entitlements from a purchase
async function createEntitlementsFromPurchase(purchase: any, supabase: any) {
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
      
      // If it's a legacy string ID, convert to UUID
      if (isValidLegacyProductId(productId)) {
        const uuidProductId = legacyToUuidProductId(productId);
        if (uuidProductId) {
          productId = uuidProductId;
        } else {
          console.error(`Could not convert legacy product ID: ${productId}`);
          return { error: `Invalid product ID: ${productId}` };
        }
      }

      // Create the entitlement
      const { data: entitlement, error: entitlementError } = await supabase
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
        console.error('Error creating entitlement from legacy purchase in middleware:', entitlementError);
      } else {
        console.log('Created entitlement from legacy purchase in middleware:', entitlement);
        entitlements.push(entitlement);
      }
      
      return { entitlements };
    }
    
    // Standard purchase with include_* fields
    // Always create entitlement for the main product (PMU Profit System)
    const { data: mainEntitlement, error: mainError } = await supabase
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
      console.log('Created main product entitlement from middleware:', mainEntitlement);
      entitlements.push(mainEntitlement);
    }

    // Create entitlement for Ad Generator if included
    if (purchase.include_ad_generator) {
      const { data: adEntitlement, error: adError } = await supabase
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
        console.log('Created ad generator entitlement from middleware:', adEntitlement);
        entitlements.push(adEntitlement);
      }
    }

    // Create entitlement for Blueprint if included
    if (purchase.include_blueprint) {
      const { data: blueprintEntitlement, error: blueprintError } = await supabase
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
        console.log('Created blueprint entitlement from middleware:', blueprintEntitlement);
        entitlements.push(blueprintEntitlement);
      }
    }

    // Update purchase status to indicate entitlements were created
    const { error: updateError } = await supabase
      .from('purchases')
      .update({ status: 'completed', entitlements_created: true })
      .eq('id', purchase.id);
    
    if (updateError) {
      console.error('Error updating purchase status in middleware:', updateError);
    }

    return { entitlements };
  } catch (error) {
    console.error('Error creating entitlements in middleware:', error);
    return { error };
  }
}

export async function middleware(req: NextRequest) {
  // Create Supabase client for this request
  const { supabase, response: res } = createClient(req);
  
  // Get the pathname of the request
  const path = req.nextUrl.pathname;
  
  // Check if this is a test or diagnostic page
  const isTestPage = 
    path.startsWith('/diagnostics') || 
    path.startsWith('/stripe-diagnostics') || 
    path.startsWith('/local-diagnostics') || 
    path.startsWith('/error-test') || 
    path.startsWith('/logger-test') || 
    path.startsWith('/test-auth') || 
    path.startsWith('/test-resend') || 
    path.startsWith('/test-connection') || 
    path.startsWith('/api-test') || 
    path.startsWith('/debug') ||  // Add debug pages
    path.startsWith('/another-test');
  
  // Block access to test pages in production unless explicitly enabled
  if (isTestPage && !allowTestPage()) {
    return new NextResponse('Test and diagnostic pages are disabled in production', { status: 404 });
  }
  
  // Define protected routes that require authentication
  const isProtectedRoute = path.startsWith('/dashboard');
  
  // Get URL parameters for logging purposes
  const { searchParams } = new URL(req.url);
  const purchaseSuccess = searchParams.get('purchase_success');
  const sessionId = searchParams.get('session_id');
  
  console.log(`Middleware: Path=${path}, purchaseSuccess=${purchaseSuccess}, sessionId=${sessionId}`);
  
  // If it's not a protected route, continue with the request
  if (!isProtectedRoute) {
    return res;
  }
  
  // Enhanced authentication check
  console.log('Middleware: Starting enhanced authentication check');
  
  // Log all cookies for debugging
  const cookieString = req.headers.get('cookie') || '';
  console.log('Middleware: Cookies present:', cookieString.length > 0);
  
  // Get the session from Supabase auth
  let { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('Middleware: Error getting session:', sessionError);
  }
  
  if (!session) {
    console.log('Middleware: No session found in initial check, trying to refresh token');
    
    try {
      // Try to refresh the session
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('Middleware: Error refreshing session:', refreshError);
      } else if (refreshData.session) {
        console.log('Middleware: Session refreshed successfully');
        session = refreshData.session;
      }
    } catch (refreshException) {
      console.error('Middleware: Exception during session refresh:', refreshException);
    }
    
    // Check for auth-status cookie as a fallback
    if (!session) {
      const authStatusCookie = req.cookies.get('auth-status');
      const authTokenCookie = req.cookies.get('sb-auth-token');
      
      if (authStatusCookie?.value === 'authenticated') {
        console.log('Middleware: Found auth-status cookie, attempting to use it');
        
        // Try to get user from auth token cookie
        if (authTokenCookie?.value) {
          try {
            const { data: { user }, error: userError } = await supabase.auth.getUser(authTokenCookie.value);
            
            if (userError) {
              console.error('Middleware: Error getting user from token:', userError);
            } else if (user) {
              console.log('Middleware: Found user from token:', user.id);
              
              // Create a minimal session object
              session = {
                user: user,
                access_token: authTokenCookie.value,
                refresh_token: '',
                expires_at: Date.now() + 3600 * 1000, // 1 hour from now
                expires_in: 3600,
                token_type: 'bearer'
              };
            }
          } catch (tokenError) {
            console.error('Middleware: Error processing auth token:', tokenError);
          }
        }
      }
    }

    // After checking for auth-status cookie:
    // Check for user ID in request headers as a last resort
    if (!session) {
      const userId = req.headers.get('x-user-id');
      
      if (userId) {
        console.log('Middleware: Found user ID in request headers:', userId);
        
        try {
          // Try to get user from Supabase
          const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
          
          if (userError) {
            console.error('Middleware: Error getting user by ID:', userError);
          } else if (user) {
            console.log('Middleware: Found user by ID:', user.id);
            
            // Create a minimal session object
            session = {
              user: user,
              access_token: 'header-auth-' + Date.now(),
              refresh_token: '',
              expires_at: Date.now() + 3600 * 1000, // 1 hour from now
              expires_in: 3600,
              token_type: 'bearer'
            };
          }
        } catch (userIdError) {
          console.error('Middleware: Error processing user ID:', userIdError);
        }
      }
    }
  }
  
  // If there's a session, set the user ID in the request context
  if (session?.user?.id) {
    console.log('Middleware: User authenticated:', session.user.id);
    
    // Set the user ID in a custom header that our API routes can use
    res.headers.set('x-user-id', session.user.id);

    // Set the user ID in the request context for Supabase RLS policies
    // This will be used by the auth.uid() function in RLS policies
    try {
      await supabase.rpc('set_claim', {
        uid: session.user.id,
        claim: 'sub',
        value: session.user.id
      });
      console.log('Middleware: Set claim for user:', session.user.id);
    } catch (claimError) {
      console.error('Middleware: Error setting claim:', claimError);
    }
  } else {
    console.log('Middleware: User not authenticated, redirecting to login');
    const url = new URL('/login', req.url);
    url.searchParams.set('redirect', req.nextUrl.pathname + req.nextUrl.search);
    
    // Browser error logger injection (development only)
    if (process.env.NODE_ENV === 'development') {
      const response = NextResponse.redirect(url);
      
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
  
  // Function to send errors to the server
  function sendErrorToServer(type, args) {
    try {
      const errorData = {
        type,
        timestamp: new Date().toISOString(),
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
        })
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
    }]);
  });
  
  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    sendErrorToServer('unhandledrejection', [event.reason]);
  });
  
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
    
    return NextResponse.redirect(url);
  }
  
  // At this point, we know the user is authenticated and trying to access a protected route
  console.log('Middleware: User authenticated, checking entitlements');
  
  try {
    // Check if the user has any active entitlements
    const { data: entitlements, error: entitlementsError } = await supabase
      .from('user_entitlements')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_active', true);
    
    if (entitlementsError) {
      console.error('Error checking entitlements:', entitlementsError);
      // If there's an error, allow access to avoid blocking legitimate users
      console.log('Allowing access despite entitlement check error');
      return res;
    }
    
    // If the user has active entitlements, allow access
    if (entitlements && entitlements.length > 0) {
      console.log(`Middleware: User has ${entitlements.length} active entitlements, allowing access`);
      return res;
    }
    
    // If no entitlements found, check for recent purchases as a fallback
    console.log('Middleware: User has no entitlements, checking for recent purchases');
    
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (purchasesError) {
      console.error('Error checking recent purchases:', purchasesError);
      // If there's an error, allow access to avoid blocking legitimate users
      console.log('Allowing access despite purchase check error');
      return res;
    }
    
    // If recent purchase exists, create entitlements and allow access
    if (purchases && purchases.length > 0) {
      console.log('Found recent purchase, creating entitlements');
      
      // Create entitlements asynchronously
      createEntitlementsFromPurchase(purchases[0], supabase)
        .then(result => {
          if (result.error) {
            console.error('Failed to create entitlements from purchase:', result.error);
          } else {
            console.log('Successfully created entitlements from purchase');
          }
        })
        .catch(error => {
          console.error('Error in entitlement creation process:', error);
        });
      
      // Allow access since we found a valid purchase
      console.log('Allowing access based on recent purchase');
      return res;
    }
    
    // If we get here, the user has no entitlements and no recent purchases
    console.log('User has no active entitlements or recent purchases, redirecting to checkout');
    return NextResponse.redirect(new URL('/checkout', req.url));
  } catch (error) {
    console.error('Error in middleware entitlement check:', error);
    // If there's an error, allow access to avoid blocking legitimate users
    console.log('Allowing access despite error in entitlement check process');
    return res;
  }
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    // Match all dashboard routes
    '/dashboard/:path*',
    '/api/:path*',
  ],
}; 