import React from 'react';
import Image from 'next/image';
import { Container } from '@/components/ui/container';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us | PMU Profit System',
  description: 'Learn about the PMU Profit System and our mission to help PMU specialists grow their business.',
};

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="bg-purple-900 text-white py-16 md:py-24">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-6">About PMU Profit System</h1>
            <p className="text-lg md:text-xl text-purple-100">
              Helping PMU specialists transform their business with proven marketing strategies
            </p>
          </div>
        </Container>
      </div>

      {/* Our Story */}
      <Container className="py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">Our Story</h2>
            <p className="text-gray-700 mb-4">
              The PMU Profit System was created by industry experts who recognized a critical gap in the permanent makeup industry: while many artists excel at their craft, they often struggle with the business and marketing aspects of their practice.
            </p>
            <p className="text-gray-700 mb-4">
              After years of working with PMU specialists and seeing the same challenges arise time and again, we developed a comprehensive system designed specifically to address these pain points and help artists build thriving, sustainable businesses.
            </p>
            <p className="text-gray-700">
              Our mission is simple: to empower PMU artists with the marketing knowledge, tools, and strategies they need to attract their ideal clients consistently and build the business they deserve.
            </p>
          </div>
          <div className="relative h-80 md:h-96 rounded-lg overflow-hidden shadow-lg">
            <Image 
              src="/images/about-story.jpg" 
              alt="PMU Profit System Story" 
              fill
              className="object-cover"
            />
          </div>
        </div>
      </Container>

      {/* Our Values */}
      <div className="bg-gray-50 py-16">
        <Container>
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">Our Values</h2>
            <p className="text-gray-700">
              These core principles guide everything we do at PMU Profit System
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Integrity</h3>
              <p className="text-gray-700">
                We believe in honest, ethical marketing practices that build trust with clients. No gimmicks, just proven strategies that work.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Empowerment</h3>
              <p className="text-gray-700">
                We don't just provide temporary solutions; we equip PMU artists with the knowledge and skills to succeed independently.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Innovation</h3>
              <p className="text-gray-700">
                The digital landscape is always evolving. We continuously research and update our strategies to keep our community ahead of the curve.
              </p>
            </div>
          </div>
        </Container>
      </div>

      {/* Team Section */}
      <Container className="py-16">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">Meet Our Team</h2>
          <p className="text-gray-700">
            The experts behind the PMU Profit System
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="relative w-48 h-48 mx-auto rounded-full overflow-hidden mb-6">
              <Image 
                src="/images/team-member-1.jpg" 
                alt="Sarah Johnson" 
                fill
                className="object-cover"
              />
            </div>
            <h3 className="text-xl font-semibold mb-1 text-gray-900">Sarah Johnson</h3>
            <p className="text-purple-600 mb-3">Founder & Lead Instructor</p>
            <p className="text-gray-700 text-sm">
              PMU artist with over 10 years of experience and a passion for business education.
            </p>
          </div>

          <div className="text-center">
            <div className="relative w-48 h-48 mx-auto rounded-full overflow-hidden mb-6">
              <Image 
                src="/images/team-member-2.jpg" 
                alt="Michael Chen" 
                fill
                className="object-cover"
              />
            </div>
            <h3 className="text-xl font-semibold mb-1 text-gray-900">Michael Chen</h3>
            <p className="text-purple-600 mb-3">Marketing Strategist</p>
            <p className="text-gray-700 text-sm">
              Digital marketing expert specializing in beauty industry client acquisition.
            </p>
          </div>

          <div className="text-center">
            <div className="relative w-48 h-48 mx-auto rounded-full overflow-hidden mb-6">
              <Image 
                src="/images/team-member-3.jpg" 
                alt="Emma Rodriguez" 
                fill
                className="object-cover"
              />
            </div>
            <h3 className="text-xl font-semibold mb-1 text-gray-900">Emma Rodriguez</h3>
            <p className="text-purple-600 mb-3">Client Success Manager</p>
            <p className="text-gray-700 text-sm">
              Dedicated to ensuring PMU artists implement strategies successfully.
            </p>
          </div>
        </div>
      </Container>

      {/* CTA Section */}
      <div className="bg-purple-900 text-white py-16">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Ready to Transform Your PMU Business?</h2>
            <p className="text-lg text-purple-100 mb-8">
              Join thousands of PMU artists who have already taken their business to the next level with our proven system.
            </p>
            <a 
              href="/#pricing" 
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-purple-900 bg-white hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 shadow-sm"
            >
              Get Started Today
            </a>
          </div>
        </Container>
      </div>
    </div>
  );
} 