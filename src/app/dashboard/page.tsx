'use client';

import React from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';

// Google Drive folder URL
const googleDriveFolderUrl = "https://drive.google.com/drive/folders/1QaDS6BEnN-Ei3-ehi11W1YRJjPd7zlZN?usp=drive_link";

export default function Dashboard() {
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
      Download All Course Materials
    </a>
  );

  return (
    <DashboardLayout title="Dashboard" actionButton={actionButton}>
      {/* Start Learning Card */}
      <div className="mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Start Learning</h3>
          <p className="text-gray-600 mb-4">
            Begin your journey to transform your PMU business.
          </p>
          <Link href="/dashboard/modules" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
            View Modules
          </Link>
        </div>
      </div>
      
      {/* Bonus Materials Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Bonus Materials</h3>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Consultation Blueprint Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="font-medium text-lg">Consultation Success Blueprint</h4>
            </div>
            <p className="text-gray-600 mb-4 ml-13">
              Our proven framework that helps you convert more prospects into paying clients.
            </p>
            <Link href="/dashboard/blueprint" className="inline-flex items-center text-purple-600 font-medium hover:text-purple-700 transition-colors">
              View Blueprint
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          
          {/* PMU Business Handbook Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h4 className="font-medium text-lg">PMU Business Handbook</h4>
            </div>
            <p className="text-gray-600 mb-4 ml-13">
              A comprehensive guide to building and growing your PMU business.
            </p>
            <Link href="/dashboard/handbook" className="inline-flex items-center text-purple-600 font-medium hover:text-purple-700 transition-colors">
              View Handbook
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
          <h3 className="text-lg font-semibold">Course Overview</h3>
          <a 
            href={googleDriveFolderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Videos
          </a>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="font-medium">15 Video Lessons</h4>
            </div>
            <p className="text-sm text-gray-600 ml-11">Step-by-step training to grow your PMU business</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="font-medium">Consultation Blueprint</h4>
            </div>
            <p className="text-sm text-gray-600 ml-11">Convert more consultations into bookings</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h4 className="font-medium">Lifetime Access</h4>
            </div>
            <p className="text-sm text-gray-600 ml-11">Including all future updates and additions</p>
          </div>
        </div>
      </div>
      
      <div className="bg-purple-50 p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Need Help?</h3>
        <p className="text-gray-600 mb-4">
          If you have any questions or need assistance, please don't hesitate to reach out to our support team.
        </p>
        <a href="mailto:pmuprofitsystem@gmail.com" className="text-purple-600 font-medium hover:text-purple-700 transition-colors">
          pmuprofitsystem@gmail.com
        </a>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
        <Link href="/dashboard/modules" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
          </svg>
          View All Modules
        </Link>
      </div>
    </DashboardLayout>
  );
} 