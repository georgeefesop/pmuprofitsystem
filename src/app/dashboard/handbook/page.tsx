'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { DashboardLayout } from '@/components/DashboardLayout';

export default function PMUHandbook() {
  // PMU Handbook Google Doc URL
  const handbookUrl = "https://docs.google.com/document/d/11nnhptC6VBmk3vg33gt6krhcdOW2xqeDXUJAUWTsRGk/edit?usp=sharing";

  return (
    <DashboardLayout title="PMU Business Handbook">
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Your PMU Business Handbook</h2>
            <p className="text-gray-600">
              A comprehensive guide to building and growing your PMU business
            </p>
          </div>
          <a 
            href={handbookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open Google Doc
          </a>
        </div>
        
        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-semibold mb-4">What's Inside:</h3>
          <ul className="space-y-3">
            <li className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Business setup and legal requirements for PMU artists</span>
            </li>
            <li className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Studio setup and equipment recommendations</span>
            </li>
            <li className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Client management systems and workflows</span>
            </li>
            <li className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Pricing strategies and financial management</span>
            </li>
            <li className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Marketing and client acquisition techniques</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="bg-purple-50 rounded-lg shadow p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Why Business Systems Matter</h3>
        <p className="text-gray-700 mb-4">
          Having proper business systems in place is crucial for the long-term success of your PMU practice. Without systems, you'll find yourself constantly putting out fires, dealing with scheduling conflicts, and struggling to maintain consistent client experiences.
        </p>
        <p className="text-gray-700 mb-4">
          The handbook provides you with proven templates and workflows that you can implement immediately. These systems will help you save time, reduce stress, and create a more professional experience for your clients.
        </p>
        <p className="text-gray-700">
          By following the guidelines in this handbook, you'll be able to focus more on your artistry and less on administrative tasks. This leads to better results for your clients and more satisfaction in your work.
        </p>
        
        <div className="mt-6 pt-6 border-t border-purple-200">
          <p className="text-sm text-purple-700">
            <strong>Pro Tip:</strong> Implement one system at a time rather than trying to overhaul your entire business at once. Start with the area that's causing you the most stress or limiting your growth.
          </p>
        </div>
      </div>
      
      {/* Google Doc Embed */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Preview Document</h3>
        <div className="relative w-full" style={{ paddingBottom: '75%' }}>
          <iframe 
            src={`${handbookUrl.replace('/edit', '/preview')}`}
            className="absolute top-0 left-0 w-full h-full border-0 rounded-lg"
            title="PMU Business Handbook"
            allowFullScreen
          ></iframe>
        </div>
        <div className="mt-4 text-center">
          <a 
            href={handbookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open in Google Docs
          </a>
        </div>
      </div>
    </DashboardLayout>
  );
} 