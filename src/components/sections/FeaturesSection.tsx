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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      title: "Master Consultations",
      description: "Follow our proven 20-minute consultation framework that converts 4 out of 5 prospects into paying clients."
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      title: "Simple Meta Ads Setup",
      description: "Follow our step-by-step guide to set up Facebook and Instagram ads that attract your ideal clients consistently."
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: "Build Strong Client Relationships",
      description: "Learn how to turn clients into long-term relationships that provide consistent income and valuable referrals."
    }
  ];

  return (
    <section className="section bg-white" id="features">
      <Container>
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left column - Content */}
          <div>
            <span className="badge-primary mb-3 inline-block">What You'll Learn</span>
            <h2 className="heading-2 mb-6">Complete Video Training Program</h2>
            <p className="subtitle-1 mb-8">
              Our comprehensive video course gives you all the tools and knowledge to transform your PMU business with 15 in-depth video lessons.
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
            
            <div className="mt-10 space-y-4">
              <Link href="/checkout" className="btn-primary">
                Get Started for Only €37
              </Link>
              <div className="flex items-center text-sm text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>15 in-depth video modules with lifetime access</span>
              </div>
            </div>
          </div>
          
          {/* Right column - Image */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-3xl transform -rotate-3 scale-105"></div>
            <div className="relative z-10">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">PMU Profit System</h3>
                    <span className="badge-primary">15 Video Lessons</span>
                  </div>
                  <Image 
                    src="/images/close-up-girl-online-school.jpg"
                    alt="PMU Profit System Dashboard" 
                    width={600} 
                    height={400}
                    className="rounded-lg w-full h-auto object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0 mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium">Step-by-step video training</p>
                        <p className="text-sm text-gray-600">Easy to follow, actionable lessons</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0 mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium">Proven marketing system</p>
                        <p className="text-sm text-gray-600">Tested with hundreds of PMU artists</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0 mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium">Consultation Success Blueprint</p>
                        <p className="text-sm text-gray-600">Convert more prospects into clients</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-500">One-time investment</p>
                        <p className="text-xl font-bold text-purple-600">€37</p>
                      </div>
                      <Link href="/checkout" className="btn-sm bg-purple-600 text-white rounded-lg">
                        Get Access
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating testimonial */}
              <div className="absolute -bottom-8 -left-8 bg-white rounded-xl shadow-lg p-4 max-w-xs md:block hidden">
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
                    <p className="text-sm font-medium text-gray-900">"The consultation blueprint alone was worth the investment. I'm now converting 4 out of 5 consultations into bookings!"</p>
                    <p className="text-xs text-gray-500">Natalia K., PMU Artist</p>
                  </div>
                </div>
              </div>
              
              {/* Mobile testimonial - displayed below the card on mobile */}
              <div className="mt-12 bg-white rounded-xl shadow-lg p-4 md:hidden">
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
                    <p className="text-sm font-medium text-gray-900">"The consultation blueprint alone was worth the investment. I'm now converting 4 out of 5 consultations into bookings!"</p>
                    <p className="text-xs text-gray-500">Natalia K., PMU Artist</p>
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
            <div className="card p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex text-amber-400 mb-4 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 mb-6">
                "I was having trouble finding consistent clients for my microblading business. After implementing this system, I've seen a steady increase in bookings and my monthly income has improved noticeably."
              </p>
              <div className="flex items-center justify-center">
                <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                  <Image 
                    src={`https://randomuser.me/api/portraits/women/32.jpg`} 
                    alt={`Testimonial 1`} 
                    width={40} 
                    height={40}
                  />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Sophie M.</p>
                  <p className="text-sm text-gray-500">Microblading Artist</p>
                </div>
              </div>
            </div>

            <div className="card p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex text-amber-400 mb-4 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 mb-6">
                "The consultation blueprint was a game-changer for me. I used to struggle with converting inquiries into bookings, but now I'm closing 4 out of 5 consultations. The Meta ads setup was incredibly easy to follow."
              </p>
              <div className="flex items-center justify-center">
                <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                  <Image 
                    src={`https://randomuser.me/api/portraits/women/31.jpg`} 
                    alt={`Testimonial 2`} 
                    width={40} 
                    height={40}
                  />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Emma D.</p>
                  <p className="text-sm text-gray-500">PMU Specialist</p>
                </div>
              </div>
            </div>

            <div className="card p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex text-amber-400 mb-4 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 mb-6">
                "This is the best €37 I've ever spent on my business. I made back the investment in just 2 days with my first client! After 3 weeks, I raised my prices by 30% and clients are still booking."
              </p>
              <div className="flex items-center justify-center">
                <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                  <Image 
                    src={`https://randomuser.me/api/portraits/women/33.jpg`} 
                    alt={`Testimonial 3`} 
                    width={40} 
                    height={40}
                  />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Olivia M.</p>
                  <p className="text-sm text-gray-500">Brow Artist</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default FeaturesSection; 