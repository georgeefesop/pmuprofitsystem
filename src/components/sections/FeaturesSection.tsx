import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/container';

const FeaturesSection = () => {
  const features = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      title: "Craft Irresistible Offers",
      description: "Learn how to create special deals that make clients choose you over competitors, even if you're not the cheapest option."
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: "AI-Powered Ad Creation",
      description: "Use our optional AI tools to create eye-catching ads and messages, even if you have zero marketing experience."
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      title: "Simple Meta Ads Setup",
      description: "Follow our step-by-step guide to set up Facebook and Instagram ads that attract your ideal clients consistently."
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      title: "Client Management System",
      description: "Get templates and systems to streamline messages, consultations, and bookings for consistent results."
    }
  ];

  return (
    <section className="section bg-white" id="features">
      <Container>
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left column - Content */}
          <div>
            <span className="badge-primary mb-3 inline-block">What You'll Learn</span>
            <h2 className="heading-2 mb-6">Everything You Need to Reach €5,000 Monthly</h2>
            <p className="subtitle-1 mb-8">
              Our comprehensive system gives you all the tools and knowledge to transform your PMU business.
            </p>
            
            <div className="space-y-8">
              {features.map((feature, index) => (
                <div key={index} className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-10">
              <Link href="/checkout" className="btn-primary">
                Get Started for Only €37
              </Link>
            </div>
          </div>
          
          {/* Right column - Image */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-3xl transform -rotate-3 scale-105"></div>
            <div className="relative z-10">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">PMU Profit Dashboard</h3>
                    <span className="badge-primary">Preview</span>
                  </div>
                  <Image 
                    src="https://images.pexels.com/photos/6476260/pexels-photo-6476260.jpeg"
                    alt="PMU Profit System Dashboard" 
                    width={600} 
                    height={400}
                    className="rounded-lg w-full h-auto object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-sm text-gray-500">New Clients</p>
                      <p className="text-xl font-bold text-purple-600">12</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-sm text-gray-500">Messages</p>
                      <p className="text-xl font-bold text-purple-600">24</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-sm text-gray-500">Revenue</p>
                      <p className="text-xl font-bold text-purple-600">€3,960</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">Weekly Growth</p>
                      <div className="flex items-center">
                        <span className="text-green-500 font-medium">+27%</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 ml-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <button className="btn-sm bg-purple-600 text-white rounded-lg">View Details</button>
                  </div>
                </div>
              </div>
              
              {/* Floating testimonial */}
              <div className="absolute -bottom-8 -left-8 bg-white rounded-xl shadow-lg p-4 max-w-xs">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    <Image 
                      src="https://randomuser.me/api/portraits/women/44.jpg" 
                      alt="Testimonial" 
                      width={40} 
                      height={40}
                    />
                  </div>
                  <div>
                    <div className="flex text-amber-400 mb-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-sm font-medium text-gray-900">"This system changed my business completely!"</p>
                    <p className="text-xs text-gray-500">Maria, PMU Artist</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Testimonials */}
        <div className="mt-24 text-center">
          <span className="badge-secondary mb-3 inline-block">Testimonials</span>
          <h2 className="heading-3 mb-12">What Our PMU Artists Say</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-6">
                <div className="flex text-amber-400 mb-4 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600 mb-6">
                  {i === 1 ? (
                    "I was struggling to find clients consistently. After implementing this system, I'm now fully booked 3 weeks in advance!"
                  ) : i === 2 ? (
                    "The Meta ads setup was so easy to follow. I'm getting quality client inquiries daily with minimal effort."
                  ) : (
                    "This is the best investment I've made in my PMU business. The ROI is incredible - I made back the cost in just 2 days!"
                  )}
                </p>
                <div className="flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                    <Image 
                      src={`https://randomuser.me/api/portraits/women/${30 + i}.jpg`} 
                      alt={`Testimonial ${i}`} 
                      width={40} 
                      height={40}
                    />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">
                      {i === 1 ? "Sophie, Berlin" : i === 2 ? "Emma, Paris" : "Olivia, Madrid"}
                    </p>
                    <p className="text-sm text-gray-500">PMU Artist</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
};

export default FeaturesSection; 