// c:\alpha\pages\admin\dashboard.tsx
import React from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import withAdminAuth from '@/hoc/withAdminAuth';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

const AdminDashboardPage: NextPage = () => {
  return (
    <div>
      {/* <h1 className="text-2xl font-semibold text-gray-800">Admin Dashboard</h1> // Title now handled by Layout */}
      <p className="mt-2 text-gray-600">Welcome to the admin area. Select a tool from the sidebar to get started.</p>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Example Quick Access Cards - You can customize these or make them dynamic */}
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-sky-700">Menu Manager</h3>
          <p className="text-sm text-gray-500 mt-1">Manage header and footer navigation menus.</p>
          <a href="/admin/menus" className="text-sm text-sky-600 hover:text-sky-800 mt-3 inline-block">Go to Menu Manager →</a>
        </div>
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-sky-700">Listings</h3>
          <p className="text-sm text-gray-500 mt-1">View, edit, and manage business listings.</p>
          <a href="/admin/listings" className="text-sm text-sky-600 hover:text-sky-800 mt-3 inline-block">Go to Listings →</a>
        </div>
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-sky-700">Homepage Settings</h3>
          <p className="text-sm text-gray-500 mt-1">Customize homepage sections and content.</p>
          <a href="/admin/settings/homepage" className="text-sm text-sky-600 hover:text-sky-800 mt-3 inline-block">Go to Homepage Settings →</a>
        </div>
        {/* Add more cards for other tools as needed */}
      </div>
    </div>
  );
};

// Pass pageTitle to _app.tsx so AdminLayout there can use it
export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  // If you want to enforce server-side auth redirection here as well (recommended for SSR pages):
  // if (!session || (session.user as any)?.role !== 'ADMIN') {
  //   return {
  //     redirect: {
  //       destination: `/login?callbackUrl=${encodeURIComponent(context.resolvedUrl)}`,
  //       permanent: false,
  //     },
  //   };
  // }

  return {
    props: {
      session,
      pageTitle: 'Admin Dashboard',
      pageIconName: 'LayoutDashboard',
    },
  };
};

export default withAdminAuth(AdminDashboardPage);
