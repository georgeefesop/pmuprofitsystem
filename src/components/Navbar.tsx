'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  
  // Check if we're on a dashboard page
  const isDashboardPage = pathname.startsWith('/dashboard');

  // Get user's name from email - keeping this for potential future use
  const userName = user?.email ? user.email.split('@')[0] : 'User';

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Features', href: '/#features' },
    { name: 'Pricing', href: '/#pricing' },
    { name: 'FAQ', href: '/#faq' },
  ];

  // Links that should only be shown to non-logged in users
  const nonLoggedInLinks = [
    { name: 'Login', href: '/login' },
  ];

  // Links that should only be shown to logged in users
  const loggedInLinks = [
    { name: 'Dashboard', href: '/dashboard' },
  ];

  return (
    <header
      id="main-navbar"
      className={cn(
        'sticky top-0 z-50 w-full border-b bg-gradient-to-r from-purple-800 to-purple-700 text-white shadow-md border-purple-500/30',
        scrolled ? 'shadow-sm' : ''
      )}
    >
      <div id="navbar-container" className="container flex h-16 items-center justify-between">
        <div id="navbar-left" className="flex items-center gap-2 md:gap-6">
          <Link id="navbar-logo" href="/" className="flex items-center pl-6">
            <span className="text-xl font-bold text-white">PMU Profit System</span>
          </Link>
          {/* Only show nav links if not on dashboard page */}
          {!isDashboardPage && (
            <nav id="desktop-nav" className="hidden gap-4 md:flex">
              {navLinks.map((link) => (
                <Link
                  id={`nav-link-${link.name.toLowerCase()}`}
                  key={link.name}
                  href={link.href}
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-purple-100',
                    pathname === link.href
                      ? 'text-white'
                      : 'text-white/80'
                  )}
                >
                  {link.name}
                </Link>
              ))}
              {user && loggedInLinks.map((link) => (
                <Link
                  id={`nav-link-${link.name.toLowerCase()}`}
                  key={link.name}
                  href={link.href}
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-purple-100',
                    pathname === link.href
                      ? 'text-white'
                      : 'text-white/80'
                  )}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          )}
        </div>
        <div id="navbar-right" className="flex items-center gap-4">
          {!user && (
            <div id="auth-buttons" className="hidden md:flex md:gap-4">
              {nonLoggedInLinks.map((link) => (
                <Link id={`auth-button-${link.name.toLowerCase()}`} key={link.name} href={link.href}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white text-purple-700 hover:bg-purple-50 border-none"
                  >
                    {link.name}
                  </Button>
                </Link>
              ))}
              <Link id="buy-now-button" href="/pre-checkout">
                <Button
                  variant="default"
                  size="sm"
                  className="bg-white text-purple-700 hover:bg-purple-50"
                >
                  Buy Now
                </Button>
              </Link>
            </div>
          )}

          {user && (
            <div id="user-menu" className="flex items-center gap-2">
              <div id="user-actions" className="flex items-center gap-2">
                <Button
                  id="logout-button"
                  variant="ghost"
                  size="sm"
                  onClick={() => logout()}
                  className="hidden md:inline-flex text-white hover:text-purple-100 hover:bg-purple-800/50"
                >
                  Log out
                </Button>
                {/* Only show dashboard button if not on dashboard page */}
                {!isDashboardPage && (
                  <Link id="dashboard-button-link" href="/dashboard" className="hidden md:inline-flex">
                    <Button 
                      id="dashboard-button"
                      variant="outline" 
                      size="sm"
                      className="bg-white text-purple-700 hover:bg-purple-50 border-none whitespace-nowrap"
                    >
                      Dashboard
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}

          <Button
            id="mobile-menu-toggle"
            variant="ghost"
            size="icon"
            className="md:hidden text-white hover:bg-purple-800/50"
            onClick={handleMobileMenuToggle}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          
          {mobileMenuOpen && (
            <div id="mobile-menu-overlay" className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden">
              <div id="mobile-menu" className="fixed inset-y-0 right-0 z-50 w-full max-w-xs rounded-l-xl bg-purple-900/80 p-6 shadow-lg">
                <div id="mobile-menu-header" className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-white">PMU Profit System</span>
                  <Button
                    id="mobile-menu-close"
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-white hover:bg-purple-800/50"
                  >
                    <span className="sr-only">Close menu</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6"
                    >
                      <path d="M18 6 6 18"></path>
                      <path d="m6 6 12 12"></path>
                    </svg>
                  </Button>
                </div>
                <nav id="mobile-nav" className="mt-6 flex flex-col gap-4">
                  {/* Only show nav links if not on dashboard page */}
                  {!isDashboardPage && (
                    <>
                      {navLinks.map((link) => (
                        <Link
                          id={`mobile-nav-link-${link.name.toLowerCase()}`}
                          key={link.name}
                          href={link.href}
                          className={cn(
                            'text-base font-medium transition-colors hover:text-purple-100 p-2 rounded hover:bg-purple-800/50',
                            pathname === link.href
                              ? 'text-white'
                              : 'text-white/80'
                          )}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {link.name}
                        </Link>
                      ))}
                      {user && loggedInLinks.map((link) => (
                        <Link
                          id={`mobile-nav-link-${link.name.toLowerCase()}`}
                          key={link.name}
                          href={link.href}
                          className={cn(
                            'text-base font-medium transition-colors hover:text-purple-100 p-2 rounded hover:bg-purple-800/50',
                            pathname === link.href
                              ? 'text-white'
                              : 'text-white/80'
                          )}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {link.name}
                        </Link>
                      ))}
                    </>
                  )}
                  {!user && (
                    <>
                      {nonLoggedInLinks.map((link) => (
                        <Link
                          id={`mobile-nav-link-${link.name.toLowerCase()}`}
                          key={link.name}
                          href={link.href}
                          className={cn(
                            'text-base font-medium transition-colors hover:text-purple-100 p-2 rounded hover:bg-purple-800/50',
                            pathname === link.href
                              ? 'text-white'
                              : 'text-white/80'
                          )}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {link.name}
                        </Link>
                      ))}
                      <Link
                        id="mobile-buy-now-button"
                        href="/pre-checkout"
                        className="block w-full text-left bg-white text-purple-700 hover:bg-purple-50 px-4 py-2 rounded-md transition-colors font-medium shadow-sm mt-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Buy Now
                      </Link>
                    </>
                  )}
                  {user && (
                    <Button
                      id="mobile-logout-button"
                      variant="outline"
                      className="mt-4 w-full justify-start bg-white text-purple-700 hover:bg-purple-50"
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                    >
                      Log out
                    </Button>
                  )}
                </nav>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
