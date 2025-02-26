import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Mock data for modules
const modules = [
  {
    id: '1',
    title: 'Introduction to PMU Marketing',
    description: 'Learn the fundamentals of marketing for your PMU business and how to stand out in a competitive market.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
    content: `
      <p>Welcome to the PMU Profit System! In this introductory module, we'll cover:</p>
      <ul>
        <li>The current state of the PMU industry and market opportunities</li>
        <li>Common marketing mistakes that PMU artists make</li>
        <li>The PMU Profit System framework overview</li>
        <li>Setting realistic goals for your PMU business growth</li>
      </ul>
      <p>By the end of this module, you'll understand the key principles that will guide your marketing strategy and be ready to implement the system in your business.</p>
    `
  },
  {
    id: '2',
    title: 'Understanding Your Target Market',
    description: 'Identify and understand your ideal clients to create marketing that resonates with them.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
    content: `
      <p>In this module, we'll dive deep into understanding your ideal clients. You'll learn:</p>
      <ul>
        <li>How to create detailed client personas for your PMU business</li>
        <li>Research methods to understand what your potential clients really want</li>
        <li>Identifying the emotional triggers that drive PMU purchase decisions</li>
        <li>How to position your services to appeal to your target market</li>
      </ul>
      <p>Understanding your target market is crucial for creating effective marketing messages that resonate with potential clients and motivate them to book with you.</p>
    `
  },
  {
    id: '3',
    title: 'Creating Your Unique Value Proposition',
    description: 'Develop a compelling value proposition that sets you apart from other PMU artists.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
    content: `
      <p>In this module, we'll help you develop your unique value proposition. You'll learn:</p>
      <ul>
        <li>How to identify what makes your PMU services unique</li>
        <li>Crafting a compelling value proposition that resonates with clients</li>
        <li>Communicating your value effectively in all marketing materials</li>
        <li>Pricing strategies that reflect your unique value</li>
      </ul>
      <p>Your unique value proposition is what will help you stand out in a crowded market and attract clients who are willing to pay premium prices for your services.</p>
    `
  },
  {
    id: '4',
    title: 'Setting Up Meta Business Manager',
    description: 'A step-by-step guide to setting up your Meta Business Manager account for effective advertising.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
    content: `
      <p>In this module, we'll walk through the exact process of setting up your Meta Business Manager account. You'll learn:</p>
      <ul>
        <li>How to create and configure your Meta Business Manager account</li>
        <li>Setting up your Facebook page and Instagram account for business</li>
        <li>Installing the Meta pixel on your website for tracking</li>
        <li>Creating custom audiences for targeted advertising</li>
      </ul>
      <p>A properly set up Meta Business Manager account is the foundation for effective Facebook and Instagram advertising that will bring you a steady stream of qualified leads.</p>
    `
  },
  {
    id: '5',
    title: 'Crafting High-Converting Ad Copy',
    description: 'Learn how to write ad copy that resonates with your target audience and drives action.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
    content: `
      <p>In this module, we'll teach you how to write compelling ad copy that converts. You'll learn:</p>
      <ul>
        <li>The psychology behind effective ad copy for PMU services</li>
        <li>Our proven ad copy formula that consistently generates leads</li>
        <li>How to craft headlines that grab attention</li>
        <li>Writing calls-to-action that drive potential clients to take the next step</li>
      </ul>
      <p>Great ad copy is essential for converting viewers into leads. This module will give you the skills to write ads that speak directly to your ideal clients' desires and motivate them to contact you.</p>
    `
  },
  {
    id: '6',
    title: 'Designing Eye-Catching Visuals',
    description: 'Create stunning visuals for your ads that showcase your work and attract attention.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
    content: `
      <p>In this module, we'll show you how to create visuals that make your ads stand out. You'll learn:</p>
      <ul>
        <li>What types of images perform best for PMU advertising</li>
        <li>How to take high-quality before/after photos of your work</li>
        <li>Simple design principles for creating professional-looking ads</li>
        <li>Tools and resources for creating stunning visuals (even if you're not a designer)</li>
      </ul>
      <p>Visual content is crucial in the beauty industry. This module will help you create scroll-stopping visuals that showcase your work in the best possible light.</p>
    `
  },
  {
    id: '7',
    title: 'Targeting the Right Audience',
    description: 'Master the art of audience targeting to reach potential clients who are most likely to book with you.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
    content: `
      <p>In this module, we'll dive deep into audience targeting strategies. You'll learn:</p>
      <ul>
        <li>How to use Meta's detailed targeting options to reach your ideal clients</li>
        <li>Creating lookalike audiences based on your existing clients</li>
        <li>Retargeting strategies to capture interested prospects</li>
        <li>How to test different audiences to find what works best for your business</li>
      </ul>
      <p>Targeting the right audience is key to maximizing your ad spend. This module will show you how to reach the people most likely to book your services, reducing wasted ad spend and increasing your ROI.</p>
    `
  },
  {
    id: '8',
    title: 'Setting Up Your First Campaign',
    description: 'A step-by-step guide to creating and launching your first ad campaign.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
    content: `
      <p>In this module, we'll walk you through creating your first ad campaign. You'll learn:</p>
      <ul>
        <li>How to set up a campaign with the right objective</li>
        <li>Creating ad sets with optimal targeting</li>
        <li>Designing ads that convert using our templates</li>
        <li>Setting budgets and schedules for maximum efficiency</li>
      </ul>
      <p>By the end of this module, you'll have your first campaign up and running, ready to bring in new client inquiries for your PMU business.</p>
    `
  },
  {
    id: '9',
    title: 'Optimizing Ad Performance',
    description: 'Learn how to monitor and optimize your ads for better results and lower costs.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
    content: `
      <p>In this module, we'll show you how to optimize your ad campaigns for better performance. You'll learn:</p>
      <ul>
        <li>Key metrics to track and what they mean for your business</li>
        <li>How to use the Meta Ads Manager to monitor performance</li>
        <li>When and how to make adjustments to improve results</li>
        <li>A/B testing strategies to continuously improve your ads</li>
      </ul>
      <p>Optimization is where the magic happens. This module will help you refine your campaigns to get more leads at a lower cost, maximizing your return on ad spend.</p>
    `
  },
  {
    id: '10',
    title: 'Handling Client Inquiries',
    description: 'Develop a system for managing and responding to client inquiries effectively.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
    content: `
      <p>In this module, we'll teach you how to handle the influx of client inquiries you'll receive. You'll learn:</p>
      <ul>
        <li>Setting up systems to manage multiple inquiries efficiently</li>
        <li>Response templates that convert inquiries into consultation bookings</li>
        <li>How to qualify leads to ensure they're a good fit for your services</li>
        <li>Following up with prospects who don't respond immediately</li>
      </ul>
      <p>Having a system for handling inquiries is crucial when your marketing starts working. This module will help you convert more inquiries into consultations and ultimately into bookings.</p>
    `
  },
  {
    id: '11',
    title: 'The Consultation Success Blueprint',
    description: 'Master our proven consultation framework that converts 9 out of 10 prospects into paying clients.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
    content: `
      <p>In this crucial module, we'll share our Consultation Success Blueprint. You'll learn:</p>
      <ul>
        <li>The exact 20-minute consultation structure that converts 90% of prospects</li>
        <li>Building rapport and establishing trust quickly</li>
        <li>Assessing client suitability and setting clear expectations</li>
        <li>Addressing common concerns and objections effectively</li>
        <li>Closing techniques to secure the booking and deposit</li>
      </ul>
      <p>The consultation is where the sale happens. This blueprint will transform your consultation process, dramatically increasing your booking rate and filling your calendar with clients.</p>
    `
  },
  {
    id: '12',
    title: 'Pricing Strategies for Maximum Profit',
    description: 'Develop pricing strategies that reflect your value and maximize your profit.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
    content: `
      <p>In this module, we'll help you optimize your pricing for maximum profit. You'll learn:</p>
      <ul>
        <li>How to determine the optimal price point for your services</li>
        <li>Creating service packages that increase your average transaction value</li>
        <li>When and how to raise your prices as demand increases</li>
        <li>Communicating your value to justify premium pricing</li>
      </ul>
      <p>Pricing is one of the most important aspects of your business. This module will help you price your services to reflect your true value and maximize your income.</p>
    `
  },
  {
    id: '13',
    title: 'Client Retention Techniques',
    description: 'Learn strategies to keep clients coming back and referring others to you.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
    content: `
      <p>In this module, we'll focus on client retention and referrals. You'll learn:</p>
      <ul>
        <li>Creating an exceptional client experience that builds loyalty</li>
        <li>Follow-up systems to ensure clients return for touch-ups</li>
        <li>Implementing a referral program that motivates clients to send friends</li>
        <li>Using client feedback to continuously improve your services</li>
      </ul>
      <p>Retaining existing clients is much more cost-effective than acquiring new ones. This module will help you build a loyal client base that provides consistent income and valuable referrals.</p>
    `
  },
  {
    id: '14',
    title: 'Building a Referral System',
    description: 'Create a systematic approach to generating referrals from your existing clients.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
    content: `
      <p>In this module, we'll show you how to build a powerful referral system. You'll learn:</p>
      <ul>
        <li>When and how to ask for referrals without feeling awkward</li>
        <li>Creating incentives that motivate clients to refer friends</li>
        <li>Tracking and managing your referral program</li>
        <li>Leveraging partnerships with complementary businesses for cross-referrals</li>
      </ul>
      <p>Referrals are the highest quality leads you can get. This module will help you create a steady stream of referred clients who are pre-sold on your services.</p>
    `
  },
  {
    id: '15',
    title: 'Scaling Your PMU Business',
    description: 'Learn strategies for growing your business beyond just yourself.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
    content: `
      <p>In this final module, we'll explore options for scaling your PMU business. You'll learn:</p>
      <ul>
        <li>When and how to hire additional artists or staff</li>
        <li>Expanding your service offerings for increased revenue</li>
        <li>Creating systems that allow your business to run without you</li>
        <li>Long-term growth strategies for building a sustainable PMU empire</li>
      </ul>
      <p>Once you've mastered client acquisition and retention, scaling is the next step. This module will help you think bigger and create a PMU business that can grow beyond just your own hands.</p>
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
              <div className="py-2 px-4 text-purple-200 text-sm font-medium">COURSE MODULES</div>
              {modules.map((m) => (
                <Link 
                  key={m.id}
                  href={`/dashboard/module/${m.id}`} 
                  className={`block py-2.5 px-4 rounded ${m.id === params.id ? 'bg-purple-700' : 'hover:bg-purple-700'}`}
                >
                  {m.id}: {m.title.length > 20 ? `${m.title.substring(0, 20)}...` : m.title}
                </Link>
              ))}
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