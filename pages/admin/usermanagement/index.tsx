import React, { useState, useEffect } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import { getSession } from 'next-auth/react';
import Link from 'next/link';
import { UserRole, UserStatus } from '@prisma/client'; // For type safety

/**
 * Interface representing the structure of a user object as fetched from the API.
 */
interface UserFromAPI {
  /** The unique identifier of the user. */
  id: string;
  /** The name of the user (can be null). */
  name: string | null;
  /** The email address of the user. */
  email: string;
  /** The role of the user (e.g., ADMIN, USER). */
  role: UserRole;
  /** The status of the user (e.g., ACTIVE, PENDING). */
  status: UserStatus;
  /** The creation date of the user account (ISO string). */
  createdAt: string; // Dates will be strings from JSON
  /** The last update date of the user account (ISO string). */
  updatedAt: string;
  /** The URL of the user's profile image (can be null). */
  image?: string | null;
  /** The date the user's email was verified (ISO string, can be null). */
  emailVerified?: string | null; // Dates will be strings from JSON
}

/**
 * Props for the {@link UserManagementPage} component.
 */
interface UserManagementProps {
  /** Initial list of users fetched server-side. */
  usersInitial: UserFromAPI[];
  /** Optional error message if fetching users failed server-side. */
  error?: string;
  /** Page title passed by getServerSideProps for _app.tsx to use. */
  pageTitle: string;
}

// Helper component to format date on client side to avoid hydration mismatch
/**
 * A client-side component to format and display a date string.
 * This helps avoid hydration mismatches that can occur when formatting dates
 * that differ between server-render and client-render.
 * @param {object} props - The component's props.
 * @param {string | Date} props.dateString - The date string (ISO format) or Date object to format.
 * @returns {JSX.Element} The formatted date or a loading/fallback message.
 */
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

/**
 * The main page component for managing users in the admin panel.
 * Displays a list of users and allows for adding, editing, and deleting users.
 * @param {UserManagementProps} props - The props for the component, including initial user data.
 * @returns {JSX.Element} The rendered user management page.
 */
const UserManagementPage: NextPage<UserManagementProps> = ({ usersInitial, error, pageTitle }) => {
  const [users, setUsers] = useState<UserFromAPI[]>(usersInitial || []);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  /**
   * Handles the deletion of a user.
   * Prompts for confirmation, then sends a DELETE request to the API.
   * Updates the local user list and feedback state based on the outcome.
   * @param {string} userId - The ID of the user to delete.
   */
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
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">{pageTitle}</h1>
        <p className="text-red-500">Error loading users: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{pageTitle}</h1>
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
  );
};

/**
 * Server-side properties for the User Management page.
 * Fetches the initial list of users and ensures the current user is an admin.
 * Redirects to login if not authorized.
 * @param {GetServerSidePropsContext} context - The Next.js context object for server-side props.
 * @returns {Promise<GetServerSidePropsResult<UserManagementProps>>} The server-side props, including users or a redirect.
 */
export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  const pageTitle = "User Management"; // Added for _app.tsx to use

  // @ts-ignore session.user.role is custom and may not be on default NextAuth Session type
  if (!session || session.user?.role !== UserRole.ADMIN) {
    return {
      redirect: {
        destination: '/login?error=Unauthorized',
        permanent: false,
      },
    };
  }

  try {
    // Fetch users from your API endpoint
    // Ensure your local dev server is running if fetching from localhost
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'; // Fallback for local dev
    const res = await fetch(`${baseUrl}/api/admin/users`, {
      headers: {
        // Pass along the session cookie if your API endpoint is protected
        // and needs to verify the admin session itself.
        cookie: context.req.headers.cookie || '',
      },
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error('getServerSideProps: Failed to fetch users:', errorData.message);
      return { props: { usersInitial: [], error: errorData.message || 'Failed to load users.', pageTitle } };
    }

    const usersInitial: UserFromAPI[] = await res.json();
    return { props: { usersInitial, pageTitle } };
  } catch (err: any) {
    console.error('getServerSideProps: Error fetching users:', err);
    return { props: { usersInitial: [], error: err.message || 'An unexpected error occurred.', pageTitle } };
  }
};

export default UserManagementPage;
