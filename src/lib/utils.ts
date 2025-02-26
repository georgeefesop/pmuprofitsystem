import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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