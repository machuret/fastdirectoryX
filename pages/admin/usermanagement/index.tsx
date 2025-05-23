import React, { useState, useEffect } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import { getSession } from 'next-auth/react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout'; // Preferred sidebar AdminLayout
import { UserRole, UserStatus } from '@prisma/client'; // For type safety

interface UserFromAPI {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string; // Dates will be strings from JSON
  updatedAt: string;
  image?: string | null;
  emailVerified?: string | null; // Dates will be strings from JSON
}

interface UserManagementProps {
  usersInitial: UserFromAPI[];
  error?: string;
}

// Helper component to format date on client side to avoid hydration mismatch
const ClientSideDate = ({ dateString }: { dateString: string | Date }) => {
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    // Check if dateString is already a string from serialization or a Date object
    const dateObj = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (dateObj instanceof Date && !isNaN(dateObj.valueOf())) {
      setFormattedDate(dateObj.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      }));
    } else {
      setFormattedDate('Invalid Date'); // Fallback for invalid dates
    }
  }, [dateString]);

  return <>{formattedDate || 'Loading date...'}</>; // Show loading or fallback
};

const UserManagementPage: NextPage<UserManagementProps> = ({ usersInitial, error }) => {
  const [users, setUsers] = useState<UserFromAPI[]>(usersInitial || []);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }
      setUsers(users.filter(user => user.id !== userId));
      setFeedback({ type: 'success', message: 'User deleted successfully.' });
    } catch (err: any) {
      console.error('Delete user error:', err);
      setFeedback({ type: 'error', message: err.message || 'An error occurred while deleting the user.' });
    }
  };

  if (error) {
    return (
      <AdminLayout pageTitle="User Management">
        <p className="text-red-500">Error loading users: {error}</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout pageTitle="User Management">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">User Management</h1>
          <Link href="/admin/usermanagement/new" legacyBehavior>
            <a className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              Add New User
            </a>
          </Link>
        </div>

        {feedback && (
          <div className={`p-4 mb-4 text-sm rounded-lg ${feedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {feedback.message}
          </div>
        )}

        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          {users.length === 0 ? (
            <p className="p-4 text-center text-gray-500">No users found.</p>
          ) : (
            <table className="min-w-full leading-normal">
              <thead>
                <tr>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Joined</th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 border-b border-gray-200 bg-white text-sm">{user.name || 'N/A'}</td>
                    <td className="px-5 py-4 border-b border-gray-200 bg-white text-sm">{user.email}</td>
                    <td className="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === UserRole.ADMIN ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                       <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === UserStatus.ACTIVE ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 border-b border-gray-200 bg-white text-sm"><ClientSideDate dateString={user.createdAt} /></td>
                    <td className="px-5 py-4 border-b border-gray-200 bg-white text-sm whitespace-nowrap">
                      <Link href={`/admin/usermanagement/edit/${user.id}`} legacyBehavior>
                        <a className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</a>
                      </Link>
                      <button 
                        onClick={() => handleDeleteUser(user.id)} 
                        className="text-red-600 hover:text-red-900"
                        // Disable delete for the current admin user if we knew their ID here
                        // This check is better done server-side or by comparing with session.user.id
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  // @ts-ignore session.user.role is custom and may not be on default NextAuth Session type
  if (!session || session.user?.role !== UserRole.ADMIN) {
    return {
      redirect: {
        destination: '/login?error=NotAuthorizedAdmin',
        permanent: false,
      },
    };
  }

  try {
    // Fetch users from your API. Make sure the base URL is correct for SSR.
    // In a real app, use an internal fetch or directly call your service layer.
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'; 
    const res = await fetch(`${baseUrl}/api/admin/users`, {
      headers: {
        // Pass along the session cookie if needed for API route authentication
        // This is typically handled by Next.js automatically for same-origin fetches
        // but can be explicit if issues arise or if API is on a different domain.
        'Cookie': context.req.headers.cookie || '', 
      },
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error('SSR Error fetching users:', errorData.message);
      return { props: { usersInitial: [], error: errorData.message || 'Failed to load users.' } };
    }

    const usersInitial: UserFromAPI[] = await res.json();
    return {
      props: { usersInitial },
    };
  } catch (error: any) {
    console.error('SSR Exception fetching users:', error);
    return { props: { usersInitial: [], error: 'An unexpected error occurred.' } };
  }
};

export default UserManagementPage;
