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
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Welcome to the PMU Profit System</h2>
        <p className="text-gray-600 mb-4">
          You're on your way to transforming your PMU business. Explore the modules below to get started.
        </p>
      </div>
      
      <div className="mb-8">
        {/* Start Learning Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Start Learning</h3>
          <p className="text-gray-600 mb-4">
            Begin your journey to transform your PMU business.
          </p>
          <Link href="/dashboard/courses" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
            View Modules
          </Link>
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
    </DashboardLayout>
  );
} 