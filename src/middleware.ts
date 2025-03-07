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
    path.startsWith('/another-test');
  
  // Block access to test pages in production unless explicitly enabled
  if (isTestPage && !allowTestPage()) {
    return new NextResponse('Test and diagnostic pages are disabled in production', { status: 404 });
  }
  
  // Define protected routes that require authentication
  const isProtectedRoute = path.startsWith('/dashboard');
  
  // Check if coming from a successful purchase
  const { searchParams } = new URL(req.url);
  const purchaseSuccess = searchParams.get('purchase_success');
  const sessionId = searchParams.get('session_id');
  
  console.log(`Middleware: Path=${path}, purchaseSuccess=${purchaseSuccess}, sessionId=${sessionId}`);
  
  // Get the session from Supabase auth
  const { data: { session } } = await supabase.auth.getSession();
  
  // Explicitly refresh the auth token
  try {
    // This will refresh the token if needed and update cookies
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Middleware auth check:', user ? 'User authenticated' : 'No user found');
  } catch (error) {
    console.error('Error refreshing auth token in middleware:', error);
  }
  
  // IMPORTANT: Check if the user is coming from a successful purchase
  // If so, we need to handle this case specially
  if (isProtectedRoute && purchaseSuccess === 'true' && sessionId) {
    console.log('Middleware: User coming from successful purchase with session ID:', sessionId);
    
    // If the user is authenticated, set the user ID in the request context
    if (session?.user?.id) {
      console.log('Middleware: User is authenticated, setting user ID in request context');
      res.headers.set('x-user-id', session.user.id);

      // Set the user ID in the request context for Supabase RLS policies
      await supabase.rpc('set_claim', {
        uid: session.user.id,
        claim: 'sub',
        value: session.user.id
      });
      
      // Check if the user has entitlements for the main product
      try {
        console.log('Middleware: Checking entitlements for authenticated user with purchase_success=true');
        const { data: entitlements, error: entitlementsError } = await supabase
          .from('user_entitlements')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('is_active', true);
        
        if (entitlementsError) {
          console.error('Error checking entitlements:', entitlementsError);
          // If there's an error, allow access to avoid blocking legitimate users
          return res;
        }
        
        // If the user doesn't have any active entitlements, check for recent purchases
        if (!entitlements || entitlements.length === 0) {
          console.log('Middleware: User has no entitlements, checking for recent purchases');
          
          // Check for recent purchases that might not have entitlements yet
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
            return res;
          }
          
          // If we have a session ID, try to create entitlements from it
          if (sessionId) {
            console.log('Middleware: Attempting to create entitlements from session ID:', sessionId);
            
            // Try to verify the purchase and create entitlements
            try {
              // Make a request to the verify-purchase API
              const verifyResponse = await fetch(`${req.nextUrl.origin}/api/verify-purchase?session_id=${sessionId}`);
              const verifyResult = await verifyResponse.json();
              
              if (verifyResult.success && verifyResult.verified) {
                console.log('Middleware: Purchase verified successfully');
                
                // If the purchase is verified, allow access to the dashboard
                return res;
              }
            } catch (verifyError) {
              console.error('Error verifying purchase in middleware:', verifyError);
            }
          }
        } else {
          console.log('Middleware: User has entitlements, allowing access to dashboard');
          return res;
        }
      } catch (error) {
        console.error('Error in middleware entitlement check:', error);
        // If there's an error, allow access to avoid blocking legitimate users
        return res;
      }
    } else {
      // User is not authenticated but has purchase_success=true and session_id
      console.log('Middleware: User not authenticated but has purchase_success=true and session_id');
      
      // Store the original URL for redirection after login
      const url = new URL('/login', req.url);
      url.searchParams.set('redirect', req.nextUrl.pathname + req.nextUrl.search);
      
      console.log('Middleware: Redirecting to login with redirect URL:', url.toString());
      return NextResponse.redirect(url);
    }
  }
  
  // If the route is protected and the user is not authenticated,
  // redirect to the login page with the original URL as a redirect parameter
  if (isProtectedRoute && !session) {
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
  
  // If the user is authenticated and trying to access the dashboard,
  // check if they have entitlements for the main product
  if (isProtectedRoute && session) {
    console.log('Middleware: User authenticated, checking entitlements');
    try {
      // Check if the user has entitlements for the main product
      const { data: entitlements, error: entitlementsError } = await supabase
        .from('user_entitlements')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('is_active', true);
      
      if (entitlementsError) {
        console.error('Error checking entitlements:', entitlementsError);
        // If there's an error, allow access to avoid blocking legitimate users
        return res;
      }
      
      // If the user doesn't have any active entitlements, check for recent purchases
      if (!entitlements || entitlements.length === 0) {
        console.log('Middleware: User has no entitlements, checking for recent purchases');
        
        // Check for recent purchases that might not have entitlements yet
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
          return res;
        }
        
        // If the user is coming from a successful purchase, allow access
        if (purchaseSuccess === 'true' && sessionId) {
          console.log('User coming from successful purchase, allowing access to dashboard');
          return res;
        }
        
        console.log('User has no active entitlements or recent purchases, redirecting to checkout');
        return NextResponse.redirect(new URL('/checkout', req.url));
      } else {
        console.log('Middleware: User has entitlements, allowing access to dashboard');
      }
    } catch (error) {
      console.error('Error in middleware entitlement check:', error);
      // If there's an error, allow access to avoid blocking legitimate users
    }
  }
  
  // If the user is authenticated, set the user ID in the request context
  if (session?.user?.id) {
    // Set the user ID in a custom header that our API routes can use
    res.headers.set('x-user-id', session.user.id);

    // Set the user ID in the request context for Supabase RLS policies
    // This will be used by the auth.uid() function in RLS policies
    await supabase.rpc('set_claim', {
      uid: session.user.id,
      claim: 'sub',
      value: session.user.id
    });
  }
  
  // Continue with the request if authenticated or not a protected route
  return res;
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    // Match all dashboard routes
    '/dashboard/:path*',
    '/api/:path*',
  ],
}; 