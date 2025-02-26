'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/container';
import SafeImage from '@/components/ui/image';

const FAQSection = () => {
  const [openIndices, setOpenIndices] = useState<number[]>([]);

  const toggleFAQ = (index: number) => {
    setOpenIndices(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const faqs = [
    {
      question: "How long will it take to see results?",
      answer: "Most PMU artists start seeing an increase in inquiries within the first week of implementing our system. By week 2-3, many report being fully booked. The exact timeline depends on your location, pricing, and how closely you follow our implementation steps."
    },
    {
      question: "I'm not tech-savvy. Will I be able to set this up?",
      answer: "Absolutely! We've designed the PMU Profit System specifically for artists who aren't technical experts. Our step-by-step guides are easy to follow with screenshots and video tutorials. If you can use Facebook, you can implement our system."
    },
    {
      question: "How much do I need to spend on ads?",
      answer: "You can start with as little as €5-10 per day. Our system focuses on efficiency and targeting the right audience, not spending huge amounts. Many of our successful users maintain a €70-100 weekly ad budget while booking €3,000-5,000 in services."
    },
    {
      question: "Will this work in my city/country?",
      answer: "Yes! The PMU Profit System has been successfully implemented by artists across Europe, North America, and Australia. The principles of effective marketing work regardless of location, and we provide guidance on adapting to your specific market."
    },
    {
      question: "Do I get lifetime access?",
      answer: "Yes, your one-time payment of €37 gives you lifetime access to the PMU Profit System, including all future updates. There are no recurring fees or hidden costs."
    },
    {
      question: "What if it doesn't work for me?",
      answer: "We offer a 30-day money-back guarantee. If you implement our system and don't see results, simply email us for a full refund. We're confident in our system because we've seen it work for hundreds of PMU artists at all experience levels."
    },
    {
      question: "What if I've tried other marketing methods before and they didn't work?",
      answer: "We understand how frustrating that can be. Our system is different because it's simple, targeted, and proven to work specifically for PMU artists. We'll show you exactly what we did to get more clients consistently, without the guesswork."
    },
    {
      question: "Is this system suitable for someone who is just starting out?",
      answer: "Yes! Whether you're new or have been in the business for a while, the PMU Profit System can help you attract more clients and grow your income. The system is designed to work for artists at all experience levels."
    },
    {
      question: "Does the course cover setting up Facebook ads step by step?",
      answer: "Yes, we provide clear, step-by-step instructions on how to set up and optimize your Facebook ads. We'll walk you through the entire process, from creating your ad account to launching your first campaign."
    },
    {
      question: "How quickly can I implement the system?",
      answer: "Most artists can set up the entire system within 3-5 hours. You can spread this out over a few days or do it all at once. Once it's set up, maintaining it takes just a few minutes each day."
    },
    {
      question: "Is there support if I have questions while implementing the system?",
      answer: "Yes, we're here to help. You can reach out to us via email, and we'll be happy to assist you with any questions or challenges you encounter along the way."
    },
    {
      question: "Do I need any special software or tools?",
      answer: "No special software is required. You'll just need access to Facebook/Instagram and the internet. All the templates and resources you need are included in the system."
    }
  ];

  return (
    <section className="section bg-white" id="faq">
      <Container>
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="badge-primary mb-3 inline-block">FAQ</span>
          <h2 className="heading-2 mb-6">Frequently Asked Questions</h2>
          <p className="subtitle-1">
            Everything you need to know about the PMU Profit System. 
            Can't find the answer you're looking for? Email us at support@pmuprofitsystem.com
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-x-12 gap-y-4 max-w-5xl mx-auto">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className="card overflow-hidden transition-all duration-200 ease-in-out"
            >
              <button 
                className="w-full p-6 text-left flex items-start justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleFAQ(index)}
                aria-expanded={openIndices.includes(index)}
              >
                <h3 className="text-lg font-semibold flex items-start">
                  <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-sm">Q</span>
                  </span>
                  <span>{faq.question}</span>
                </h3>
                <span className="ml-4 flex-shrink-0">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-5 w-5 transition-transform duration-200 ${openIndices.includes(index) ? 'transform rotate-180' : ''}`} 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </span>
              </button>
              <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndices.includes(index) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="p-6 pt-0 text-gray-600 pl-9 ml-6 border-t border-gray-100">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-20 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-8 md:p-12 text-white">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-4">Ready to Transform Your PMU Business?</h3>
              <p className="text-purple-100 mb-6">
                Join hundreds of successful PMU artists who have already implemented our system and are enjoying consistent bookings and higher income.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative">
                  <Link href="/checkout" className="btn-white">
                    Get Started For €37
                  </Link>
                  <span className="absolute -bottom-6 left-0 right-0 text-xs text-center">
                    <span className="inline-block px-2 py-0.5 bg-amber-300 text-amber-900 rounded-full">1-time payment</span>
                  </span>
                </div>
                <Link href="#results" className="btn-outline-white">
                  See Results
                </Link>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden mr-3 flex-shrink-0">
                    <SafeImage 
                      src="https://randomuser.me/api/portraits/women/32.jpg" 
                      alt="Testimonial" 
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium">Sophia, PMU Artist</p>
                    <div className="flex text-amber-300">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-sm">
                  "I was skeptical at first, but this system has completely changed my business. I'm now earning more than double what I was before, with less stress!"
                </p>
              </div>
              
              <div className="flex justify-between">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 w-[48%]">
                  <p className="text-xl font-bold mb-1">€37</p>
                  <p className="text-sm text-purple-100">One-time payment</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 w-[48%]">
                  <p className="text-xl font-bold mb-1">30-Day</p>
                  <p className="text-sm text-purple-100">Money-back guarantee</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default FAQSection; 