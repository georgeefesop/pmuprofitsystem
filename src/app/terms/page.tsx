import React from 'react';
import { Container } from '@/components/ui/container';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | PMU Profit System',
  description: 'Our terms of service outline the rules, guidelines, and legal agreements between you and PMU Profit System.',
};

export default function TermsPage() {
  const lastUpdated = 'February 28, 2024';

  return (
    <div className="bg-white py-12 md:py-16">
      <Container>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">Terms of Service</h1>
          <p className="text-gray-600 mb-8">Last Updated: {lastUpdated}</p>

          <div className="prose prose-purple max-w-none">
            <p>
              Please read these Terms of Service ("Terms") carefully before using the PMU Profit System website and services.
            </p>

            <h2>1. Agreement to Terms</h2>
            <p>
              By accessing or using our services, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the service.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              PMU Profit System provides educational content, courses, and resources for permanent makeup artists to improve their business and marketing skills. Our services include but are not limited to:
            </p>
            <ul>
              <li>Online courses and training modules</li>
              <li>Downloadable resources and templates</li>
              <li>Consultation frameworks and scripts</li>
              <li>Marketing strategies and guidance</li>
            </ul>

            <h2>3. User Accounts</h2>
            <p>
              When you create an account with us, you must provide accurate, complete, and current information. You are responsible for safeguarding the password and for all activities that occur under your account.
            </p>
            <p>
              You agree to notify us immediately of any unauthorized use of your account or any other breach of security. We cannot and will not be liable for any loss or damage arising from your failure to comply with this section.
            </p>

            <h2>4. Intellectual Property</h2>
            <p>
              The content, features, and functionality of the PMU Profit System, including but not limited to text, graphics, logos, images, videos, and software, are owned by PMU Profit System and are protected by copyright, trademark, and other intellectual property laws.
            </p>
            <p>
              You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any of the material on our website without our prior written consent.
            </p>

            <h2>5. User Content</h2>
            <p>
              You retain ownership of any content you submit, post, or display on or through our services. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, translate, and distribute your content in any existing or future media.
            </p>
            <p>
              You represent and warrant that you own or have the necessary rights to the content you submit and that the content does not violate the rights of any third party.
            </p>

            <h2>6. Prohibited Uses</h2>
            <p>
              You agree not to use our services:
            </p>
            <ul>
              <li>In any way that violates any applicable law or regulation</li>
              <li>To impersonate or attempt to impersonate PMU Profit System, an employee, another user, or any other person</li>
              <li>To engage in any conduct that restricts or inhibits anyone's use or enjoyment of the service</li>
              <li>To attempt to gain unauthorized access to any part of the service</li>
              <li>To use the service for any commercial purpose not expressly permitted by us</li>
              <li>To share your account credentials with others or allow multiple users to access your account</li>
            </ul>

            <h2>7. Payment and Subscription Terms</h2>
            <p>
              Some of our services require payment. By purchasing a subscription or course, you agree to pay the specified fees. All fees are in USD unless otherwise stated and are non-refundable except as required by law or as explicitly stated in our refund policy.
            </p>
            <p>
              For subscription services, your subscription will automatically renew at the end of each billing period unless you cancel it before the renewal date.
            </p>

            <h2>8. Refund Policy</h2>
            <p>
              We offer a 14-day money-back guarantee for our courses. If you are not satisfied with your purchase, you may request a refund within 14 days of the purchase date by contacting our support team.
            </p>
            <p>
              We reserve the right to deny refund requests that we determine to be abusive or fraudulent.
            </p>

            <h2>9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, PMU Profit System and its affiliates, officers, employees, agents, partners, and licensors shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
            </p>
            <ul>
              <li>Your access to or use of or inability to access or use the service</li>
              <li>Any conduct or content of any third party on the service</li>
              <li>Any content obtained from the service</li>
              <li>Unauthorized access, use, or alteration of your transmissions or content</li>
            </ul>

            <h2>10. Disclaimer of Warranties</h2>
            <p>
              Your use of the service is at your sole risk. The service is provided on an "AS IS" and "AS AVAILABLE" basis. PMU Profit System expressly disclaims all warranties of any kind, whether express or implied, including but not limited to the implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
            </p>

            <h2>11. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of [Jurisdiction], without regard to its conflict of law provisions.
            </p>

            <h2>12. Changes to Terms</h2>
            <p>
              We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
            </p>

            <h2>13. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
            </p>
            <p>
              Email: <a href="mailto:pmuprofitsystem@gmail.com" className="text-purple-600 hover:text-purple-800">pmuprofitsystem@gmail.com</a>
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
} 