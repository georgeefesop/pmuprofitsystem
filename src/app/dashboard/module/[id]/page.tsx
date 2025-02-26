import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Mock data for modules
const modules = [
  {
    id: '1',
    title: 'Introduction to the PMU Profit System',
    description: 'Learn the fundamentals of the PMU Profit System and how it can transform your business.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
    content: `
      <p>Welcome to the PMU Profit System! In this introductory module, we'll cover:</p>
      <ul>
        <li>The core principles of the PMU Profit System</li>
        <li>How to set up your business for success</li>
        <li>Understanding your target market</li>
        <li>Setting realistic goals for your PMU business</li>
      </ul>
      <p>By the end of this module, you'll have a clear understanding of how the system works and be ready to implement the strategies in your business.</p>
    `
  },
  {
    id: '2',
    title: 'Creating Irresistible Offers',
    description: 'Learn how to craft compelling offers that attract clients and set you apart from competitors.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
    content: `
      <p>In this module, we'll dive deep into creating offers that convert. You'll learn:</p>
      <ul>
        <li>The psychology behind effective offers</li>
        <li>How to price your services for maximum profit</li>
        <li>Creating packages that clients can't resist</li>
        <li>Using limited-time offers to drive bookings</li>
      </ul>
      <p>By implementing these strategies, you'll be able to attract more clients and increase your revenue significantly.</p>
    `
  },
  {
    id: '3',
    title: 'Meta Ads Setup',
    description: 'A step-by-step guide to setting up and optimizing Facebook and Instagram ads for your PMU business.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
    content: `
      <p>In this module, we'll walk through the exact process of setting up effective Meta ads. You'll learn:</p>
      <ul>
        <li>How to set up your Meta Business Manager account</li>
        <li>Creating ad campaigns that target the right audience</li>
        <li>Writing ad copy that converts</li>
        <li>Optimizing your ad spend for maximum ROI</li>
      </ul>
      <p>By the end of this module, you'll be able to create and run ads that bring a steady stream of clients to your business.</p>
    `
  },
  {
    id: '4',
    title: 'Client Management',
    description: 'Learn how to manage client inquiries, consultations, and bookings efficiently.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
    content: `
      <p>In this final module, we'll cover everything you need to know about managing clients effectively. You'll learn:</p>
      <ul>
        <li>How to respond to inquiries and convert them into consultations</li>
        <li>Running consultations that lead to bookings</li>
        <li>Managing your calendar and scheduling efficiently</li>
        <li>Following up with clients for reviews and referrals</li>
      </ul>
      <p>These systems will help you streamline your business operations and ensure you're providing excellent service to your clients.</p>
    `
  }
];

export default function ModulePage({ params }: { params: { id: string } }) {
  // Find the module based on the ID from the URL
  const module = modules.find(m => m.id === params.id) || modules[0];

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
              {modules.map((m) => (
                <Link 
                  key={m.id}
                  href={`/dashboard/module/${m.id}`} 
                  className={`block py-2.5 px-4 rounded ${m.id === params.id ? 'bg-purple-700' : 'hover:bg-purple-700'}`}
                >
                  Module {m.id}: {m.title.length > 20 ? `${m.title.substring(0, 20)}...` : m.title}
                </Link>
              ))}
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
              <h1 className="text-2xl font-bold text-gray-900">Module {module.id}: {module.title}</h1>
            </div>
          </header>
          
          <div className="p-8">
            <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
              <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                <iframe
                  src={module.videoUrl}
                  title={module.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-96"
                ></iframe>
              </div>
              
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">{module.title}</h2>
                <p className="text-gray-600 mb-6">{module.description}</p>
                
                <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: module.content }}></div>
                
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <button className="btn-primary">
                    Mark as Complete
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between">
              {parseInt(module.id) > 1 && (
                <Link href={`/dashboard/module/${parseInt(module.id) - 1}`} className="text-purple-600 font-medium">
                  ← Previous Module
                </Link>
              )}
              
              {parseInt(module.id) < modules.length && (
                <Link href={`/dashboard/module/${parseInt(module.id) + 1}`} className="text-purple-600 font-medium">
                  Next Module →
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 