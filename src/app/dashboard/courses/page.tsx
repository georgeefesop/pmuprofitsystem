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

export default function CoursesPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState<string>('');

  // Google Drive folder URL
  const googleDriveFolderUrl = "https://drive.google.com/drive/folders/1QaDS6BEnN-Ei3-ehi11W1YRJjPd7zlZN?usp=drive_link";

  // Filter modules based on search
  const filteredModules = modules.filter(module => {
    return module.title.toLowerCase().includes(search.toLowerCase()) || 
           module.description.toLowerCase().includes(search.toLowerCase());
  });

  // Action button for the header
  const actionButton = (
    <a 
      href={googleDriveFolderUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Download All Videos
    </a>
  );

  return (
    <DashboardLayout title="All Modules" actionButton={actionButton}>
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
              className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full"
            >
              <div className="relative aspect-video">
                <Image
                  src={module.thumbnail}
                  alt={module.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = generateFallbackThumbnail(parseInt(module.id));
                  }}
                />
                
                {/* Module number badge */}
                <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded">
                  Module {module.id}
                </div>
              </div>
              <div className="p-4 flex-grow flex flex-col">
                <h3 className="text-lg font-semibold mb-2">{module.title}</h3>
                <p className="text-gray-600 text-sm mb-4 flex-grow">{module.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-purple-600 font-medium text-sm">
                    View Module
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-4 mb-8">
          {filteredModules.map((module) => (
            <Link key={module.id} href={`/dashboard/module/${module.id}`} className="block">
              <div className="bg-white rounded-lg shadow overflow-hidden transition-all hover:bg-gray-50">
                <div className="flex flex-col md:flex-row">
                  <div className="relative w-full md:w-32 h-24 md:h-20 flex-shrink-0 overflow-hidden">
                    <div className="w-full h-full relative">
                      <Image
                        src={module.thumbnail}
                        alt={module.title}
                        fill
                        sizes="(max-width: 768px) 96px, 128px"
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = generateFallbackThumbnail(parseInt(module.id));
                        }}
                      />
                    </div>
                    <div className="absolute top-1 left-1 bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      {module.id}
                    </div>
                  </div>
                  <div className="p-4 flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-lg mb-2">{module.title}</h3>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{module.description}</p>
                    <span className="text-purple-600 font-medium text-sm">
                      View Module
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