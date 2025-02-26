import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function AdGenerator() {
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
              <Link href="/dashboard/ad-generator" className="block py-2.5 px-4 rounded bg-purple-700">
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
              <h1 className="text-2xl font-bold text-gray-900">PMU Ad Generator</h1>
            </div>
          </header>
          
          <div className="p-8">
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Create High-Converting Ad Copy</h2>
              <p className="text-gray-600 mb-6">
                Fill in the details below to generate professional ad copy for your PMU business. Our AI will create multiple variations based on your inputs.
              </p>
              
              <form className="space-y-6">
                <div>
                  <label htmlFor="tone" className="block text-sm font-medium text-gray-700 mb-1">
                    Tone
                  </label>
                  <select
                    id="tone"
                    name="tone"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly & Approachable</option>
                    <option value="luxury">Luxury & Exclusive</option>
                    <option value="urgent">Urgent & Limited-Time</option>
                    <option value="educational">Educational & Informative</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="offerType" className="block text-sm font-medium text-gray-700 mb-1">
                    Offer Type
                  </label>
                  <select
                    id="offerType"
                    name="offerType"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="discount">Discount Offer</option>
                    <option value="newClient">New Client Special</option>
                    <option value="limitedSpots">Limited Spots Available</option>
                    <option value="seasonal">Seasonal Promotion</option>
                    <option value="bundle">Service Bundle</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="pricing" className="block text-sm font-medium text-gray-700 mb-1">
                    Pricing Details
                  </label>
                  <input
                    type="text"
                    id="pricing"
                    name="pricing"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    placeholder="e.g., €250 for full brows, 20% off for new clients"
                  />
                </div>
                
                <div>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    Generate Ad Copy
                  </button>
                </div>
              </form>
            </div>
            
            {/* Results Section (would be shown after generation) */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Generated Ad Copy</h2>
              <p className="text-gray-600 mb-6">
                Here are 3 ad variations based on your inputs. Click "Copy" to copy the text to your clipboard.
              </p>
              
              <div className="space-y-6">
                {/* This would be populated with actual generated content */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="mb-4">
                    ✨ TRANSFORM YOUR LOOK WITH PROFESSIONAL MICROBLADING ✨<br /><br />
                    Looking for perfect, natural-looking brows? Our expert PMU artists create custom brows tailored to your face shape and style.<br /><br />
                    🔥 New Client Special: €250 for full brows (regular €300)<br />
                    🔥 Limited spots available this month!<br /><br />
                    Click to book your consultation today!
                  </p>
                  <button className="text-sm text-purple-600 font-medium hover:text-purple-800">
                    Copy to Clipboard
                  </button>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="mb-4">
                    "I never thought my brows could look this good!" - Sarah K.<br /><br />
                    Join our satisfied clients and experience the difference professional microblading makes. Wake up every day with perfect brows!<br /><br />
                    📣 Special offer for new clients: €250 full brows<br />
                    📣 Includes free touch-up within 6 weeks<br /><br />
                    Spots filling quickly - Book your consultation now!
                  </p>
                  <button className="text-sm text-purple-600 font-medium hover:text-purple-800">
                    Copy to Clipboard
                  </button>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="mb-4">
                    TIRED OF SPENDING 20 MINUTES EVERY MORNING ON YOUR BROWS?<br /><br />
                    Imagine waking up with perfect, natural-looking eyebrows every day. Our premium microblading service gives you flawless brows that last for months!<br /><br />
                    ⭐ Professional PMU artists with 5+ years experience<br />
                    ⭐ New clients: €250 (Save €50)<br />
                    ⭐ Free consultation<br /><br />
                    Click now to transform your morning routine forever!
                  </p>
                  <button className="text-sm text-purple-600 font-medium hover:text-purple-800">
                    Copy to Clipboard
                  </button>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button className="btn-primary">
                  Generate More Variations
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 