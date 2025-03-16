/**
 * Utility functions for managing purchases
 */

import { getServiceSupabase } from './supabase';

/**
 * Updates the status of a purchase by payment intent ID
 * @param paymentIntentId The Stripe payment intent ID
 * @param status The new status to set (e.g., 'completed', 'pending', 'failed')
 * @returns Object with success status and message
 */
export async function updatePurchaseStatus(
  paymentIntentId: string,
  status: 'pending' | 'completed' | 'failed' | 'refunded'
): Promise<{
  success: boolean;
  message: string;
  purchase?: any;
}> {
  try {
    console.log(`[purchases] Updating purchase status for payment intent ${paymentIntentId} to ${status}`);
    
    // Initialize Supabase client
    const supabase = getServiceSupabase();
    
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client');
    }
    
    // Find the purchase by payment intent ID
    const { data: purchases, error: findError } = await supabase
      .from('purchases')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntentId);
      
    if (findError) {
      console.error('[purchases] Error finding purchase:', findError);
      throw new Error(`Failed to find purchase: ${findError.message}`);
    }
    
    if (!purchases || purchases.length === 0) {
      console.error('[purchases] No purchase found for payment intent:', paymentIntentId);
      return {
        success: false,
        message: `No purchase found for payment intent: ${paymentIntentId}`
      };
    }
    
    console.log(`[purchases] Found ${purchases.length} purchases for payment intent ${paymentIntentId}`);
    
    // Update all purchases with this payment intent ID
    const { data: updatedPurchases, error: updateError } = await supabase
      .from('purchases')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', paymentIntentId)
      .select();
      
    if (updateError) {
      console.error('[purchases] Error updating purchase status:', updateError);
      throw new Error(`Failed to update purchase status: ${updateError.message}`);
    }
    
    console.log(`[purchases] Updated ${updatedPurchases?.length || 0} purchases to status ${status}`);
    
    return {
      success: true,
      message: `Purchase status updated to ${status}`,
      purchase: updatedPurchases?.[0]
    };
  } catch (error) {
    console.error('[purchases] Error updating purchase status:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error updating purchase status'
    };
  }
}

/**
 * Checks if a purchase exists for a given payment intent ID
 * @param paymentIntentId The Stripe payment intent ID
 * @returns Object with success status and purchase data if found
 */
export async function findPurchaseByPaymentIntent(
  paymentIntentId: string
): Promise<{
  success: boolean;
  message: string;
  purchase?: any;
  exists: boolean;
}> {
  try {
    console.log(`[purchases] Finding purchase for payment intent ${paymentIntentId}`);
    
    // Initialize Supabase client
    const supabase = getServiceSupabase();
    
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client');
    }
    
    // Find the purchase by payment intent ID
    const { data: purchases, error: findError } = await supabase
      .from('purchases')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntentId);
      
    if (findError) {
      console.error('[purchases] Error finding purchase:', findError);
      throw new Error(`Failed to find purchase: ${findError.message}`);
    }
    
    if (!purchases || purchases.length === 0) {
      console.log('[purchases] No purchase found for payment intent:', paymentIntentId);
      return {
        success: true,
        message: `No purchase found for payment intent: ${paymentIntentId}`,
        exists: false
      };
    }
    
    console.log(`[purchases] Found purchase for payment intent ${paymentIntentId}:`, purchases[0].id);
    
    return {
      success: true,
      message: `Found purchase for payment intent: ${paymentIntentId}`,
      purchase: purchases[0],
      exists: true
    };
  } catch (error) {
    console.error('[purchases] Error finding purchase:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error finding purchase',
      exists: false
    };
  }
} 