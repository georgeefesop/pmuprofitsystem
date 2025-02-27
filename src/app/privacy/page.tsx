import React from 'react';
import { Container } from '@/components/ui/container';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | PMU Profit System',
  description: 'Our privacy policy outlines how we collect, use, and protect your personal information.',
};

export default function PrivacyPage() {
  const lastUpdated = 'February 28, 2024';

  return (
    <div className="bg-white py-12 md:py-16">
      <Container>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">Last Updated: {lastUpdated}</p>

          <div className="prose prose-purple max-w-none">
            <p>
              At PMU Profit System, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
            </p>

            <h2>Information We Collect</h2>
            <p>
              We collect information that you provide directly to us when you:
            </p>
            <ul>
              <li>Register for an account</li>
              <li>Purchase our courses or products</li>
              <li>Sign up for our newsletter</li>
              <li>Contact our support team</li>
              <li>Participate in surveys or promotions</li>
            </ul>

            <p>
              The types of information we may collect include:
            </p>
            <ul>
              <li>Personal identifiers (name, email address, phone number)</li>
              <li>Billing information and payment details</li>
              <li>Professional information (business name, location)</li>
              <li>Account credentials</li>
              <li>Communications with us</li>
            </ul>

            <p>
              We also automatically collect certain information when you visit our website, including:
            </p>
            <ul>
              <li>IP address and device information</li>
              <li>Browser type and settings</li>
              <li>Referring website</li>
              <li>Date and time of access</li>
              <li>Pages viewed and features used</li>
              <li>Actions taken on the site</li>
            </ul>

            <h2>How We Use Your Information</h2>
            <p>
              We may use the information we collect for various purposes, including to:
            </p>
            <ul>
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send administrative messages and updates</li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Deliver personalized content and recommendations</li>
              <li>Monitor and analyze trends, usage, and activities</li>
              <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2>Sharing of Information</h2>
            <p>
              We may share your information with:
            </p>
            <ul>
              <li>Service providers who perform services on our behalf</li>
              <li>Payment processors to complete transactions</li>
              <li>Professional advisors, such as lawyers and accountants</li>
              <li>Third parties in connection with a business transfer</li>
              <li>Law enforcement or other authorities when required by law</li>
            </ul>

            <p>
              We do not sell your personal information to third parties for their direct marketing purposes.
            </p>

            <h2>Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect the security of your personal information. However, please be aware that no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>

            <h2>Your Rights and Choices</h2>
            <p>
              Depending on your location, you may have certain rights regarding your personal information, including:
            </p>
            <ul>
              <li>Access to your personal information</li>
              <li>Correction of inaccurate or incomplete information</li>
              <li>Deletion of your personal information</li>
              <li>Restriction or objection to processing</li>
              <li>Data portability</li>
              <li>Withdrawal of consent</li>
            </ul>

            <p>
              To exercise these rights, please contact us using the information provided below.
            </p>

            <h2>Cookies and Tracking Technologies</h2>
            <p>
              We use cookies and similar tracking technologies to collect information about your browsing activities and to remember your preferences. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our service.
            </p>

            <h2>Children's Privacy</h2>
            <p>
              Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If you become aware that a child has provided us with personal information, please contact us.
            </p>

            <h2>International Data Transfers</h2>
            <p>
              Your information may be transferred to, and maintained on, computers located outside of your state, province, country, or other governmental jurisdiction where the data protection laws may differ from those in your jurisdiction.
            </p>

            <h2>Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
            </p>

            <h2>Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
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