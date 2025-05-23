import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signOut } from 'next-auth/react'; // Added signOut import
import { cn } from '@/lib/utils'; 
import { AdminHeaderProvider, useAdminHeader } from '../AdminHeaderContext'; 
import type { DisplayMenuItemFE } from '@/lib/menu'; 
import {
  LayoutDashboard, MenuSquare, FileText, List, ShieldCheck, Tag, Settings, LogOut, Home, Image as ImageIcon, UploadCloud, Users,
  MessageSquarePlus,
  MessagesSquare,
  Star,
  HelpCircle, // Added HelpCircle icon for Website FAQs
  ListTree, // Added ListTree icon for Menu Management
  Archive, // Added Archive icon for Prompt Vault
  Activity, // Added Activity icon for AI Check
  Sparkles, // Added Sparkles icon for AI Content
} from 'lucide-react'; 

interface AdminLayoutProps {
  children: React.ReactNode;
  pageTitle: string;
  pageIcon?: React.ElementType; // Added pageIcon
  pageDescription?: string; // Added pageDescription
  actionButtons?: React.ReactNode; // Added actionButtons
  headerMenuItems?: DisplayMenuItemFE[];
  footerMenuItems?: DisplayMenuItemFE[];
}

const mainNavItems = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Menus', path: '/admin/menus', icon: MenuSquare },
  { name: 'Pages (CMS)', path: '/admin/pages-cms', icon: FileText },
  { name: 'Listings', path: '/admin/listings', icon: List },
  { name: 'Ownership Claims', path: '/admin/ownership', icon: ShieldCheck },
  { name: 'Categories', path: '/admin/listingcategories', icon: Tag },
];

const toolNavItems = [
  { name: 'Logo Management', path: '/admin/logos', icon: ImageIcon },
  { name: 'Listing Importer', path: '/admin/importer', icon: UploadCloud },
  { name: 'Mass FAQ Generator', path: '/admin/tools/mass-faq', icon: MessageSquarePlus },
  { name: 'Featured Listings', path: '/admin/featured', icon: Star },
  { name: 'Website FAQs', path: '/admin/own-faq', icon: HelpCircle }, // Added Website FAQs
  { name: 'Menu Management', path: '/admin/menus', icon: ListTree }, // Added Menu Management
  { name: 'Guides', path: '/admin/guides', icon: Sparkles }, // Renamed from AI Content
];

const settingsNavItems = [
  { name: 'Homepage Settings', path: '/admin/settings/homepage', icon: Settings },
  { name: 'User Management', path: '/admin/users', icon: Users },
  { name: 'Contact Form', path: '/admin/settings/contactform', icon: FileText }, // Added Contact Form link
  { name: 'Prompt Vault', path: '/admin/promptvault', icon: Archive },
  { name: 'AI Check', path: '/admin/apicheck', icon: Activity },
];

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, pageTitle, pageIcon, pageDescription, actionButtons, headerMenuItems, footerMenuItems }) => {
  const router = useRouter();

  const LayoutContent: React.FC = () => {
    const { headerElements } = useAdminHeader();
    return (
      <div className="min-h-screen flex bg-background text-foreground font-sans">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-border flex-shrink-0 fixed h-full flex flex-col shadow-subtle">
          <div className="p-4 border-b border-border">
            <Link href="/admin/dashboard" legacyBehavior>
              <a className="flex items-center space-x-2 text-xl font-semibold text-gray-800 hover:text-primary transition-colors">
                <span>Admin Panel</span>
              </a>
            </Link>
          </div>

          <nav className="flex-grow p-4 space-y-6 overflow-y-auto">
            <div>
              <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Main</h3>
              <div className="space-y-1">
                {mainNavItems.map((item) => (
                  <NavLink key={item.name} href={item.path} icon={item.icon}>
                    {item.name}
                  </NavLink>
                ))}
              </div>
            </div>

            <div>
              <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tools</h3>
              <div className="space-y-1">
                {toolNavItems.map((item) => (
                  <NavLink key={item.name} href={item.path} icon={item.icon}>
                    {item.name}
                  </NavLink>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Settings</h3>
              <div className="space-y-1">
                {settingsNavItems.map((item) => (
                  <NavLink key={item.name} href={item.path} icon={item.icon}>
                    {item.name}
                  </NavLink>
                ))}
              </div>
            </div>
          </nav>

          <div className="p-4 border-t border-border mt-auto">
            <div className="space-y-1">
              <NavLink href="/" icon={Home}>
                View Site
              </NavLink>
              <button 
                onClick={() => signOut({ callbackUrl: '/login' })} // Implemented signOut
                className="flex items-center space-x-3 w-full px-3 py-2.5 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main content area */} 
        <main className="flex-1 ml-64 p-0">
          {/* Header rebuilt using headerElements from context */}
          <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-border">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4"> {/* Adjusted padding to match content area */} 
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-y-2">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                    {headerElements.icon && React.isValidElement(headerElements.icon) && 
                      React.cloneElement(headerElements.icon as React.ReactElement, { className: "mr-3 h-7 w-7 text-primary" })}
                    {headerElements.title || pageTitle} {/* Fallback to pageTitle prop if context title is not set */}
                  </h1>
                  {headerElements.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {headerElements.description}
                    </p>
                  )}
                </div>
                {headerElements.actionButtons && ( 
                  <div className="flex items-center gap-2">
                    {headerElements.actionButtons}
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className="p-4 sm:p-6 lg:p-8">
            {/* The main pageTitle from AdminLayout prop is now primarily for the AdminHeaderProvider's initial title */}
            {/* It will be displayed by the header above. If a separate h1 is still desired here, it can be added. */}
            {/* For now, assuming the header above handles the title display. */}
            {children}
          </div>
        </main>
      </div>
    );
  };

  const NavLink = ({ href, children, icon: Icon }: { href: string; children: React.ReactNode; icon: React.ElementType }) => (
    <Link href={href} legacyBehavior>
      <a
        className={cn(
          'flex items-center space-x-3 w-full px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
          router.pathname === href || (href !== '/admin/dashboard' && router.pathname.startsWith(href))
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
        )}
      >
        <Icon className="h-5 w-5" />
        <span>{children}</span>
      </a>
    </Link>
  );

  // Create an element from pageIcon if it exists
  const iconElement = pageIcon ? React.createElement(pageIcon) : undefined;

  return (
    <AdminHeaderProvider initialBaseElements={{ 
      title: pageTitle, 
      icon: iconElement, 
      description: pageDescription,
      actionButtons: actionButtons // Pass actionButtons
    }}>
      <LayoutContent />
    </AdminHeaderProvider>
  );
};

export default AdminLayout;
