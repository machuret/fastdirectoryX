// c:\alpha\components\Layout.tsx
import React from 'react';
import Navbar from './Navbar'; 
import { Footer } from './Footer';
import { ScrollArea } from '@/components/ui/scroll-area'; 
import { DisplayMenuItemFE } from '@/lib/menu';

interface LayoutProps {
  children: React.ReactNode;
  headerMenuItems?: DisplayMenuItemFE[]; 
  footerMenuItems?: DisplayMenuItemFE[];
}

const Layout: React.FC<LayoutProps> = ({ children, footerMenuItems }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-grow">
        <ScrollArea className="h-full">
          {children}
        </ScrollArea>
      </main>
      <Footer menuItems={footerMenuItems} />
    </div>
  );
};

export default Layout;
