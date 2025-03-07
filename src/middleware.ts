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

// Enhanced logging utility for middleware
interface AuthLog {
  timestamp: string;
  userId?: string;
  event: string;
  details: any;
  path: string;
  success: boolean;
}

// In-memory log storage (will persist between requests but not server restarts)
const authLogs: AuthLog[] = [];
const MAX_LOGS = 100;

function addAuthLog(log: AuthLog) {
  // Add log to the beginning of the array
  authLogs.unshift(log);
  
  // Keep only the last MAX_LOGS entries
  if (authLogs.length > MAX_LOGS) {
    authLogs.pop();
  }
  
  // Also log to console for immediate visibility
  console.log(`AUTH_LOG: [${log.timestamp}] ${log.event} - Success: ${log.success} - Path: ${log.path} ${log.userId ? `- User: ${log.userId}` : ''}`);
  if (log.details) {
    console.log('AUTH_LOG_DETAILS:', JSON.stringify(log.details, null, 2));
  }
}

function createAuthLog(req: NextRequest, event: string, success: boolean, userId?: string, details?: any) {
  return {
    timestamp: new Date().toISOString(),
    userId,
    event,
    details,
    path: req.nextUrl.pathname + req.nextUrl.search,
    success
  };
}

// Export logs for API access
export function getAuthLogs() {
  return [...authLogs];
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
    path.startsWith('/auth-logs') ||  // Add new auth logs page
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
  
  // Log request details
  addAuthLog(createAuthLog(req, 'REQUEST', true, undefined, {
    path,
    purchaseSuccess,
    sessionId,
    isProtectedRoute,
    cookies: req.headers.get('cookie') ? 'Present' : 'None',
    cookieLength: req.headers.get('cookie')?.length || 0
  }));
  
  // If it's not a protected route, continue with the request
  if (!isProtectedRoute) {
    addAuthLog(createAuthLog(req, 'UNPROTECTED_ROUTE', true, undefined, { path }));
    return res;
  }
  
  // Enhanced authentication check
  addAuthLog(createAuthLog(req, 'AUTH_CHECK_START', true, undefined, { path }));
  
  // Log all cookies for debugging
  const cookieString = req.headers.get('cookie') || '';
  addAuthLog(createAuthLog(req, 'COOKIES', true, undefined, { 
    cookieString: cookieString.substring(0, 500) + (cookieString.length > 500 ? '...(truncated)' : ''),
    hasCookies: cookieString.length > 0,
    cookieCount: cookieString.split(';').length
  }));
  
  // Get the session from Supabase auth
  let { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    addAuthLog(createAuthLog(req, 'SESSION_ERROR', false, undefined, { error: sessionError.message }));
  }
  
  if (!session) {
    addAuthLog(createAuthLog(req, 'NO_SESSION', false, undefined, { 
      attemptingRefresh: true 
    }));
    
    try {
      // Try to refresh the session
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        addAuthLog(createAuthLog(req, 'REFRESH_ERROR', false, undefined, { error: refreshError.message }));
      } else if (refreshData.session) {
        addAuthLog(createAuthLog(req, 'SESSION_REFRESHED', true, refreshData.session.user.id, { 
          email: refreshData.session.user.email 
        }));
        session = refreshData.session;
      }
    } catch (refreshException) {
      addAuthLog(createAuthLog(req, 'REFRESH_EXCEPTION', false, undefined, { error: String(refreshException) }));
    }
  } else {
    addAuthLog(createAuthLog(req, 'SESSION_FOUND', true, session.user.id, { 
      email: session.user.email,
      expiresAt: session.expires_at
    }));
  }
  
  // Try to get user directly as a fallback
  if (!session) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        addAuthLog(createAuthLog(req, 'GET_USER_ERROR', false, undefined, { error: userError.message }));
      } else if (user) {
        addAuthLog(createAuthLog(req, 'USER_FOUND_NO_SESSION', true, user.id, { email: user.email }));
        
        // Check localStorage as a last resort
        const localStorageAuth = req.cookies.get('auth-status')?.value;
        const localStorageUserId = req.cookies.get('auth_user_id')?.value;
        
        addAuthLog(createAuthLog(req, 'LOCALSTORAGE_CHECK', Boolean(localStorageAuth), undefined, { 
          authStatus: localStorageAuth,
          userId: localStorageUserId
        }));
      }
    } catch (userException) {
      addAuthLog(createAuthLog(req, 'GET_USER_EXCEPTION', false, undefined, { error: String(userException) }));
    }
  }
  
  // If there's no session, redirect to login
  if (!session) {
    addAuthLog(createAuthLog(req, 'REDIRECT_TO_LOGIN', false, undefined, { 
      reason: 'No valid session found',
      redirectUrl: '/login?redirect=' + encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)
    }));
    
    const url = new URL('/login', req.url);
    url.searchParams.set('redirect', req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }
  
  // At this point, we know the user is authenticated and trying to access a protected route
  addAuthLog(createAuthLog(req, 'USER_AUTHENTICATED', true, session.user.id, { 
    email: session.user.email,
    checkingEntitlements: true
  }));
  
  try {
    // Check if the user has any active entitlements
    const { data: entitlements, error: entitlementsError } = await supabase
      .from('user_entitlements')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_active', true);
    
    if (entitlementsError) {
      addAuthLog(createAuthLog(req, 'ENTITLEMENTS_ERROR', false, session.user.id, { 
        error: entitlementsError.message 
      }));
      // If there's an error, allow access to avoid blocking legitimate users
      addAuthLog(createAuthLog(req, 'ALLOWING_DESPITE_ERROR', true, session.user.id, { 
        reason: 'Error checking entitlements, allowing access to avoid blocking legitimate users' 
      }));
      return res;
    }
    
    // If the user has active entitlements, allow access
    if (entitlements && entitlements.length > 0) {
      addAuthLog(createAuthLog(req, 'HAS_ENTITLEMENTS', true, session.user.id, { 
        entitlementCount: entitlements.length,
        entitlementIds: entitlements.map(e => e.id)
      }));
      return res;
    }
    
    // If no entitlements found, check for recent purchases as a fallback
    addAuthLog(createAuthLog(req, 'NO_ENTITLEMENTS', false, session.user.id, { 
      checkingPurchases: true 
    }));
    
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (purchasesError) {
      addAuthLog(createAuthLog(req, 'PURCHASES_ERROR', false, session.user.id, { 
        error: purchasesError.message 
      }));
      // If there's an error, allow access to avoid blocking legitimate users
      addAuthLog(createAuthLog(req, 'ALLOWING_DESPITE_ERROR', true, session.user.id, { 
        reason: 'Error checking purchases, allowing access to avoid blocking legitimate users' 
      }));
      return res;
    }
    
    // If recent purchase exists, create entitlements and allow access
    if (purchases && purchases.length > 0) {
      addAuthLog(createAuthLog(req, 'HAS_PURCHASE', true, session.user.id, { 
        purchaseId: purchases[0].id,
        creatingEntitlements: true
      }));
      
      // Create entitlements asynchronously
      createEntitlementsFromPurchase(purchases[0], supabase)
        .then(result => {
          if (result.error) {
            addAuthLog(createAuthLog(req, 'ENTITLEMENT_CREATION_ERROR', false, session.user.id, { 
              error: result.error 
            }));
          } else {
            addAuthLog(createAuthLog(req, 'ENTITLEMENTS_CREATED', true, session.user.id, { 
              entitlements: result.entitlements 
            }));
          }
        })
        .catch(error => {
          addAuthLog(createAuthLog(req, 'ENTITLEMENT_CREATION_EXCEPTION', false, session.user.id, { 
            error: String(error) 
          }));
        });
      
      // Allow access since we found a valid purchase
      addAuthLog(createAuthLog(req, 'ALLOWING_ACCESS_PURCHASE', true, session.user.id, { 
        reason: 'User has a recent purchase' 
      }));
      return res;
    }
    
    // If we get here, the user has no entitlements and no recent purchases
    addAuthLog(createAuthLog(req, 'NO_ENTITLEMENTS_NO_PURCHASES', false, session.user.id, { 
      redirectingToCheckout: true 
    }));
    return NextResponse.redirect(new URL('/checkout', req.url));
  } catch (error) {
    addAuthLog(createAuthLog(req, 'MIDDLEWARE_EXCEPTION', false, session?.user?.id, { 
      error: String(error) 
    }));
    // If there's an error, allow access to avoid blocking legitimate users
    addAuthLog(createAuthLog(req, 'ALLOWING_DESPITE_EXCEPTION', true, session?.user?.id, { 
      reason: 'Exception in middleware, allowing access to avoid blocking legitimate users' 
    }));
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