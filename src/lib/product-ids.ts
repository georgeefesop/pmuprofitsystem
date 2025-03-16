/**
 * Product IDs for the PMU Profit System
 * 
 * This module exports product IDs as constants to ensure consistent usage
 * across the application. Use these constants instead of hardcoding product IDs
 * to make the code more maintainable and less error-prone.
 */

// UUID format product IDs (used in user_entitlements table)
export const PRODUCT_IDS = {
  // Main product
  'pmu-profit-system': '4a554622-d759-42b7-b830-79c9136d2f96',
  
  // Add-ons
  'pmu-ad-generator': '4ba5c775-a8e4-449e-828f-19f938e3710b',
  'consultation-success-blueprint': 'e5749058-500d-4333-8938-c8a19b16cd65',
  'pricing-template': 'f2a8c6b1-9d3e-4c7f-b5a2-1e8d7f9b6c3a',
  
  // Future products can be added here
} as const;

// String format product IDs (used in legacy purchases table)
export const LEGACY_PRODUCT_IDS = {
  'pmu-profit-system': 'pmu-profit-system',
  'pmu-ad-generator': 'pmu-ad-generator',
  'consultation-success-blueprint': 'consultation-success-blueprint',
  'pricing-template': 'pricing-template',
} as const;

// Type for product IDs to enable type checking
export type ProductId = keyof typeof PRODUCT_IDS;
export type LegacyProductId = keyof typeof LEGACY_PRODUCT_IDS;

// Reverse mapping from UUID to legacy ID
export const UUID_TO_LEGACY_PRODUCT_IDS = Object.entries(PRODUCT_IDS).reduce(
  (acc, [legacyId, uuidId]) => {
    acc[uuidId] = legacyId;
    return acc;
  },
  {} as Record<string, string>
);

/**
 * Check if a product ID is a valid UUID product ID
 * @param id The product ID to check
 * @returns True if the ID is a valid UUID product ID
 */
export function isValidUuidProductId(id: string): boolean {
  return Object.values(PRODUCT_IDS).includes(id as any);
}

/**
 * Check if a product ID is a valid legacy product ID
 * @param id The product ID to check
 * @returns True if the ID is a valid legacy product ID
 */
export function isValidLegacyProductId(id: string): boolean {
  return id in LEGACY_PRODUCT_IDS;
}

/**
 * Get all UUID product IDs
 * @returns Array of all UUID product IDs
 */
export function getAllUuidProductIds(): string[] {
  return Object.values(PRODUCT_IDS);
}

/**
 * Convert a legacy product ID to a UUID product ID
 * @param legacyId The legacy product ID to convert
 * @returns The corresponding UUID product ID, or null if not found
 */
export function legacyToUuidProductId(legacyId: string): string | null {
  if (!isValidLegacyProductId(legacyId)) {
    return null;
  }
  return PRODUCT_IDS[legacyId as ProductId];
}

/**
 * Convert a UUID product ID to a legacy product ID
 * @param uuidId The UUID product ID to convert
 * @returns The corresponding legacy product ID, or null if not found
 */
export function uuidToLegacyProductId(uuidId: string): string | null {
  if (!isValidUuidProductId(uuidId)) {
    return null;
  }
  return UUID_TO_LEGACY_PRODUCT_IDS[uuidId] || null;
}

/**
 * Normalize a product ID to ensure it's in UUID format
 * @param productId The product ID to normalize (can be legacy or UUID)
 * @returns The normalized UUID product ID, or the original ID if not recognized
 */
export function normalizeProductId(productId: string): string {
  // If it's already a UUID product ID, return it
  if (isValidUuidProductId(productId)) {
    return productId;
  }
  
  // If it's a legacy product ID, convert it to UUID
  if (isValidLegacyProductId(productId)) {
    const uuidId = legacyToUuidProductId(productId);
    if (uuidId) {
      return uuidId;
    }
  }
  
  // If we can't recognize it, return the original ID
  console.warn(`Unrecognized product ID format: ${productId}`);
  return productId;
}

/**
 * Get the display name for a product ID
 * @param productId The product ID (can be legacy or UUID)
 * @returns The display name for the product, or null if not found
 */
export function getProductDisplayName(productId: string): string | null {
  // If it's a UUID product ID, convert it to legacy first
  if (isValidUuidProductId(productId)) {
    const legacyId = uuidToLegacyProductId(productId);
    if (legacyId) {
      return formatProductName(legacyId);
    }
  }
  
  // If it's a legacy product ID, format it directly
  if (isValidLegacyProductId(productId)) {
    return formatProductName(productId);
  }
  
  // If we can't recognize it, return null
  return null;
}

/**
 * Format a legacy product ID as a display name
 * @param legacyId The legacy product ID to format
 * @returns The formatted display name
 */
function formatProductName(legacyId: string): string {
  return legacyId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Product metadata for additional information
export const PRODUCT_METADATA = {
  'pmu-profit-system': {
    name: 'PMU Profit System',
    description: 'Complete course for PMU business growth',
    type: 'course',
  },
  'pmu-ad-generator': {
    name: 'PMU Ad Generator',
    description: 'AI-powered ad copy generator for PMU businesses',
    type: 'tool',
  },
  'consultation-success-blueprint': {
    name: 'Consultation Success Blueprint',
    description: 'Guide for successful PMU consultations',
    type: 'resource',
  },
  'pricing-template': {
    name: 'Premium Pricing Template',
    description: 'Create professional, conversion-optimized pricing packages in minutes',
    type: 'resource',
  },
} as const;

/**
 * Gets product metadata by product ID
 * @param productId The product ID (either legacy or UUID format)
 * @returns The product metadata, or undefined if not found
 */
export function getProductMetadata(productId: string) {
  // If it's a UUID, convert to legacy ID first
  const legacyId = Object.entries(PRODUCT_IDS).find(([_, value]) => value === productId)?.[0];
  
  if (legacyId && legacyId in PRODUCT_METADATA) {
    return PRODUCT_METADATA[legacyId as ProductId];
  }
  
  // If it's already a legacy ID
  if (productId in PRODUCT_METADATA) {
    return PRODUCT_METADATA[productId as ProductId];
  }
  
  return undefined;
} 