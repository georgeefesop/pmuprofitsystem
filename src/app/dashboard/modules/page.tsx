'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { DashboardLayout } from '@/components/DashboardLayout';

// Course module data
const modules = [
  {
    id: '1',
    title: 'Introduction to PMU Marketing',
    description: 'Learn the fundamentals of marketing for your PMU business and how to stand out in a competitive market.',
    videoId: '17Uc7DfpneaRcuyabvvEsyt9T0fpvjziY',
    thumbnail: 'https://drive.google.com/thumbnail?id=17Uc7DfpneaRcuyabvvEsyt9T0fpvjziY'
  },
  {
    id: '2',
    title: 'Understanding Your Target Market',
    description: 'Identify and understand your ideal clients to create marketing that resonates with them.',
    videoId: '1gJBqhP9JKN0XFF32O9JQNQGIKWxx1AWM',
    thumbnail: 'https://drive.google.com/thumbnail?id=1gJBqhP9JKN0XFF32O9JQNQGIKWxx1AWM'
  },
  {
    id: '3',
    title: 'Creating Your Unique Value Proposition',
    description: 'Develop a compelling value proposition that sets you apart from other PMU artists.',
    videoId: '1GA_UCUn7TBwerOklTCUNZ6w_jtrVc7dq',
    thumbnail: 'https://drive.google.com/thumbnail?id=1GA_UCUn7TBwerOklTCUNZ6w_jtrVc7dq'
  },
  {
    id: '4',
    title: 'Setting Up Meta Business Manager',
    description: 'A step-by-step guide to setting up your Meta Business Manager account for effective advertising.',
    videoId: '1FXLhxaVX0u3lJyrTMgcEuWMQpWPs82N8',
    thumbnail: 'https://drive.google.com/thumbnail?id=1FXLhxaVX0u3lJyrTMgcEuWMQpWPs82N8'
  },
  {
    id: '5',
    title: 'Crafting High-Converting Ad Copy',
    description: 'Learn how to write ad copy that resonates with your target audience and drives action.',
    videoId: '1l2T8m4C0IyJPRnjU8GtlCCuKBaEl-Lyi',
    thumbnail: 'https://drive.google.com/thumbnail?id=1l2T8m4C0IyJPRnjU8GtlCCuKBaEl-Lyi'
  },
  {
    id: '6',
    title: 'Designing Eye-Catching Visuals',
    description: 'Create stunning visuals for your ads that showcase your work and attract attention.',
    videoId: '12jOyZKPLYR4RZH3g7RX57EGCb751y9fq',
    thumbnail: 'https://drive.google.com/thumbnail?id=12jOyZKPLYR4RZH3g7RX57EGCb751y9fq'
  },
  {
    id: '7',
    title: 'Targeting the Right Audience',
    description: 'Master the art of audience targeting to reach potential clients who are most likely to book with you.',
    videoId: '1GTmc2qOQuEbgetMjMDNLUDYMjy72asX-',
    thumbnail: 'https://drive.google.com/thumbnail?id=1GTmc2qOQuEbgetMjMDNLUDYMjy72asX-'
  },
  {
    id: '8',
    title: 'Setting Up Your First Campaign',
    description: 'A step-by-step guide to creating and launching your first ad campaign.',
    videoId: '1uS5cSr2WW-b5FM9IfOR4PR5DaL9rF-do',
    thumbnail: 'https://drive.google.com/thumbnail?id=1uS5cSr2WW-b5FM9IfOR4PR5DaL9rF-do'
  },
  {
    id: '9',
    title: 'Optimizing Ad Performance',
    description: 'Learn how to monitor and optimize your ads for better results and lower costs.',
    videoId: '1jPUoVDovJALbVZGBPrzdqZK8_EFOM9Sl',
    thumbnail: 'https://drive.google.com/thumbnail?id=1jPUoVDovJALbVZGBPrzdqZK8_EFOM9Sl'
  },
  {
    id: '10',
    title: 'Handling Client Inquiries',
    description: 'Develop a system for managing and responding to client inquiries effectively.',
    videoId: '1Nk5WV9rt8qrq-xMpoas_s_s9FOKgSMRQ',
    thumbnail: 'https://drive.google.com/thumbnail?id=1Nk5WV9rt8qrq-xMpoas_s_s9FOKgSMRQ'
  },
  {
    id: '11',
    title: 'The Consultation Success Blueprint',
    description: 'Master our proven consultation framework that helps convert more prospects into paying clients.',
    videoId: '1DYgIy3rye3NOEbnutU5tFj61VeaOnAWI',
    thumbnail: 'https://drive.google.com/thumbnail?id=1DYgIy3rye3NOEbnutU5tFj61VeaOnAWI'
  },
  {
    id: '12',
    title: 'Pricing Strategies for Maximum Profit',
    description: 'Develop pricing strategies that reflect your value and maximize your profit.',
    videoId: '1akbQEaETd2Sz1HXa1KhNBX4lT79j0E6z',
    thumbnail: 'https://drive.google.com/thumbnail?id=1akbQEaETd2Sz1HXa1KhNBX4lT79j0E6z'
  },
  {
    id: '13',
    title: 'Client Retention Techniques',
    description: 'Learn strategies to keep clients coming back and referring others to you.',
    videoId: '1P5oeb_v1gNM2GlDHAy_Z-3gEMniPMc3P',
    thumbnail: 'https://drive.google.com/thumbnail?id=1P5oeb_v1gNM2GlDHAy_Z-3gEMniPMc3P'
  },
  {
    id: '14',
    title: 'Building a Referral System',
    description: 'Create a systematic approach to generating referrals from your existing clients.',
    videoId: '1Od0emvuo8hkOMTd1PscMbf2V2VxA7WJ_',
    thumbnail: 'https://drive.google.com/thumbnail?id=1Od0emvuo8hkOMTd1PscMbf2V2VxA7WJ_'
  },
  {
    id: '15',
    title: 'Scaling Your PMU Business',
    description: 'Learn strategies for growing your business beyond just yourself.',
    videoId: '1SCSYfpVpTqxytOxRJzAroe74hIYP2yRy',
    thumbnail: 'https://drive.google.com/thumbnail?id=1SCSYfpVpTqxytOxRJzAroe74hIYP2yRy'
  }
];

// Function to generate a fallback thumbnail if needed
const generateFallbackThumbnail = (moduleNumber: number) => {
  return `https://via.placeholder.com/320x180/7c3aed/ffffff?text=Module+${moduleNumber}`;
};

// Function to generate a background color based on module ID
const getModuleColor = (moduleId: string) => {
  // Array of color gradients (from-color to-color) - lighter and more varied colors
  const colorGradients = [
    'from-purple-400 to-purple-600',     // Light purple
    'from-indigo-400 to-purple-500',     // Indigo to purple
    'from-blue-400 to-indigo-500',       // Blue to indigo
    'from-cyan-400 to-blue-500',         // Cyan to blue
    'from-teal-400 to-cyan-500',         // Teal to cyan
    'from-green-400 to-teal-500',        // Green to teal
    'from-emerald-400 to-green-500',     // Emerald to green
    'from-lime-400 to-emerald-500',      // Lime to emerald
    'from-amber-400 to-orange-500',      // Amber to orange
    'from-orange-400 to-amber-500',      // Orange to amber
    'from-rose-400 to-pink-500',         // Rose to pink
    'from-pink-400 to-rose-500',         // Pink to rose
    'from-fuchsia-400 to-pink-500',      // Fuchsia to pink
    'from-violet-400 to-indigo-500',     // Violet to indigo
    'from-sky-400 to-blue-500',          // Sky to blue
  ];
  
  // Use the module ID to select a color (modulo to wrap around)
  const colorIndex = (parseInt(moduleId) - 1) % colorGradients.length;
  return colorGradients[colorIndex];
};

// Function to generate a pattern for the card background
const getPatternClass = (moduleId: string) => {
  const patterns = [
    'bg-gradient-to-br',  // Bottom-right gradient
    'bg-gradient-to-tr',  // Top-right gradient
    'bg-gradient-to-r',   // Right gradient
    'bg-gradient-to-br',  // Bottom-right gradient (repeated for more frequency)
    'bg-gradient-to-tr',  // Top-right gradient (repeated for more frequency)
    'bg-gradient-to-r',   // Right gradient (repeated for more frequency)
  ];
  
  const patternIndex = (parseInt(moduleId) - 1) % patterns.length;
  return patterns[patternIndex];
};

// Function to get a decorative icon for each module
const getModuleIcon = (moduleId: string) => {
  // Array of SVG icons
  const icons = [
    // Book icon
    <svg key="book" xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white opacity-20 absolute bottom-3 right-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>,
    
    // Chart icon
    <svg key="chart" xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white opacity-20 absolute bottom-3 right-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>,
    
    // Target icon
    <svg key="target" xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white opacity-20 absolute bottom-3 right-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>,
    
    // Lightbulb icon
    <svg key="lightbulb" xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white opacity-20 absolute bottom-3 right-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>,
    
    // Presentation icon
    <svg key="presentation" xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white opacity-20 absolute bottom-3 right-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
    </svg>
  ];
  
  const iconIndex = (parseInt(moduleId) - 1) % icons.length;
  return icons[iconIndex];
};

export default function ModulesPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState<string>('');

  // Google Drive folder URL
  const googleDriveFolderUrl = "https://drive.google.com/drive/folders/1QaDS6BEnN-Ei3-ehi11W1YRJjPd7zlZN?usp=drive_link";

  // Filter modules based on search
  const filteredModules = modules.filter(module => {
    return module.title.toLowerCase().includes(search.toLowerCase()) || 
           module.description.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <DashboardLayout title="All Modules">
      {/* Filters and View Toggle */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-4 w-full md:w-auto">
            {/* Search */}
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Search modules..."
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* View Toggle */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">View:</span>
            <button
              className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Modules Grid/List View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 mb-8">
          {filteredModules.map((module) => (
            <Link 
              key={module.id} 
              href={`/dashboard/module/${module.id}`}
              className="group relative bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full overflow-hidden transform hover:scale-[1.02] hover:-translate-y-1"
            >
              <div 
                className={`relative aspect-[4/3] ${getPatternClass(module.id)} ${getModuleColor(module.id)} flex items-center justify-center overflow-hidden`}
              >
                {/* Decorative elements */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white opacity-10"></div>
                  <div className="absolute -left-6 -top-6 w-24 h-24 rounded-full bg-white opacity-10"></div>
                </div>
                
                {/* Module number badge */}
                <div className="absolute top-3 left-3 bg-white/90 text-purple-800 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm z-10 backdrop-blur-sm">
                  {module.id}
                </div>
                
                {/* Title with elegant typography */}
                <h3 className="text-xl font-bold text-white drop-shadow-md relative z-10 font-sans tracking-wide leading-tight px-6 text-center">
                  {module.title}
                </h3>
              </div>
              
              <div className="p-5 flex-grow flex flex-col justify-between">
                <p className="text-gray-600 text-sm leading-relaxed">{module.description}</p>
                
                {/* View button */}
                <div className="mt-4 pt-2 border-t border-gray-100">
                  <span className="inline-flex items-center text-sm font-medium text-purple-600 group-hover:text-purple-800 transition-colors">
                    View Module
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-4 mb-8">
          {filteredModules.map((module) => (
            <Link 
              key={module.id} 
              href={`/dashboard/module/${module.id}`}
              className="group block bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden transform hover:scale-[1.005]"
            >
              <div className="flex flex-col md:flex-row">
                <div className={`md:w-1/4 ${getPatternClass(module.id)} ${getModuleColor(module.id)} p-6 flex items-center justify-center relative`}>
                  {/* Module number badge */}
                  <div className="absolute top-3 left-3 bg-white/90 text-purple-800 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm z-10">
                    {module.id}
                  </div>
                  
                  <h3 className="text-xl font-bold text-white drop-shadow-md text-center">
                    {module.title}
                  </h3>
                </div>
                
                <div className="p-6 md:w-3/4 flex flex-col md:flex-row justify-between items-start md:items-center">
                  <p className="text-gray-600 mb-4 md:mb-0 md:mr-4">{module.description}</p>
                  
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center text-sm font-medium text-purple-600 group-hover:text-purple-800 transition-colors">
                      View Module
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      
      {/* No Results */}
      {filteredModules.length === 0 && (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No modules found</h3>
          <p className="text-gray-600 mb-4">
            No modules match your search criteria. Try adjusting your search or filters.
          </p>
          <button 
            onClick={() => {
              setSearch('');
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
          >
            Clear Filters
          </button>
        </div>
      )}
    </DashboardLayout>
  );
} 