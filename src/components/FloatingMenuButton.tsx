'use client';

import React, { useState, useEffect } from 'react';

interface FloatingMenuButtonProps {
  onClick: () => void;
  isOpen?: boolean;
}

export function FloatingMenuButton({ onClick, isOpen = false }: FloatingMenuButtonProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Function to check if the browser is in fullscreen mode
  const checkFullscreen = () => {
    const fullscreenElement = 
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement;
    
    setIsFullscreen(!!fullscreenElement);
  };

  useEffect(() => {
    // Add event listeners for fullscreen changes
    document.addEventListener('fullscreenchange', checkFullscreen);
    document.addEventListener('webkitfullscreenchange', checkFullscreen);
    document.addEventListener('mozfullscreenchange', checkFullscreen);
    document.addEventListener('MSFullscreenChange', checkFullscreen);

    // Initial check
    checkFullscreen();

    // Cleanup
    return () => {
      document.removeEventListener('fullscreenchange', checkFullscreen);
      document.removeEventListener('webkitfullscreenchange', checkFullscreen);
      document.removeEventListener('mozfullscreenchange', checkFullscreen);
      document.removeEventListener('MSFullscreenChange', checkFullscreen);
    };
  }, []);

  // Don't render the button if in fullscreen mode
  if (isFullscreen) {
    return null;
  }

  return (
    <button
      id="floating-menu-button"
      className="md:hidden fixed bottom-6 left-6 z-50 w-11 h-11 rounded-full bg-purple-600 text-white shadow-lg flex items-center justify-center hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all animate-pulse-subtle"
      onClick={onClick}
      aria-label={isOpen ? "Close menu" : "Open menu"}
    >
      {isOpen ? (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M6 18L18 6M6 6l12 12" 
          />
        </svg>
      ) : (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 6h16M4 12h16M4 18h16" 
          />
        </svg>
      )}
      <span className="sr-only">{isOpen ? "Close" : "Menu"}</span>
    </button>
  );
} 