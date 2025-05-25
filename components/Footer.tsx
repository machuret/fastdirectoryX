// c:\alpha\components\Footer.tsx
import React from 'react';
import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react'; // Example social icons
import { DisplayMenuItemFE } from '@/lib/menu'; 

interface FooterProps {
  menuItems?: DisplayMenuItemFE[]; // Retaining this if you plan to populate links dynamically
}

const Footer: React.FC<FooterProps> = ({ menuItems }) => {
  // Example static data, replace with dynamic data or props as needed
  const defaultSiteName = "SiteLogo";
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: '#' },
    { name: 'Twitter', icon: Twitter, href: '#' },
    { name: 'Instagram', icon: Instagram, href: '#' },
    { name: 'LinkedIn', icon: Linkedin, href: '#' },
  ];

  // Example menu structure, adapt based on menuItems prop or actual site structure
  const linkSections = [
    {
      title: 'Explore',
      // Ensure fallback data matches DisplayMenuItemFE structure (id, label, url, menu_group)
      links: menuItems?.filter(item => item.menu_group === 'explore') || [
        { id: 'f1', label: 'Listings', url: '/listings', menu_group: 'explore' },
        { id: 'f2', label: 'Categories', url: '/categories', menu_group: 'explore' },
        { id: 'f3', label: 'Blog', url: '/blog', menu_group: 'explore' },
      ],
    },
    {
      title: 'Company',
      links: menuItems?.filter(item => item.menu_group === 'company') || [
        { id: 'f4', label: 'About Us', url: '/about', menu_group: 'company' },
        { id: 'f5', label: 'Contact', url: '/contact', menu_group: 'company' },
        { id: 'f6', label: 'Careers', url: '/careers', menu_group: 'company' },
      ],
    },
    {
      title: 'Legal',
      links: menuItems?.filter(item => item.menu_group === 'legal') || [
        { id: 'f7', label: 'Privacy Policy', url: '/privacy', menu_group: 'legal' },
        { id: 'f8', label: 'Terms of Service', url: '/terms', menu_group: 'legal' },
      ],
    },
  ];

  return (
    <footer className="bg-footer-bg text-footer-font border-t border-border py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: Logo/Site Info */}
          <div className="md:col-span-2 lg:col-span-1">
            <Link href="/" legacyBehavior>
              <a className="text-2xl font-bold text-primary hover:text-accent-purple transition-colors">
                {defaultSiteName}
              </a>
            </Link>
            <p className="mt-4 text-sm text-text-secondary-gray">
              Your go-to directory for finding the best local businesses and services.
            </p>
            <div className="mt-6 flex space-x-4">
              {socialLinks.map((social) => (
                <a key={social.name} href={social.href} className="text-text-secondary-gray hover:text-accent-purple transition-colors">
                  <span className="sr-only">{social.name}</span>
                  <social.icon className="h-6 w-6" />
                </a>
              ))}
            </div>
          </div>

          {/* Columns 2-4: Navigation Links */}
          {linkSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-text-primary-dark tracking-wider uppercase">{section.title}</h3>
              <ul role="list" className="mt-4 space-y-2">
                {section.links.map((item) => (
                  <li key={item.id}> 
                    <Link href={item.url || '#'} legacyBehavior>
                      <a className="text-base text-text-secondary-gray hover:text-accent-purple transition-colors">
                        {item.label}
                      </a>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar: Copyright */}
        <div className="mt-12 border-t border-border pt-8 text-center">
          <p className="text-sm text-text-secondary-gray">
            &copy; {currentYear} {defaultSiteName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

// Exporting as named export to match the import in Layout.tsx
export { Footer }; 
