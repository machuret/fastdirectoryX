import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, UserCircle, LogOut, LayoutDashboard, User, Settings } from 'lucide-react'; // Icons for menu and user
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSession, signOut } from 'next-auth/react'; // Import useSession and signOut

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { data: session, status } = useSession(); // Use NextAuth session
  const user = session?.user;
  const loading = status === 'loading';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/listings', label: 'Listings' },
    { href: '/categories', label: 'Categories' },
    { href: '/about', label: 'About Us' }, // Example link
    { href: '/contact', label: 'Contact' }, // Example link
  ];

  // Don't render auth buttons until loading is false to avoid flash of incorrect state
  const renderAuthButtons = () => {
    if (loading) return <div className="w-24 h-8 bg-gray-700 animate-pulse rounded-md"></div>; // Skeleton loader

    if (user) {
      return (
        <div className="flex items-center space-x-3">
          <span className="text-text-light hidden md:inline">{user.email}</span>
          {/* @ts-ignore */} 
          {user.role === 'ADMIN' && (
            <Link href="/admin/dashboard" passHref legacyBehavior>
              <Button variant="ghost" asChild className="text-text-light hover:bg-white/10 hover:text-white">
                <a><LayoutDashboard className="mr-2 h-4 w-4" /> Admin</a>
              </Button>
            </Link>
          )}
          {/* @ts-ignore */} 
          {user.role === 'USER' && (
            <Link href="/dashboard" passHref legacyBehavior>
              <Button variant="ghost" asChild className="text-text-light hover:bg-white/10 hover:text-white">
                <a><User className="mr-2 h-4 w-4" /> Dashboard</a>
              </Button>
            </Link>
          )}
          <Link href="/account/profile" passHref legacyBehavior> 
            <Button variant="ghost" asChild className="text-text-light hover:bg-white/10 hover:text-white">
              <a><Settings className="mr-2 h-4 w-4" /> Account</a>
            </Button>
          </Link>
          <Button onClick={() => signOut()} variant="ghost" className="text-text-light hover:bg-white/10 hover:text-white">
            <LogOut className="mr-2 h-4 w-4" /> Log Out
          </Button>
        </div>
      );
    } else {
      return (
        <>
          <Link href="/auth/login" passHref legacyBehavior>
            <Button variant="ghost" asChild className="text-text-light hover:bg-white/10 hover:text-white">
              <a>Log In</a>
            </Button>
          </Link>
          <Link href="/auth/signup" passHref legacyBehavior>
            <Button asChild className="bg-accent-purple hover:bg-purple-700 text-white">
              <a>Sign Up</a>
            </Button>
          </Link>
        </>
      );
    }
  };
  
  const renderMobileAuthButtons = () => {
    if (loading) return null;

    if (user) {
      return (
        <div className="pt-4 pb-3 border-t border-gray-700">
          <div className="flex items-center px-5">
            <UserCircle className="h-10 w-10 text-text-light" />
            <div className="ml-3">
              <p className="text-base font-medium text-text-light">{user.name || 'User'}</p>
              <p className="text-sm font-medium text-gray-400">{user.email}</p>
            </div>
          </div>
          <div className="mt-3 px-2 space-y-1">
            <Link href="/account/profile" passHref legacyBehavior>
              <Button variant="ghost" asChild className="w-full justify-start text-text-light hover:bg-white/10 hover:text-accent-purple block px-3 py-2 rounded-md text-base font-medium">
                <a><Settings className="mr-2 h-5 w-5" /> My Account</a>
              </Button>
            </Link>
            {/* @ts-ignore */} 
            {user.role === 'ADMIN' && (
              <Link href="/admin/dashboard" passHref legacyBehavior>
                <Button variant="ghost" asChild className="w-full justify-start text-text-light hover:bg-white/10 hover:text-accent-purple block px-3 py-2 rounded-md text-base font-medium">
                  <a><LayoutDashboard className="mr-2 h-5 w-5" /> Admin Panel</a>
                </Button>
              </Link>
            )}
            {/* @ts-ignore */} 
            {user.role === 'USER' && (
              <Link href="/dashboard" passHref legacyBehavior>
                <Button variant="ghost" asChild className="w-full justify-start text-text-light hover:bg-white/10 hover:text-accent-purple block px-3 py-2 rounded-md text-base font-medium">
                  <a><User className="mr-2 h-5 w-5" /> User Dashboard</a>
                </Button>
              </Link>
            )}
            <Button onClick={() => signOut()} variant="ghost" className="w-full justify-start text-text-light hover:bg-white/10 hover:text-accent-purple block px-3 py-2 rounded-md text-base font-medium">
              <LogOut className="mr-2 h-5 w-5" /> Log Out
            </Button>
          </div>
        </div>
      );
    } else {
      return (
        <>
          <Link href="/auth/login" passHref legacyBehavior>
            <Button variant="ghost" asChild className="w-full justify-start text-text-light hover:bg-white/10 hover:text-accent-purple block px-3 py-2 rounded-md text-base font-medium">
              <a>Log In</a>
            </Button>
          </Link>
          <Link href="/auth/signup" passHref legacyBehavior>
            <Button asChild className="w-full bg-accent-purple hover:bg-purple-700 text-white mt-1">
              <a>Sign Up</a>
            </Button>
          </Link>
        </>
      );
    }
  };

  return (
    <nav 
      className={cn(
        'sticky top-0 z-50 transition-all duration-300 ease-in-out',
        isScrolled ? 'bg-header-bg/90 backdrop-blur-md shadow-lg' : 'bg-header-bg'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Site Name */}
          <div className="flex-shrink-0">
            <Link href="/" legacyBehavior>
              <a className="text-2xl font-bold text-text-light hover:text-accent-purple transition-colors">
                SiteLogo
              </a>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            {navLinks.map((link) => (
              <Link key={link.label} href={link.href} legacyBehavior>
                <a className="text-text-light hover:text-accent-purple px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  {link.label}
                </a>
              </Link>
            ))}
          </div>

          {/* User Menu / Auth - Desktop */}
          <div className="hidden md:flex items-center space-x-3">
            {renderAuthButtons()}
          </div>

          {/* Mobile Menu Button */}
          <div className="-mr-2 flex md:hidden">
            <Button
              onClick={() => setIsOpen(!isOpen)}
              variant="ghost"
              className="inline-flex items-center justify-center p-2 rounded-md text-text-light hover:text-accent-purple hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent-purple"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-header-bg/95 backdrop-blur-md">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link key={link.label} href={link.href} legacyBehavior>
                <a className="text-text-light hover:bg-white/10 hover:text-accent-purple block px-3 py-2 rounded-md text-base font-medium transition-colors">
                  {link.label}
                </a>
              </Link>
            ))}
          </div>
          {/* User Menu / Auth - Mobile */}
          <div className="pt-4 pb-3 border-t border-white/20">
            <div className="flex items-center px-5">
              {/* <UserCircle className="h-10 w-10 text-text-light" /> */}
              {/* <div className="ml-3">
                <p className="text-base font-medium text-text-light">Guest User</p>
                <p className="text-sm font-medium text-gray-400">guest@example.com</p>
              </div> */}
            </div>
            <div className="mt-3 px-2 space-y-1">
              {renderMobileAuthButtons()}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
