import React from 'react';
import { Container } from '@/components/ui/container';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy | PMU Profit System',
  description: 'Our cookie policy explains how we use cookies and similar technologies on our website.',
};

export default function CookiesPage() {
  const lastUpdated = 'February 28, 2024';

  return (
    <div className="bg-white py-12 md:py-16">
      <Container>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">Cookie Policy</h1>
          <p className="text-gray-600 mb-8">Last Updated: {lastUpdated}</p>

          <div className="prose prose-purple max-w-none">
            <p>
              This Cookie Policy explains how PMU Profit System ("we", "us", or "our") uses cookies and similar technologies on our website. By using our website, you consent to the use of cookies as described in this policy.
            </p>

            <h2>What Are Cookies?</h2>
            <p>
              Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you visit a website. They are widely used to make websites work more efficiently, provide a better user experience, and give website owners information about how their site is being used.
            </p>
            <p>
              Cookies are not harmful and do not contain any information that directly identifies you as a person. They cannot be used to spread viruses or access your hard drive.
            </p>

            <h2>Types of Cookies We Use</h2>
            <p>
              We use the following types of cookies on our website:
            </p>

            <h3>Essential Cookies</h3>
            <p>
              These cookies are necessary for the website to function properly. They enable basic functions like page navigation, secure areas access, and shopping cart functionality. The website cannot function properly without these cookies.
            </p>

            <h3>Preference Cookies</h3>
            <p>
              These cookies allow the website to remember choices you make (such as your username, language, or region) and provide enhanced, more personal features. They may also be used to provide services you have requested, such as watching a video or commenting on a blog.
            </p>

            <h3>Analytics Cookies</h3>
            <p>
              These cookies collect information about how visitors use a website, for instance which pages visitors go to most often, and if they get error messages from web pages. These cookies don't collect information that identifies a visitor. All information these cookies collect is aggregated and therefore anonymous. It is only used to improve how a website works.
            </p>

            <h3>Marketing Cookies</h3>
            <p>
              These cookies are used to track visitors across websites. The intention is to display ads that are relevant and engaging for the individual user and thereby more valuable for publishers and third-party advertisers.
            </p>

            <h2>Specific Cookies We Use</h2>
            <table className="min-w-full border border-gray-300 my-6">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">Cookie Name</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Purpose</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">_ga</td>
                  <td className="border border-gray-300 px-4 py-2">Used by Google Analytics to distinguish users</td>
                  <td className="border border-gray-300 px-4 py-2">2 years</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">_gid</td>
                  <td className="border border-gray-300 px-4 py-2">Used by Google Analytics to distinguish users</td>
                  <td className="border border-gray-300 px-4 py-2">24 hours</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">_gat</td>
                  <td className="border border-gray-300 px-4 py-2">Used by Google Analytics to throttle request rate</td>
                  <td className="border border-gray-300 px-4 py-2">1 minute</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">session</td>
                  <td className="border border-gray-300 px-4 py-2">Used to maintain user session</td>
                  <td className="border border-gray-300 px-4 py-2">Session</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">remember_token</td>
                  <td className="border border-gray-300 px-4 py-2">Used to remember logged-in users</td>
                  <td className="border border-gray-300 px-4 py-2">30 days</td>
                </tr>
              </tbody>
            </table>

            <h2>Third-Party Cookies</h2>
            <p>
              In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the website, deliver advertisements on and through the website, and so on.
            </p>
            <p>
              These third parties may include:
            </p>
            <ul>
              <li>Google Analytics</li>
              <li>Facebook</li>
              <li>Stripe (for payment processing)</li>
              <li>YouTube (for video content)</li>
            </ul>

            <h2>How to Control Cookies</h2>
            <p>
              You can control and/or delete cookies as you wish. You can delete all cookies that are already on your computer and you can set most browsers to prevent them from being placed. If you do this, however, you may have to manually adjust some preferences every time you visit a site and some services and functionalities may not work.
            </p>
            <p>
              Most web browsers allow some control of most cookies through the browser settings. To find out more about cookies, including how to see what cookies have been set, visit <a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-800">www.allaboutcookies.org</a>.
            </p>

            <h3>How to Manage Cookies in Different Browsers</h3>
            <p>
              To find information relating to other browsers, visit the browser developer's website.
            </p>
            <ul>
              <li>
                <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-800">Google Chrome</a>
              </li>
              <li>
                <a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-800">Mozilla Firefox</a>
              </li>
              <li>
                <a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-800">Microsoft Edge</a>
              </li>
              <li>
                <a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-800">Safari</a>
              </li>
            </ul>

            <h2>Changes to This Cookie Policy</h2>
            <p>
              We may update our Cookie Policy from time to time. We will notify you of any changes by posting the new Cookie Policy on this page and updating the "Last Updated" date.
            </p>
            <p>
              You are advised to review this Cookie Policy periodically for any changes. Changes to this Cookie Policy are effective when they are posted on this page.
            </p>

            <h2>Contact Us</h2>
            <p>
              If you have any questions about our Cookie Policy, please contact us at:
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