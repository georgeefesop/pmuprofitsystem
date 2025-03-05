'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import SafeImage from '@/components/ui/image';
import { motion } from 'framer-motion';

export default function HeroSection() {
  // Add console logging for testing
  useEffect(() => {
    console.log('HeroSection mounted - Testing console.log');
    console.info('This is an info message from HeroSection');
    console.debug('This is a debug message from HeroSection');
    
    // Log an object to test object formatting
    console.log('User data:', {
      name: 'Test User',
      email: 'test@example.com',
      preferences: {
        theme: 'dark',
        notifications: true
      }
    });
  }, []);

  return (
    <section className="relative pt-28 pb-32 overflow-hidden bg-gradient-to-b from-white to-purple-50/30">
      {/* Clean background without decorative elements */}
      
      <Container>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left column - Content */}
          <div className="max-w-xl">
            <div className="mb-6">
              <span className="inline-block px-3 py-1 text-sm font-medium text-purple-700 bg-purple-100 rounded-full">PMU Video Training Program</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Grow Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">PMU Business</span> to €5,000 Monthly
            </h1>
            
            <p className="text-lg text-gray-600 mb-8">
              The complete video training program with 15 in-depth lessons for PMU artists to attract high-quality clients consistently, without wasting time on ineffective marketing.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="relative">
                <Link href="/checkout" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 shadow-sm transition-colors w-full">
                  Get Started for €37
                </Link>
                <span className="absolute -bottom-6 left-0 right-0 text-xs text-gray-600 font-medium text-center">
                  <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">1-time payment</span>
                </span>
              </div>
              <Link href="#features" className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-colors">
                See How It Works
              </Link>
            </div>
            
            {/* Social proof */}
            <div className="pt-6 mt-6 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-3">Trusted by PMU artists across Europe</p>
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center overflow-hidden">
                      <SafeImage 
                        src={`https://randomuser.me/api/portraits/women/${20 + i}.jpg`} 
                        alt={`User ${i}`} 
                        width={32} 
                        height={32}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-center">
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-600">4.9/5 from 200+ artists</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column - Image */}
          <div className="relative lg:h-[450px] flex items-center justify-center">
            {/* Blob background instead of rectangle */}
            <div className="absolute inset-0 z-0">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <path fill="url(#blob-gradient)" d="M45.7,-58.2C59.9,-47.8,72.7,-33.7,77.9,-16.9C83.1,-0.1,80.8,19.4,71.2,34.1C61.6,48.8,44.7,58.6,27.1,65.9C9.5,73.2,-8.8,78,-26.8,74.2C-44.8,70.4,-62.5,58.1,-71.3,41.3C-80.1,24.5,-80,3.2,-74.1,-15.2C-68.2,-33.6,-56.5,-49.1,-42.2,-59.5C-27.9,-69.9,-14,-75.2,1.2,-76.7C16.3,-78.2,31.5,-68.7,45.7,-58.2Z" transform="translate(100 100)" />
                <defs>
                  <linearGradient id="blob-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(216, 180, 254, 0.4)" />
                    <stop offset="100%" stopColor="rgba(165, 180, 252, 0.4)" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            
            {/* Main image container - better microblading image */}
            <div className="relative z-10 rounded-2xl overflow-hidden shadow-xl w-full max-w-md mx-auto">
              <SafeImage 
                src="/images/beautiful-young-woman-going-through-microblading-treatment.jpg"
                alt="Microblading procedure" 
                width={600} 
                height={400}
                className="w-full h-[350px] object-cover object-top"
                priority
                fallbackSrc="/images/microblading-fallback.jpg"
              />
            </div>
            
            {/* Floating stats card - positioned relative to container */}
            <div className="absolute bottom-4 right-4 md:bottom-0 md:-right-4 lg:-right-6 lg:-bottom-6 bg-white rounded-xl shadow-lg p-4 z-20 w-auto max-w-[180px]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Average Growth</p>
                  <p className="text-xl font-bold text-gray-900">+327%</p>
                  <p className="text-xs text-gray-500">in client bookings</p>
                </div>
              </div>
            </div>
            
            {/* Floating message card - positioned relative to container */}
            <div className="absolute top-4 left-4 md:top-0 md:-left-4 lg:-top-6 lg:-left-6 bg-white rounded-xl shadow-lg p-4 z-20 w-auto max-w-[220px]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">New client requests</p>
                  <p className="text-xs text-gray-500">24 new messages today</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Brands/Features section */}
        <div className="mt-20 pt-10 border-t border-gray-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center transform transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-200 to-purple-400 flex items-center justify-center mx-auto mb-4 shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-800">15 Video Lessons</h3>
              <p className="text-sm text-gray-600">Step-by-step training</p>
            </div>
            <div className="text-center transform transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-200 to-purple-400 flex items-center justify-center mx-auto mb-4 shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-800">Simple Setup</h3>
              <p className="text-sm text-gray-600">Ready in 3 hours</p>
            </div>
            <div className="text-center transform transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-200 to-purple-400 flex items-center justify-center mx-auto mb-4 shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-800">Cost-Effective</h3>
              <p className="text-sm text-gray-600">Only €10/day ad budget</p>
            </div>
            <div className="text-center transform transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-200 to-purple-400 flex items-center justify-center mx-auto mb-4 shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-800">Consultation Blueprint</h3>
              <p className="text-sm text-gray-600">Convert 4 out of 5</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
} 