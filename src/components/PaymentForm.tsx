'use client';

import { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { StripeCardElementOptions } from '@stripe/stripe-js';

interface PaymentFormProps {
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  email: string;
  name: string;
  includeAdGenerator: boolean;
  includeBlueprint: boolean;
}

export default function PaymentForm({
  amount,
  onSuccess,
  onError,
  isLoading,
  setIsLoading,
  email,
  name,
  includeAdGenerator,
  includeBlueprint
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardError, setCardError] = useState<string | null>(null);
  const [isSecureContext, setIsSecureContext] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const MAX_RETRIES = 3;

  // Check if we're in a secure context (HTTPS) and monitor online status
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check secure context
      setIsSecureContext(window.isSecureContext);
      if (!window.isSecureContext) {
        console.warn('Not in a secure context. Payment forms require HTTPS.');
        setCardError('This payment form requires a secure connection (HTTPS). Please contact support.');
      }
      
      // Monitor online status
      const handleOnline = () => {
        setIsOnline(true);
        console.log('Network connection restored');
        if (cardError?.includes('network') || cardError?.includes('connection')) {
          setCardError('Network connection restored. You can try again.');
        }
      };
      
      const handleOffline = () => {
        setIsOnline(false);
        console.log('Network connection lost');
        setCardError('You appear to be offline. Please check your internet connection and try again.');
      };
      
      // Set initial online status
      setIsOnline(navigator.onLine);
      
      // Add event listeners
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [cardError]);

  const cardElementOptions: StripeCardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#32325d',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a',
      },
    },
    hidePostalCode: true,
    // Disable browser autofill
    disableLink: true,
  };

  // Helper function to retry fetch with exponential backoff
  const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 3) => {
    let currentRetry = 0;
    
    while (currentRetry < maxRetries) {
      try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
          const data = await response.json().catch(() => ({ error: 'Failed to parse response' }));
          throw new Error(data.error || `HTTP error ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        currentRetry++;
        console.warn(`Fetch attempt ${currentRetry}/${maxRetries} failed:`, error);
        
        if (currentRetry >= maxRetries) {
          throw error;
        }
        
        // Exponential backoff with jitter
        const delay = Math.min(Math.pow(2, currentRetry) * 300 + Math.random() * 100, 3000);
        console.log(`Retrying after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('Maximum retries exceeded');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable form submission until Stripe.js has loaded.
      setCardError('Stripe is still loading. Please try again in a moment.');
      return;
    }

    if (!isSecureContext) {
      setCardError('This payment form requires a secure connection (HTTPS). Please contact support.');
      return;
    }
    
    if (!isOnline) {
      setCardError('You appear to be offline. Please check your internet connection and try again.');
      return;
    }

    setIsLoading(true);
    setCardError(null);

    try {
      // Create a payment intent on the server with retry logic
      console.log('Creating payment intent...');
      const data = await fetchWithRetry('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          email,
          name,
          includeAdGenerator,
          includeBlueprint
        }),
      }, MAX_RETRIES);

      // Confirm the payment with the card element
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      console.log('Confirming card payment...');
      const { error, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name,
            email,
          },
        },
      });

      if (error) {
        // Check if it's a connection error that we should retry
        if (
          error.type === 'api_connection_error' || 
          error.type === 'api_error' || 
          (error as any).type === 'timeout_error'
        ) {
          if (retryCount < MAX_RETRIES) {
            console.log(`Connection error, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
            setRetryCount(prev => prev + 1);
            setIsRetrying(true);
            
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
            setIsRetrying(false);
            
            // Retry the submission
            handleSubmit(event);
            return;
          } else {
            // We've exhausted our retries
            throw new Error(`${error.message} (Request was retried ${MAX_RETRIES} times)`);
          }
        }
        
        throw new Error(error.message || 'Payment failed');
      }

      if (paymentIntent.status === 'succeeded') {
        // Reset retry count on success
        setRetryCount(0);
        onSuccess(paymentIntent.id);
      } else {
        throw new Error(`Payment status: ${paymentIntent.status}`);
      }
    } catch (error) {
      console.error('Payment error:', error);
      
      // Format error message for better user experience
      let errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      // Enhance error messages for common issues
      if (errorMessage.includes('api_connection_error') || errorMessage.includes('network')) {
        errorMessage = 'Connection error: Please check your internet connection and try again.';
      } else if (errorMessage.includes('card_declined')) {
        errorMessage = 'Your card was declined. Please try a different payment method.';
      } else if (errorMessage.includes('insufficient_funds')) {
        errorMessage = 'Your card has insufficient funds. Please try a different payment method.';
      } else if (errorMessage.includes('expired_card')) {
        errorMessage = 'Your card has expired. Please try a different payment method.';
      }
      
      setCardError(errorMessage);
      onError(errorMessage);
    } finally {
      if (!isRetrying) {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="mt-6">
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
        {!isSecureContext && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>
                <strong>Security Warning:</strong> This page is not being served over a secure connection (HTTPS). 
                Credit card information can only be collected on secure pages. Please contact the site administrator.
              </span>
            </div>
          </div>
        )}
        
        {!isOnline && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-700 text-sm">
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>
                <strong>Network Warning:</strong> You appear to be offline. 
                Please check your internet connection before attempting to make a payment.
              </span>
            </div>
          </div>
        )}
        
        <div className="mb-4">
          <div 
            className="payment-form" 
            id="payment-form" 
            data-autofill-disable="true"
          >
            <div className="p-3 border border-gray-300 rounded-lg bg-white" data-autocomplete="off">
              <CardElement options={cardElementOptions} />
            </div>
          </div>
          {cardError && (
            <div className="mt-2 text-sm text-red-600">
              {cardError}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!stripe || isLoading || !isSecureContext || !isOnline}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2.5 px-4 rounded-lg font-medium shadow-md hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {isRetrying ? `Retrying (${retryCount}/${MAX_RETRIES})...` : 'Processing Payment...'}
            </div>
          ) : (
            `Checkout`
          )}
        </button>
      </div>
      <div className="flex items-center justify-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
        <span className="text-xs text-gray-500">Payments secured by Stripe</span>
      </div>
    </div>
  );
} 