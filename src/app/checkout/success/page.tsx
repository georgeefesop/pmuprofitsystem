import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function CheckoutSuccess() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="heading-lg mb-4">Thank You for Your Purchase!</h1>
          <p className="text-body mb-6">
            Your account has been created and you now have access to the PMU Profit System.
          </p>
          
          <div className="bg-purple-50 p-6 rounded-lg mb-8">
            <h2 className="heading-sm mb-4">What's Next?</h2>
            <ol className="text-left space-y-4">
              <li className="flex items-start">
                <span className="bg-purple-200 text-purple-800 font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5">1</span>
                <div>
                  <p className="font-medium">Check your email</p>
                  <p className="text-sm text-gray-600">We've sent you a confirmation email with your receipt and login details.</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-purple-200 text-purple-800 font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5">2</span>
                <div>
                  <p className="font-medium">Verify your email address</p>
                  <p className="text-sm text-gray-600">Click the verification link in the email to confirm your account.</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-purple-200 text-purple-800 font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5">3</span>
                <div>
                  <p className="font-medium">Log in to access your course</p>
                  <p className="text-sm text-gray-600">Use the email and password you created during checkout to log in.</p>
                </div>
              </li>
            </ol>
          </div>
          
          <div className="space-x-4">
            <Link href="/login" className="btn-primary">
              Log In Now
            </Link>
            <Link href="/" className="inline-block px-6 py-3 text-purple-700 font-semibold hover:text-purple-900">
              Return Home
            </Link>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Need help? Contact us at support@pmuprofitsystem.com</p>
          </div>
        </div>
      </div>
    </main>
  );
} 