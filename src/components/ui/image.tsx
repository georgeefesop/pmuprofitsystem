'use client';

import React, { useState } from 'react';
import NextImage, { ImageProps as NextImageProps } from 'next/image';
import { getImageUrl, isAllowedImageDomain } from '@/lib/utils';
import { handleImageError, ErrorType, captureError } from '@/lib/error-handler';

interface SafeImageProps extends Omit<NextImageProps, 'onError'> {
  fallbackSrc?: string;
}

/**
 * A wrapper around Next.js Image component that handles external domains gracefully
 * It checks if the image domain is allowed, and if not, it uses a placeholder
 * It also provides fallback handling for image loading errors
 */
export function SafeImage({
  src,
  alt,
  fallbackSrc = 'https://placehold.co/600x400?text=Image+Not+Available',
  ...props
}: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState<string | typeof src>(() => {
    try {
      return typeof src === 'string' ? getImageUrl(src) : src;
    } catch (error) {
      // Log the error but don't crash
      captureError(
        `Error processing image source: ${error instanceof Error ? error.message : String(error)}`,
        ErrorType.IMAGE,
        'SafeImage'
      );
      return fallbackSrc;
    }
  });
  
  const [error, setError] = useState(false);

  // Handle image loading error
  const handleError = () => {
    if (!error) {
      setError(true);
      
      // Log the error
      if (typeof src === 'string') {
        handleImageError(src, new Error('Image failed to load'));
      } else {
        handleImageError('Unknown image source', new Error('Image failed to load'));
      }
      
      setImgSrc(fallbackSrc);
    }
  };

  return (
    <NextImage
      {...props}
      src={error ? fallbackSrc : imgSrc}
      alt={alt}
      onError={handleError}
    />
  );
}

export default SafeImage; 