'use client';

import React from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ModuleNavBar } from '@/components/ModuleNavBar';
import { VideoPlayer } from '@/components/VideoPlayer';

// Mock data for modules with Google Drive video IDs
const modules = [
  {
    id: '1',
    title: 'Introduction to PMU Marketing',
    description: 'Learn the fundamentals of marketing for your PMU business and how to stand out in a competitive market.',
    videoId: '17Uc7DfpneaRcuyabvvEsyt9T0fpvjziY', // Full PMU Course - Part 1.mp4
    thumbnail: 'https://drive.google.com/thumbnail?id=17Uc7DfpneaRcuyabvvEsyt9T0fpvjziY',
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
    videoId: '1gJBqhP9JKN0XFF32O9JQNQGIKWxx1AWM', // Full PMU Course - Part 2 - Earning Potentials.mp4
    thumbnail: 'https://drive.google.com/thumbnail?id=1gJBqhP9JKN0XFF32O9JQNQGIKWxx1AWM',
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
    videoId: '1GA_UCUn7TBwerOklTCUNZ6w_jtrVc7dq', // Full PMU Course - Part 3 - Foundations.mp4
    thumbnail: 'https://drive.google.com/thumbnail?id=1GA_UCUn7TBwerOklTCUNZ6w_jtrVc7dq',
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
    videoId: '1FXLhxaVX0u3lJyrTMgcEuWMQpWPs82N8', // Full PMU Course - Part 4 - Analyze Local Market.mp4
    thumbnail: 'https://drive.google.com/thumbnail?id=1FXLhxaVX0u3lJyrTMgcEuWMQpWPs82N8',
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
    videoId: '1l2T8m4C0IyJPRnjU8GtlCCuKBaEl-Lyi', // Full PMU Course - Part 5 - Niche.mp4
    thumbnail: 'https://drive.google.com/thumbnail?id=1l2T8m4C0IyJPRnjU8GtlCCuKBaEl-Lyi',
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
    videoId: '12jOyZKPLYR4RZH3g7RX57EGCb751y9fq', // Full PMU Course - Part 6 - Online Presence.mp4
    thumbnail: 'https://drive.google.com/thumbnail?id=12jOyZKPLYR4RZH3g7RX57EGCb751y9fq',
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
    videoId: '1GTmc2qOQuEbgetMjMDNLUDYMjy72asX-', // Full PMU Course - Part 7 - Creating Your Offers (With AI).mp4
    thumbnail: 'https://drive.google.com/thumbnail?id=1GTmc2qOQuEbgetMjMDNLUDYMjy72asX-',
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
    videoId: '1uS5cSr2WW-b5FM9IfOR4PR5DaL9rF-do', // Full PMU Course - Part 8 - Designing Ad Variations.mp4
    thumbnail: 'https://drive.google.com/thumbnail?id=1uS5cSr2WW-b5FM9IfOR4PR5DaL9rF-do',
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
    videoId: '1jPUoVDovJALbVZGBPrzdqZK8_EFOM9Sl', // Full PMU Course - Part 9 - Set up Ads.mp4
    thumbnail: 'https://drive.google.com/thumbnail?id=1jPUoVDovJALbVZGBPrzdqZK8_EFOM9Sl',
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
    videoId: '1Nk5WV9rt8qrq-xMpoas_s_s9FOKgSMRQ', // Full PMU Course - Part 10 - Retargeting.mp4
    thumbnail: 'https://drive.google.com/thumbnail?id=1Nk5WV9rt8qrq-xMpoas_s_s9FOKgSMRQ',
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
    description: 'Master our proven consultation framework that helps convert more prospects into paying clients.',
    videoId: '1DYgIy3rye3NOEbnutU5tFj61VeaOnAWI', // Full PMU Course - Part 11 - Managing Incoming Messages.mp4
    thumbnail: 'https://drive.google.com/thumbnail?id=1DYgIy3rye3NOEbnutU5tFj61VeaOnAWI',
    content: `
      <p>In this crucial module, we'll share our Consultation Success Blueprint. You'll learn:</p>
      <ul>
        <li>The exact 20-minute consultation structure that converts prospects effectively</li>
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
    videoId: '1akbQEaETd2Sz1HXa1KhNBX4lT79j0E6z', // Full PMU Course - Part 12 - Conducting Consultations.mp4
    thumbnail: 'https://drive.google.com/thumbnail?id=1akbQEaETd2Sz1HXa1KhNBX4lT79j0E6z',
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
    videoId: '1P5oeb_v1gNM2GlDHAy_Z-3gEMniPMc3P', // Full PMU Course - Part 13 - Booking Confirmations.mp4
    thumbnail: 'https://drive.google.com/thumbnail?id=1P5oeb_v1gNM2GlDHAy_Z-3gEMniPMc3P',
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
    videoId: '1Od0emvuo8hkOMTd1PscMbf2V2VxA7WJ_', // Full PMU Course - Part 14 - PMU Sessions & Photography.mp4
    thumbnail: 'https://drive.google.com/thumbnail?id=1Od0emvuo8hkOMTd1PscMbf2V2VxA7WJ_',
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
    videoId: '1SCSYfpVpTqxytOxRJzAroe74hIYP2yRy', // Full PMU Course - Part 15 - Payments Reviews & Referals.mp4
    thumbnail: 'https://drive.google.com/thumbnail?id=1SCSYfpVpTqxytOxRJzAroe74hIYP2yRy',
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

// Google Drive folder URL
const googleDriveFolderUrl = "https://drive.google.com/drive/folders/1QaDS6BEnN-Ei3-ehi11W1YRJjPd7zlZN?usp=drive_link";

// Google Drive direct download URL for a specific video
const getGoogleDriveDownloadUrl = (fileId: string) => {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
};

export default function ModulePage({ params }: { params: { id: string } }) {
  // Find the module based on the ID from the URL
  const module = modules.find(m => m.id === params.id) || modules[0];
  
  return (
    <DashboardLayout 
      title={`Module ${module.id}: ${module.title}`} 
      currentModuleId={module.id}
    >
      {/* Module Navigation Bar */}
      <ModuleNavBar 
        currentModuleId={module.id}
        totalModules={modules.length}
        moduleTitle={module.title}
      />

      {/* Video Player */}
      <VideoPlayer 
        videoId={module.videoId}
        title={module.title}
        moduleId={module.id}
      />
      
      {/* Module Content */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">{module.title}</h2>
            <p className="text-gray-600">{module.description}</p>
          </div>
        </div>
        
        <div className="bg-purple-50 p-6 rounded-lg mb-8">
          <h3 className="text-lg font-semibold mb-4">Module Content</h3>
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: module.content }}></div>
        </div>
      </div>
    </DashboardLayout>
  );
} 