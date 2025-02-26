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
              <Link href="/dashboard/module/1" className="block py-2.5 px-4 rounded hover:bg-purple-700">
                Module 1: Introduction
              </Link>
              <Link href="/dashboard/module/2" className="block py-2.5 px-4 rounded hover:bg-purple-700">
                Module 2: Creating Offers
              </Link>
              <Link href="/dashboard/module/3" className="block py-2.5 px-4 rounded hover:bg-purple-700">
                Module 3: Meta Ads Setup
              </Link>
              <Link href="/dashboard/module/4" className="block py-2.5 px-4 rounded hover:bg-purple-700">
                Module 4: Client Management
              </Link>
              <Link href="/dashboard/ad-generator" className="block py-2.5 px-4 rounded hover:bg-purple-700">
                PMU Ad Generator
              </Link>
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
                <h3 className="text-lg font-semibold mb-4">PMU Ad Generator</h3>
                <p className="text-gray-600 mb-4">Create high-converting ad copy for your PMU business.</p>
                <Link href="/dashboard/ad-generator" className="btn-primary inline-block">
                  Create Ads
                </Link>
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