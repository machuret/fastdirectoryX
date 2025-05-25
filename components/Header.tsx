// c:\alpha\components\Header.tsx
import React from 'react';
import Link from 'next/link';
import { DisplayMenuItemFE } from '@/lib/menu'; // Adjust path if necessary

interface HeaderProps {
  menuItems?: DisplayMenuItemFE[];
}

const Header: React.FC<HeaderProps> = ({ menuItems }) => {
  const renderMenuItems = (items: DisplayMenuItemFE[]) => {
    return items.map((item) => (
      <li key={item.id} className="mr-4 last:mr-0">
        <Link href={item.url || '#'} target={item.target || '_self'}>
          {item.label}
        </Link>
        {item.children && item.children.length > 0 && (
          <ul className="ml-4 pl-4 border-l border-gray-300"> {/* Basic styling for sub-menu */}
            {renderMenuItems(item.children)}
          </ul>
        )}
      </li>
    ));
  };

  return (
    <header className="bg-header-bg text-header-font p-4">
      <nav className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          YourLogo
        </Link>
        {menuItems && menuItems.length > 0 ? (
          <ul className="flex">
            {renderMenuItems(menuItems)}
          </ul>
        ) : (
          <p>No header menu items configured.</p>
        )}
      </nav>
    </header>
  );
};

export default Header;
