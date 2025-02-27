import React from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/container';

const SiteFooter = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-100">
      <Container className="py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3">PMU PROFIT SYSTEM</h2>
            <p className="text-sm text-gray-600 mb-5">
              The ultimate marketing system for PMU specialists looking to grow their business.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://facebook.com" 
                className="text-purple-600 hover:text-purple-700 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="sr-only">Facebook</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a 
                href="https://instagram.com" 
                className="text-purple-600 hover:text-purple-700 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="sr-only">Instagram</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
          
          {/* Navigation Links */}
          <div>
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">
              Navigation
            </h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/" 
                  className="text-xs text-gray-600 hover:text-purple-600 transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  href="/#features" 
                  className="text-xs text-gray-600 hover:text-purple-600 transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link 
                  href="/#testimonials" 
                  className="text-xs text-gray-600 hover:text-purple-600 transition-colors"
                >
                  Testimonials
                </Link>
              </li>
              <li>
                <Link 
                  href="/#faq" 
                  className="text-xs text-gray-600 hover:text-purple-600 transition-colors"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Company Links */}
          <div>
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">
              Company
            </h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/about" 
                  className="text-xs text-gray-600 hover:text-purple-600 transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  className="text-xs text-gray-600 hover:text-purple-600 transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Legal Links */}
          <div>
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">
              Legal
            </h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/privacy" 
                  className="text-xs text-gray-600 hover:text-purple-600 transition-colors"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link 
                  href="/terms" 
                  className="text-xs text-gray-600 hover:text-purple-600 transition-colors"
                >
                  Terms
                </Link>
              </li>
              <li>
                <Link 
                  href="/cookies" 
                  className="text-xs text-gray-600 hover:text-purple-600 transition-colors"
                >
                  Cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-10 pt-6 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center">
          <p className="text-xs text-gray-600 mb-4 md:mb-0">© {new Date().getFullYear()} PMU Profit System. All rights reserved.</p>
          <div className="flex space-x-6">
            <Link href="/privacy" className="text-xs text-gray-500 hover:text-purple-600 transition-colors">
              <span className="sr-only">Privacy Policy</span>
              Privacy
            </Link>
            <Link href="/terms" className="text-xs text-gray-500 hover:text-purple-600 transition-colors">
              <span className="sr-only">Terms of Service</span>
              Terms
            </Link>
            <Link href="/cookies" className="text-xs text-gray-500 hover:text-purple-600 transition-colors">
              <span className="sr-only">Cookie Policy</span>
              Cookies
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default SiteFooter; 