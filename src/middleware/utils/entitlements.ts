/**
 * Entitlements Module
 * Provides functions for managing user entitlements
 */

import { logger } from '../logger';

/**
 * Helper function to create entitlements from a purchase
 * Creates appropriate entitlements based on the purchase data
 * 
 * @param purchase - The purchase object
 * @param supabaseClient - The Supabase client
 * @returns An object containing the created entitlements or an error
 */
export async function createEntitlementsFromPurchase(
  purchase: any, 
  supabaseClient: any,
  productIds: Record<string, string>
): Promise<{ entitlements?: any[], error?: any }> {
  logger.info('Creating entitlements from purchase:', {
    purchaseId: purchase.id,
    userId: purchase.user_id,
    hasProductId: !!purchase.product_id,
    hasMetadata: !!purchase.metadata
  });

  if (!purchase || !purchase.user_id) {
    logger.error('Cannot create entitlements: Invalid purchase data');
    return { error: 'Invalid purchase data' };
  }

  const userId = purchase.user_id;
  const now = new Date().toISOString();
  const entitlements = [];

  try {
    // Check if this is a legacy purchase with product_id field
    if (purchase.product_id) {
      logger.info('Processing legacy purchase with product_id:', purchase.product_id);
      // Convert legacy product ID to UUID if needed
      let productId = purchase.product_id;
      
      // Create the entitlement
      logger.info('Creating entitlement for product:', productId);
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
        logger.error('Error creating entitlement:', entitlementError);
      } else {
        logger.info('Created entitlement:', entitlement);
        entitlements.push(entitlement);
      }
    } else {
      // If no product_id, use the metadata or default to main product
      logger.info('No product_id found, using metadata or default');
      
      // Create entitlement for the main product (PMU Profit System)
      logger.info('Creating entitlement for main product:', productIds['pmu-profit-system']);
      const { data: mainEntitlement, error: mainError } = await supabaseClient
        .from('user_entitlements')
        .insert({
          user_id: userId,
          product_id: productIds['pmu-profit-system'],
          source_type: 'purchase',
          source_id: purchase.id,
          valid_from: now,
          is_active: true
        })
        .select()
        .single();

      if (mainError) {
        logger.error('Error creating main product entitlement:', mainError);
      } else {
        logger.info('Created main product entitlement:', mainEntitlement);
        entitlements.push(mainEntitlement);
      }

      // Check metadata for add-ons
      const metadata = purchase.metadata || {};
      logger.info('Checking metadata for add-ons:', metadata);
      
      // Create entitlement for Ad Generator if included
      if (metadata.include_ad_generator === true || metadata.includeAdGenerator === 'true') {
        logger.info('Creating entitlement for Ad Generator');
        const { data: adEntitlement, error: adError } = await supabaseClient
          .from('user_entitlements')
          .insert({
            user_id: userId,
            product_id: productIds['pmu-ad-generator'],
            source_type: 'purchase',
            source_id: purchase.id,
            valid_from: now,
            is_active: true
          })
          .select()
          .single();

        if (adError) {
          logger.error('Error creating ad generator entitlement:', adError);
        } else {
          logger.info('Created ad generator entitlement:', adEntitlement);
          entitlements.push(adEntitlement);
        }
      }

      // Create entitlement for Blueprint if included
      if (metadata.include_blueprint === true || metadata.includeBlueprint === 'true') {
        logger.info('Creating entitlement for Blueprint');
        const { data: blueprintEntitlement, error: blueprintError } = await supabaseClient
          .from('user_entitlements')
          .insert({
            user_id: userId,
            product_id: productIds['consultation-success-blueprint'],
            source_type: 'purchase',
            source_id: purchase.id,
            valid_from: now,
            is_active: true
          })
          .select()
          .single();

        if (blueprintError) {
          logger.error('Error creating blueprint entitlement:', blueprintError);
        } else {
          logger.info('Created blueprint entitlement:', blueprintEntitlement);
          entitlements.push(blueprintEntitlement);
        }
      }
    }

    // Update purchase status to indicate entitlements were created
    logger.info('Updating purchase status to completed');
    const { error: updateError } = await supabaseClient
      .from('purchases')
      .update({ 
        status: 'completed', 
        entitlements_created: true,
        updated_at: now
      })
      .eq('id', purchase.id);
    
    if (updateError) {
      logger.error('Error updating purchase status:', updateError);
    }

    logger.info(`Created ${entitlements.length} entitlements for user ${userId}`);
    return { entitlements };
  } catch (error) {
    logger.error('Error creating entitlements:', error);
    return { error };
  }
} 