import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/container';

const TargetAudienceSection = () => {
  const audienceGroups = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      title: "New PMU Artists",
      description: "Just starting out and need a reliable way to attract your first clients? Our system helps you build a solid foundation without wasting money on ineffective marketing.",
      color: "from-blue-500 to-indigo-600"
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: "Established Artists Wanting Growth",
      description: "Already have clients but want to scale your business to €5,000+ monthly? Our proven system helps you attract higher-quality clients consistently.",
      color: "from-purple-500 to-pink-600"
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: "PMU Artists Seeking Consistency",
      description: "Tired of unpredictable client flow? Our system creates a reliable stream of bookings so you can plan your schedule and income with confidence.",
      color: "from-green-500 to-teal-600"
    }
  ];

  return (
    <section className="section bg-gray-50" id="who-is-this-for">
      <Container>
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="badge-primary mb-3 inline-block">Who Is This For</span>
          <h2 className="heading-2 mb-6">Perfect For PMU Artists At Any Stage</h2>
          <p className="subtitle-1">
            Whether you're just starting out or looking to scale your existing business, 
            our system is designed to help you achieve consistent €5,000+ monthly income.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {audienceGroups.map((group, index) => (
            <div key={index} className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl -m-1 -z-10"></div>
              <div className="card p-8 transition-all duration-300 group-hover:translate-y-[-8px]">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${group.color} text-white flex items-center justify-center mb-6`}>
                  {group.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4">{group.title}</h3>
                <p className="text-gray-600 mb-6">{group.description}</p>
                <Link href="/pre-checkout" className="text-purple-600 font-medium inline-flex items-center group-hover:text-purple-700">
                  Get Started
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1 transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Social proof section */}
        <div className="mt-24 bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="badge-secondary mb-3 inline-block">Success Stories</span>
              <h3 className="heading-3 mb-6">Join Hundreds of Successful PMU Artists</h3>
              <p className="text-gray-600 mb-8">
                Our system has helped PMU artists across Europe transform their businesses. 
                From struggling to find clients to being fully booked weeks in advance, 
                the results speak for themselves.
              </p>
              
              <div className="space-y-4 mb-8">
                {[
                  "Average 300% increase in quality client inquiries",
                  "Most artists make back their investment within 7 days",
                  "Many users report being fully booked within 30 days"
                ].map((stat, i) => (
                  <div key={i} className="flex items-start">
                    <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mt-1 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-gray-700">{stat}</p>
                  </div>
                ))}
              </div>
              
              <Link href="/pre-checkout" className="btn-primary">
                Join Them For Only €37
              </Link>
            </div>
            
            <div className="relative">
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-purple-100 rounded-full -z-10"></div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-indigo-100 rounded-full -z-10"></div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <Image 
                    src="/images/beautician-doing-microblading-procedure-client-s-eyebrows.jpg" 
                    alt="PMU Artist Success" 
                    width={250} 
                    height={300}
                    className="rounded-xl object-cover h-40 w-full"
                  />
                  <Image 
                    src="/images/young-woman-getting-beauty-treatment-her-eyebrows.jpg" 
                    alt="PMU Artist Success" 
                    width={250} 
                    height={300}
                    className="rounded-xl object-cover h-56 w-full"
                  />
                </div>
                <div className="space-y-4 pt-8">
                  <Image 
                    src="/images/bride-getting-makeup-done-medium-shot.jpg" 
                    alt="PMU Artist Success" 
                    width={250} 
                    height={300}
                    className="rounded-xl object-cover h-56 w-full"
                  />
                  <Image 
                    src="/images/female-doctor-using-digital-tablet-consult-patient.jpg" 
                    alt="PMU Artist Success" 
                    width={250} 
                    height={300}
                    className="rounded-xl object-cover h-40 w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default TargetAudienceSection; 