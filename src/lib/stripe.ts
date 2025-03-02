import Stripe from 'stripe';

// Helper function to safely get the Stripe key
function getStripeKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  
  if (!key) {
    console.error('STRIPE_SECRET_KEY is not set in environment variables');
    throw new Error('Stripe API key is missing');
  }
  
  // Check if the key has any whitespace or line breaks
  if (key.trim() !== key) {
    console.warn('STRIPE_SECRET_KEY contains whitespace, trimming');
    return key.trim();
  }
  
  return key;
}

// Initialize Stripe with improved configuration
export const stripe = new Stripe(getStripeKey(), {
  apiVersion: '2022-11-15' as any,
  timeout: 60000, // 60 seconds timeout (increased from 30)
  maxNetworkRetries: 5, // Increased from 3
  httpAgent: undefined, // Let Stripe handle the HTTP agent
});

// Helper function to safely execute Stripe API calls with custom retry logic
export async function safeStripeOperation<T>(operation: () => Promise<T>, maxRetries = 5): Promise<T> {
  let lastError: any;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      retryCount++;
      
      // Log the retry attempt
      console.warn(`Stripe operation failed (attempt ${retryCount}/${maxRetries}):`, error.message);
      
      // Check if the error is retryable
      if (
        error.type === 'StripeConnectionError' || 
        error.type === 'StripeAPIError' ||
        error.type === 'StripeTimeoutError' ||
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND'
      ) {
        // Exponential backoff with jitter
        const delay = Math.min(Math.pow(2, retryCount) * 300 + Math.random() * 200, 5000);
        console.log(`Retrying after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Non-retryable error, throw immediately
      throw error;
    }
  }
  
  // If we've exhausted all retries, throw the last error
  throw lastError;
}

// Helper function to check if Stripe is properly configured
export async function checkStripeConfiguration(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    // Check if the API key is set
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      return {
        success: false,
        message: 'Stripe API key is not set',
        details: {
          recommendation: 'Set the STRIPE_SECRET_KEY environment variable'
        }
      };
    }
    
    // Check if the key format looks correct
    if (!key.startsWith('sk_')) {
      return {
        success: false,
        message: 'Stripe API key format appears to be invalid',
        details: {
          keyPrefix: key.substring(0, 3),
          recommendation: 'Ensure you are using a valid Stripe secret key that starts with sk_'
        }
      };
    }
    
    // Test the connection
    const balance = await safeStripeOperation(() => stripe.balance.retrieve());
    
    return {
      success: true,
      message: 'Stripe is properly configured',
      details: {
        balanceAvailable: balance.available,
        balancePending: balance.pending
      }
    };
  } catch (error) {
    console.error('Error checking Stripe configuration:', error);
    
    let errorMessage = 'Failed to connect to Stripe';
    let errorType = 'unknown';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // If it's a Stripe error, provide more details
      if ('type' in error) {
        const stripeError = error as any;
        errorType = stripeError.type;
        errorMessage = `Stripe error (${stripeError.type}): ${stripeError.message}`;
      }
    }
    
    return {
      success: false,
      message: errorMessage,
      details: {
        errorType,
        recommendation: 'Check your Stripe API keys and network connectivity'
      }
    };
  }
} 