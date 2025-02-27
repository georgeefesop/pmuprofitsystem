'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Container } from '@/components/ui/container';
import SafeImage from '@/components/ui/image';

const ResultsSection = () => {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(false);

  const openLightbox = (imageSrc: string) => {
    setLightboxImage(imageSrc);
    // Reset zoom and position when opening a new image
    setZoomLevel(1);
    setDragPosition({ x: 0, y: 0 });
  };

  const closeLightbox = () => {
    setLightboxImage(null);
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(prev => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(prev => Math.max(prev - 0.5, 1));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - dragPosition.x, y: e.clientY - dragPosition.y });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setDragPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
      e.preventDefault();
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add event listeners for mouse up outside the component
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    if (lightboxImage) {
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [lightboxImage]);

  // Handle keyboard events for zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxImage) {
        if (e.key === '+' || e.key === '=') {
          setZoomLevel(prev => Math.min(prev + 0.5, 4));
        } else if (e.key === '-' || e.key === '_') {
          setZoomLevel(prev => Math.max(prev - 0.5, 1));
        } else if (e.key === 'Escape') {
          closeLightbox();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [lightboxImage]);

  return (
    <section className="section bg-gray-50" id="results">
      <Container>
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="badge-secondary mb-3 inline-block">Real Results</span>
          <h2 className="heading-2 mb-6">Transform Your Business with Our Video Training</h2>
          <p className="subtitle-1">
            See how PMU artists just like you have transformed their businesses using our step-by-step video training program.
          </p>
        </div>
        
        {/* Results cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="card group hover:translate-y-[-4px]">
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="heading-4">Before</h3>
                <span className="badge bg-red-100 text-red-800">Struggling</span>
              </div>
              <div 
                className="aspect-video relative rounded-lg overflow-hidden bg-gray-100 cursor-pointer" 
                onClick={() => openLightbox("/images/Before-2.jpg")}
              >
                <SafeImage 
                  src="/images/Before-2.jpg" 
                  alt="Calendar before" 
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/60">
                  <p className="font-medium text-gray-900">Before</p>
                  <p className="text-sm text-gray-700">Inconsistent bookings</p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>Inconsistent client flow</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>Wasting money on ineffective marketing</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>Stress about paying bills</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="card group hover:translate-y-[-4px]">
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="heading-4">After</h3>
                <span className="badge bg-green-100 text-green-800">Thriving</span>
              </div>
              <div 
                className="aspect-video relative rounded-lg overflow-hidden bg-gray-100 cursor-pointer" 
                onClick={() => openLightbox("/images/After-2.jpg")}
              >
                <SafeImage 
                  src="/images/After-2.jpg" 
                  alt="Calendar after" 
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/60">
                  <p className="font-medium text-gray-900">After</p>
                  <p className="text-sm text-gray-700">Consistent client flow</p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Fully booked calendar</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Predictable income every month</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Freedom to choose ideal clients</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Message requests showcase */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-16">
          <div className="text-center mb-8">
            <h3 className="heading-3 mb-4">From Zero Inquiries to Message Overload</h3>
            <p className="body-1 max-w-3xl mx-auto">
              Our clients consistently report being overwhelmed with message requests after implementing the strategies from our video training program.
            </p>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-xl transform rotate-1"></div>
            <div 
              className="relative rounded-xl overflow-hidden shadow-lg cursor-pointer" 
              onClick={() => openLightbox("/images/Messages-2.jpg")}
            >
              <SafeImage 
                src="/images/Messages-2.jpg" 
                alt="Message requests" 
                width={1000}
                height={500}
                className="w-full h-auto"
              />
              <div className="absolute bottom-4 right-4 bg-white/80 px-3 py-1 rounded-lg text-sm text-gray-700">
                Click to enlarge
              </div>
            </div>
            
            {/* Floating stats card */}
            <div className="absolute -bottom-6 right-8 bg-white rounded-xl shadow-lg p-4 max-w-xs">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Message Increase</p>
                  <p className="text-xl font-bold text-gray-900">+1200%</p>
                  <p className="text-xs text-gray-500">in just 14 days</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* ROI calculation */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="heading-3 mb-6">The Math Behind Your Success</h3>
              <p className="body-1 mb-6">
                With just €70 in ad spend per week, you could generate up to €2,640 in potential revenue. Here's how:
              </p>
              
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold mr-3 flex-shrink-0">1</div>
                  <div>
                    <p className="font-medium">€10/day reaches ~15,000 people weekly</p>
                    <p className="text-sm text-gray-600">Targeted Facebook & Instagram ads</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold mr-3 flex-shrink-0">2</div>
                  <div>
                    <p className="font-medium">If only 0.2% of those people reach out (30 people)</p>
                    <p className="text-sm text-gray-600">Send messages inquiring about services</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold mr-3 flex-shrink-0">3</div>
                  <div>
                    <p className="font-medium">If half turn into consultations (15 people)</p>
                    <p className="text-sm text-gray-600">Book a consultation call with you</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold mr-3 flex-shrink-0">4</div>
                  <div>
                    <p className="font-medium">If you convert 2 out of 3 consultations (10 clients)</p>
                    <p className="text-sm text-gray-600">Each worth €330 (initial + touch-up)</p>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h4 className="heading-4 mb-6 text-center">Your Weekly ROI</h4>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="font-medium">Ad Spend</span>
                  <span className="text-xl font-bold text-gray-400">€70</span>
                </div>
                
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <div>
                    <span className="font-medium">Potential New Clients</span>
                    <span className="text-sm text-gray-500 block">10 clients × €330 each</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">€3,300</span>
                </div>
                
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="font-medium">Net Profit</span>
                  <span className="text-2xl font-bold text-green-600">€3,230</span>
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  <span className="font-medium">Return on Investment</span>
                  <span className="text-2xl font-bold gradient-text">4,614%</span>
                </div>
              </div>
              
              <div className="mt-8 p-4 bg-purple-50 rounded-lg">
                <p className="text-xs text-center text-purple-800">
                  <strong>Note:</strong> Results may vary based on your location, pricing, and execution. These are conservative estimates based on our clients' experiences.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* Enhanced Lightbox with zoom functionality */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <div className="relative w-full max-w-7xl max-h-[90vh]">
            {/* Close button */}
            <button 
              className="absolute -top-12 right-0 text-white hover:text-purple-300 transition-colors p-2 rounded-full bg-black/40 backdrop-blur-sm"
              onClick={closeLightbox}
              aria-label="Close lightbox"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Image */}
            <div className="relative overflow-hidden rounded-lg">
              <Image 
                src={lightboxImage} 
                alt="Enlarged view" 
                width={1200} 
                height={800}
                className={`w-full h-auto object-contain transition-transform duration-300 ${zoom ? 'scale-150' : 'scale-100'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setZoom(!zoom);
                }}
              />
            </div>
            
            {/* Zoom button */}
            <button 
              className="absolute bottom-4 right-4 text-white hover:text-purple-300 transition-colors p-2 rounded-full bg-black/40 backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                setZoom(!zoom);
              }}
              aria-label={zoom ? "Zoom out" : "Zoom in"}
            >
              {zoom ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default ResultsSection; 