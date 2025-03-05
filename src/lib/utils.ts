import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Gets a secure site URL that ensures the protocol is correctly handled
 * This is important for Supabase authentication and Stripe redirects
 */
export function getSecureSiteUrl(): string {
  // Get the site URL from environment variable
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  // For production, ensure we use HTTPS
  if (siteUrl.includes('pmuprofitsystem.com') && !siteUrl.startsWith('https://')) {
    return siteUrl.replace('http://', 'https://');
  }
  
  // For localhost, we can use HTTP
  return siteUrl;
}

/**
 * Formats a price in cents to a string with currency symbol
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(price / 100);
}

/**
 * Utility function to handle external images
 * If the image is from an allowed domain, it returns the original URL
 * Otherwise, it returns a placeholder image URL
 */
export function getImageUrl(src: string): string {
  // List of allowed domains from next.config.js
  const allowedDomains = ['randomuser.me', 'images.pexels.com', 'images.unsplash.com'];
  
  try {
    const url = new URL(src);
    const hostname = url.hostname;
    
    // Check if the hostname is in the allowed domains list
    if (allowedDomains.includes(hostname)) {
      return src;
    }
    
    // If not allowed, log a warning and return a placeholder
    console.warn(`Warning: Image domain "${hostname}" is not configured in next.config.js`);
    return `https://placehold.co/600x400?text=Image+Not+Available`;
  } catch (error) {
    // If the URL is invalid or relative, return it as is
    return src;
  }
}

/**
 * Checks if an image URL is from an allowed domain
 */
export function isAllowedImageDomain(src: string): boolean {
  const allowedDomains = ['randomuser.me', 'images.pexels.com', 'images.unsplash.com'];
  
  try {
    const url = new URL(src);
    return allowedDomains.includes(url.hostname);
  } catch (error) {
    // If the URL is invalid or relative, assume it's allowed
    return true;
  }
} 