import React from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Account Deleted | PMU Profit System',
  description: 'Your account has been successfully deleted.',
};

export default function AccountDeletedPage() {
  return (
    <div className="bg-white min-h-screen flex items-center justify-center">
      <Container>
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Account Successfully Deleted</h1>
          <p className="text-gray-600 mb-6">
            We're sorry to see you go. Your account and all associated data have been scheduled for deletion.
          </p>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
            <h2 className="text-lg font-medium text-gray-900 mb-2">What happens next?</h2>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Your account data will be permanently deleted within 30 days</li>
              <li>• Any active subscriptions have been canceled</li>
              <li>• You will receive a confirmation email shortly</li>
            </ul>
          </div>
          
          <p className="text-sm text-gray-500 mb-6">
            If you change your mind within the next 30 days, please contact our support team at{' '}
            <a href="mailto:pmuprofitsystem@gmail.com" className="text-purple-600 hover:text-purple-800">
              pmuprofitsystem@gmail.com
            </a>
          </p>
          
          <Link href="/" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 shadow-sm transition-colors">
            Return to Homepage
          </Link>
        </div>
      </Container>
    </div>
  );
} 