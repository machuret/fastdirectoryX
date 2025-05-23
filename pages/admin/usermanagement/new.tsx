import React, { useState } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import { getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { UserRole, UserStatus } from '@prisma/client';

/**
 * Page component for creating a new user in the admin panel.
 * It provides a form to input user details (name, email, password, role, status)
 * and handles the submission to the backend API.
 * @returns {JSX.Element} The rendered new user creation page.
 */
const NewUserPage: NextPage = () => {
  const router = useRouter();
  /** State for the user's full name. */
  const [name, setName] = useState('');
  /** State for the user's email address. */
  const [email, setEmail] = useState('');
  /** State for the user's password. */
  const [password, setPassword] = useState('');
  /** State for the user's role, defaults to USER. */
  const [role, setRole] = useState<UserRole>(UserRole.USER);
  /** State for the user's status, defaults to ACTIVE. */
  const [status, setStatus] = useState<UserStatus>(UserStatus.ACTIVE);
  /** State for storing and displaying error messages. */
  const [error, setError] = useState<string | null>(null);
  /** State for storing and displaying success messages. */
  const [success, setSuccess] = useState<string | null>(null);
  /** State to indicate if a form submission is in progress. */
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handles the form submission for creating a new user.
   * Performs client-side validation, sends a POST request to the `/api/admin/users` endpoint,
   * and manages UI feedback (error/success messages, loading state).
   * Redirects to the user management list on successful creation.
   * @param {React.FormEvent} e - The form submission event.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, role, status }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create user');
      }

      setSuccess('User created successfully! Redirecting...');
      setTimeout(() => {
        router.push('/admin/usermanagement');
      }, 2000);

    } catch (err: any) {
      console.error('Create user error:', err);
      setError(err.message || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/admin/usermanagement" legacyBehavior>
          <a className="text-blue-500 hover:text-blue-700">&larr; Back to User List</a>
        </Link>
      </div>
      {/* The h1 title will be set by AdminHeaderProvider via _app.tsx and pageProps.pageTitle */}
      {/* <h1 className="text-3xl font-bold mb-6">Add New User</h1> */}

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
      {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{success}</div>}

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8 mb-4">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
            Full Name
          </label>
          <input 
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="name" type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required 
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            Email Address
          </label>
          <input 
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="email" type="email" placeholder="user@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required 
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Password (min. 6 characters)
          </label>
          <input 
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
            id="password" type="password" placeholder="******************" value={password} onChange={(e) => setPassword(e.target.value)} required 
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="role">
            Role
          </label>
          <select 
            id="role" 
            value={role} 
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="status">
            Status
          </label>
          <select 
            id="status" 
            value={status} 
            onChange={(e) => setStatus(e.target.value as UserStatus)}
            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            {Object.values(UserStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex items-center justify-between">
          <button 
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
            type="submit" 
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  );
};

/**
 * Server-side properties for the New User page.
 * Ensures that only authenticated admin users can access this page.
 * Redirects to the login page if the user is not an admin.
 * @param {GetServerSidePropsContext} context - The Next.js context object for server-side props.
 * @returns {Promise<GetServerSidePropsResult<{}>>} An empty props object if authorized, or a redirect object.
 */
export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  const pageTitle = "Add New User"; // Added for _app.tsx

  // @ts-ignore session.user.role is custom
  if (!session || session.user?.role !== UserRole.ADMIN) {
    return {
      redirect: {
        destination: '/login?error=NotAuthorizedAdmin',
        permanent: false,
      },
    };
  }

  return { props: { pageTitle } }; // Pass pageTitle
};

export default NewUserPage;
