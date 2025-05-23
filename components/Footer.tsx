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
      links: menuItems?.filter(item => item.menu_group === 'explore') || [
        { menu_item_id: 'f1', title: 'Listings', path: '/listings', menu_group: 'explore' },
        { menu_item_id: 'f2', title: 'Categories', path: '/categories', menu_group: 'explore' },
        { menu_item_id: 'f3', title: 'Blog', path: '/blog', menu_group: 'explore' },
      ],
    },
    {
      title: 'Company',
      links: menuItems?.filter(item => item.menu_group === 'company') || [
        { menu_item_id: 'f4', title: 'About Us', path: '/about', menu_group: 'company' },
        { menu_item_id: 'f5', title: 'Contact', path: '/contact', menu_group: 'company' },
        { menu_item_id: 'f6', title: 'Careers', path: '/careers', menu_group: 'company' },
      ],
    },
    {
      title: 'Legal',
      links: menuItems?.filter(item => item.menu_group === 'legal') || [
        { menu_item_id: 'f7', title: 'Privacy Policy', path: '/privacy', menu_group: 'legal' },
        { menu_item_id: 'f8', title: 'Terms of Service', path: '/terms', menu_group: 'legal' },
      ],
    },
  ];

  return (
    <footer className="bg-background-alt text-text-primary-dark border-t border-border py-12 md:py-16">
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
                  <li key={item.menu_item_id}>
                    <Link href={item.path || '#'} legacyBehavior>
                      <a className="text-base text-text-secondary-gray hover:text-accent-purple transition-colors">
                        {item.title}
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
