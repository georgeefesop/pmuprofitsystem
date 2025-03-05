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

  // Get user's name from email
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
      className={cn(
        'sticky top-0 z-50 w-full border-b bg-gradient-to-r from-purple-800 to-purple-700 text-white shadow-md border-purple-500/30',
        scrolled ? 'shadow-sm' : ''
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-white">PMU Profit System</span>
          </Link>
          <nav className="hidden gap-6 md:flex">
            {navLinks.map((link) => (
              <Link
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
        </div>
        <div className="flex items-center gap-4">
          {!user && (
            <div className="hidden md:flex md:gap-4">
              {nonLoggedInLinks.map((link) => (
                <Link key={link.name} href={link.href}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white text-purple-700 hover:bg-purple-50 border-none"
                  >
                    {link.name}
                  </Button>
                </Link>
              ))}
              <Link href="/pre-checkout">
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
            <div className="flex items-center gap-2">
              <div className="hidden md:block">
                <span className="text-sm font-medium text-white">{userName}</span>
              </div>
              <div className="flex flex-col">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logout()}
                  className="hidden md:inline-flex text-white hover:text-purple-100 hover:bg-purple-800/50"
                >
                  Log out
                </Button>
                <Link href="/dashboard" className="hidden md:inline-flex">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-white text-purple-700 hover:bg-purple-50 border-none"
                  >
                    Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-white hover:bg-purple-800/50"
            onClick={handleMobileMenuToggle}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden">
              <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xs rounded-l-xl bg-purple-900/80 p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-white">PMU Profit System</span>
                  <Button
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
                <nav className="mt-6 flex flex-col gap-4">
                  {navLinks.map((link) => (
                    <Link
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
                  {!user && nonLoggedInLinks.map((link) => (
                    <Link
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
                  {!user && (
                    <Link
                      href="/pre-checkout"
                      className="block w-full text-left bg-white text-purple-700 hover:bg-purple-50 px-4 py-2 rounded-md transition-colors font-medium shadow-sm mt-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Buy Now
                    </Link>
                  )}
                  {user && (
                    <Button
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
