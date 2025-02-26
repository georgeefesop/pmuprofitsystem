import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-purple-800 text-white">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-6">PMU Profit System</h2>
            
            <nav className="space-y-1">
              <Link href="/dashboard" className="block py-2.5 px-4 rounded bg-purple-700">
                Dashboard
              </Link>
              <div className="py-2 px-4 text-purple-200 text-sm font-medium">COURSE MODULES</div>
              <Link href="/dashboard/module/1" className="block py-2.5 px-4 rounded hover:bg-purple-700">
                1: Introduction to PMU Marketing
              </Link>
              <Link href="/dashboard/module/2" className="block py-2.5 px-4 rounded hover:bg-purple-700">
                2: Understanding Your Target Market
              </Link>
              <Link href="/dashboard/module/3" className="block py-2.5 px-4 rounded hover:bg-purple-700">
                3: Creating Your Unique Value Proposition
              </Link>
              <Link href="/dashboard/module/4" className="block py-2.5 px-4 rounded hover:bg-purple-700">
                4: Setting Up Meta Business Manager
              </Link>
              <Link href="/dashboard/module/5" className="block py-2.5 px-4 rounded hover:bg-purple-700">
                5: Crafting High-Converting Ad Copy
              </Link>
              <div className="py-2 px-4 text-purple-200 text-sm font-medium">BONUS MATERIALS</div>
              <Link href="/dashboard/blueprint" className="block py-2.5 px-4 rounded hover:bg-purple-700">
                Consultation Blueprint
              </Link>
              <Link href="/dashboard/profile" className="block py-2.5 px-4 rounded hover:bg-purple-700">
                My Profile
              </Link>
            </nav>
          </div>
          
          <div className="p-6 border-t border-purple-700 mt-6">
            <Link href="/logout" className="block text-sm">
              Logout
            </Link>
          </div>
        </aside>
        
        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <header className="bg-white shadow">
            <div className="py-4 px-8">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            </div>
          </header>
          
          <div className="p-8">
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Welcome to the PMU Profit System</h2>
              <p className="text-gray-600 mb-4">
                You're on your way to transforming your PMU business. Here's your progress so far:
              </p>
              
              <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="mb-2 flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Course Progress</span>
                  <span className="text-sm font-medium text-gray-700">0%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: '0%' }}></div>
                </div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Continue Learning</h3>
                <p className="text-gray-600 mb-4">Pick up where you left off or start from the beginning.</p>
                <Link href="/dashboard/module/1" className="btn-primary inline-block">
                  Start Module 1
                </Link>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Consultation Success Blueprint</h3>
                <p className="text-gray-600 mb-4">Master the art of consultations and convert 9 out of 10 prospects into paying clients.</p>
                <Link href="/dashboard/blueprint" className="btn-primary inline-block">
                  Access Blueprint
                </Link>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow mb-8">
              <h3 className="text-lg font-semibold mb-4">Course Overview</h3>
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
                  <p className="text-sm text-gray-600 ml-11">Convert 9 out of 10 consultations into bookings</p>
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
            
            <div className="bg-purple-50 p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Need Help?</h3>
              <p className="text-gray-600 mb-4">
                If you have any questions or need assistance, please don't hesitate to reach out to our support team.
              </p>
              <a href="mailto:support@pmuprofitsystem.com" className="text-purple-600 font-medium">
                support@pmuprofitsystem.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 