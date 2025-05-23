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
            <div className="space-x-4">
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
