import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import withAdminAuth from '@/hoc/withAdminAuth';
import AdminLayout from '@/components/admin/AdminLayout'; 
import { useAdminHeader } from '@/components/AdminHeaderContext';
import { Users as UsersIcon } from 'lucide-react';
import type { NextPageWithLayout, MyAppPageProps } from '@/pages/_app';
import { iconMap } from '@/components/admin/iconMap';
import type { LucideIcon } from 'lucide-react';

// Define a type for the user data we expect
interface UserData {
  user_id: number;
  name: string | null;
  email: string | null;
  role: string; 
  createdAt: string; 
}

const AdminUserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setPageSpecificHeaderElements } = useAdminHeader();

  useEffect(() => {
    setPageSpecificHeaderElements({
      title: 'User Management',
      icon: <UsersIcon />,
      description: 'View and manage user accounts.',
    });
  }, [setPageSpecificHeaderElements]);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/admin/users');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch users');
        }
        const data: UserData[] = await response.json();
        setUsers(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <>
      <Head>
        <title>User Management - Admin</title>
      </Head>
      <div className="container mx-auto py-8">
        {isLoading && <p>Loading users...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}
        {!isLoading && !error && (
          <div className="bg-white shadow rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  {/* Add more columns as needed, e.g., for actions like Edit/Delete */}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No users found.</td>
                  </tr>
                )}
                {users.map((user) => (
                  <tr key={user.user_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.user_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'ADMIN' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

const AuthedAdminUserManagementPage = withAdminAuth(AdminUserManagementPage);

(AuthedAdminUserManagementPage as NextPageWithLayout).getLayout = function getLayout(page: React.ReactElement, pageProps: MyAppPageProps) {
  const defaultPageTitle = "User Management";
  const DefaultPageIconComponent: LucideIcon = UsersIcon; // Corrected to UsersIcon

  const titleForLayout = pageProps?.pageTitle || defaultPageTitle;
  
  let iconComponentForLayout: React.ElementType = DefaultPageIconComponent;
  if (pageProps?.pageIcon) {
    if (typeof pageProps.pageIcon === 'string' && iconMap[pageProps.pageIcon as keyof typeof iconMap]) {
      iconComponentForLayout = iconMap[pageProps.pageIcon as keyof typeof iconMap];
    } else if (typeof pageProps.pageIcon !== 'string') { // It's already an ElementType
      iconComponentForLayout = pageProps.pageIcon;
    } 
  }

  const descriptionForLayout = pageProps?.pageDescription || "View and manage application users.";
  const actionButtonsForLayout = pageProps?.actionButtons;

  return (
    <AdminLayout
      pageTitle={titleForLayout}
      pageIcon={iconComponentForLayout}
      pageDescription={descriptionForLayout}
      actionButtons={actionButtonsForLayout}
    >
      {page}
    </AdminLayout>
  );
};

export default AuthedAdminUserManagementPage;
