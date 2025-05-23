import React, { ReactNode, useEffect } from 'react';
import Head from 'next/head'; 
import Link from 'next/link';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string; 
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title = 'Admin Dashboard' }) => {
  useEffect(() => {
  }, [title]);

  return (
    <>
      <Head>
        <title>{title} - Admin Panel</title>
      </Head>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-gray-800 text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <Link href="/admin" legacyBehavior>
              <a className="font-bold text-lg">Admin Panel</a>
            </Link>
            <div className="space-x-4 flex items-center">
              <Link href="/admin/pages-cms" legacyBehavior>
                <a className="hover:text-gray-300">Pages CMS</a>
              </Link>
              <Link href="/admin/listings" legacyBehavior>
                <a className="hover:text-gray-300">Business Listings</a>
              </Link>
              <Link href="/admin/usermanagement" legacyBehavior>
                <a className="hover:text-gray-300">User Management</a>
              </Link>
              <Link href="/admin/optimize/description" legacyBehavior>
                <a className="hover:text-gray-300">Optimize Descriptions</a>
              </Link>
              
              {/* Settings Dropdown */}
              <div className="relative group">
                <button className="hover:text-gray-300 focus:outline-none py-2 px-1 inline-flex items-center">
                  <span>Settings</span>
                  <svg className="fill-current h-4 w-4 ml-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </button>
                <div className="absolute right-0 mt-0 w-48 bg-gray-800 rounded-md shadow-lg py-1 hidden group-hover:block z-50">
                  <Link href="/admin/promptvault" legacyBehavior>
                    <a className="block px-4 py-2 text-sm text-white hover:bg-gray-700">Prompt Vault</a>
                  </Link>
                  <Link href="/admin/apicheck" legacyBehavior>
                    <a className="block px-4 py-2 text-sm text-white hover:bg-gray-700">AI Check</a>
                  </Link>
                </div>
              </div>

              {/* Add more admin navigation links here */}
            </div>
          </div>
        </nav>
        <main className="container mx-auto p-4">
          {children}
        </main>
        <footer className="bg-gray-700 text-white text-center p-4 mt-8">
          <p>&copy; {new Date().getFullYear()} Your Company Admin</p>
        </footer>
      </div>
    </>
  );
};

export default AdminLayout;
