import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function ConsultationBlueprint() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-purple-800 text-white">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-6">PMU Profit System</h2>
            
            <nav className="space-y-1">
              <Link href="/dashboard" className="block py-2.5 px-4 rounded hover:bg-purple-700">
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
              <Link href="/dashboard/blueprint" className="block py-2.5 px-4 rounded bg-purple-700">
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
              <h1 className="text-2xl font-bold text-gray-900">Consultation Success Blueprint</h1>
            </div>
          </header>
          
          <div className="p-8">
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Your Consultation Success Blueprint</h2>
                  <p className="text-gray-600">
                    Our proven framework that converts 9 out of 10 prospects into paying clients
                  </p>
                </div>
                <a 
                  href="/blueprint.pdf" 
                  download 
                  className="btn-primary flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download PDF
                </a>
              </div>
              
              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-semibold mb-4">What's Inside:</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>The exact consultation structure that converts 90% of prospects</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Word-for-word scripts to handle common objections</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Pre-consultation preparation checklist</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Post-consultation follow-up templates</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Pricing presentation strategies that increase your average sale</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4">How to Use This Blueprint:</h3>
              <ol className="space-y-4 list-decimal list-inside">
                <li className="pl-2">
                  <span className="font-medium">Download and print the PDF</span>
                  <p className="text-gray-600 mt-1 ml-6">Keep it handy during your consultations for quick reference.</p>
                </li>
                <li className="pl-2">
                  <span className="font-medium">Study the consultation structure</span>
                  <p className="text-gray-600 mt-1 ml-6">Familiarize yourself with the flow and key talking points.</p>
                </li>
                <li className="pl-2">
                  <span className="font-medium">Practice the objection responses</span>
                  <p className="text-gray-600 mt-1 ml-6">Role-play with a friend or colleague until they feel natural.</p>
                </li>
                <li className="pl-2">
                  <span className="font-medium">Implement with your next prospect</span>
                  <p className="text-gray-600 mt-1 ml-6">Follow the blueprint step-by-step with your next consultation.</p>
                </li>
                <li className="pl-2">
                  <span className="font-medium">Track your results</span>
                  <p className="text-gray-600 mt-1 ml-6">Note your conversion rate and refine your approach as needed.</p>
                </li>
              </ol>
              
              <div className="mt-6 pt-6 border-t border-purple-200">
                <p className="text-sm text-purple-700">
                  <strong>Pro Tip:</strong> Review the blueprint before each consultation until the process becomes second nature. Consistency is key to achieving high conversion rates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 