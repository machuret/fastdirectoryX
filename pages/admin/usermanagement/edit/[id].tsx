import React, { useState, useEffect } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import { getSession, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout'; // Assuming path
import { UserRole, UserStatus } from '@prisma/client';

interface UserToEdit {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  status: UserStatus;
}

interface EditUserPageProps {
  user: UserToEdit | null;
  error?: string;
}

const EditUserPage: NextPage<EditUserPageProps> = ({ user: initialUser, error: initialError }) => {
  const router = useRouter();
  const { data: session } = useSession(); // For checking current admin ID

  const [name, setName] = useState(initialUser?.name || '');
  const [email, setEmail] = useState(initialUser?.email || '');
  const [role, setRole] = useState<UserRole>(initialUser?.role || UserRole.USER);
  const [status, setStatus] = useState<UserStatus>(initialUser?.status || UserStatus.ACTIVE);
  
  const [formError, setFormError] = useState<string | null>(initialError || null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialUser) {
      setName(initialUser.name || '');
      setEmail(initialUser.email || '');
      setRole(initialUser.role || UserRole.USER);
      setStatus(initialUser.status || UserStatus.ACTIVE);
    }
  }, [initialUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccess(null);
    setIsLoading(true);

    if (!initialUser) {
      setFormError('User data not loaded.');
      setIsLoading(false);
      return;
    }

    // @ts-ignore // session.user.id is custom property
    const currentAdminId = session?.user?.id;
    if (currentAdminId === initialUser.id) {
      if (role === UserRole.USER) {
        setFormError('Admins cannot change their own role to USER.');
        setIsLoading(false);
        return;
      }
      if (status === UserStatus.SUSPENDED) {
        setFormError('Admins cannot suspend their own account.');
        setIsLoading(false);
        return;
      }
    }

    try {
      const res = await fetch(`/api/admin/users/${initialUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, role, status }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update user');
      }

      setSuccess('User updated successfully! Redirecting...');
      // Optionally update initialUser state here if not redirecting immediately
      setTimeout(() => {
        router.push('/admin/usermanagement');
      }, 2000);

    } catch (err: any) {
      console.error('Update user error:', err);
      setFormError(err.message || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!initialUser && !initialError) {
    return (
      <AdminLayout title="Edit User">
        <div className="container mx-auto px-4 py-8"><p>Loading user data...</p></div>
      </AdminLayout>
    );
  }

  if (initialError) {
     return (
      <AdminLayout title="Error">
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
              <Link href="/admin/usermanagement" legacyBehavior>
                <a className="text-blue-500 hover:text-blue-700">&larr; Back to User List</a>
              </Link>
            </div>
            <p className="text-red-500">Error loading user: {initialError}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Edit User: ${initialUser?.name || initialUser?.email}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/admin/usermanagement" legacyBehavior>
            <a className="text-blue-500 hover:text-blue-700">&larr; Back to User List</a>
          </Link>
        </div>
        <h1 className="text-3xl font-bold mb-6">Edit User: <span className="text-blue-600">{initialUser?.name || initialUser?.email}</span></h1>

        {formError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{formError}</div>}
        {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{success}</div>}

        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8 mb-4">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
              Full Name
            </label>
            <input 
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="name" type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} 
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
              {isLoading ? 'Updating...' : 'Update User'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  const { id } = context.params || {};

  // @ts-ignore session.user.role is custom
  if (!session || session.user?.role !== UserRole.ADMIN) {
    return {
      redirect: {
        destination: '/login?error=NotAuthorizedAdmin',
        permanent: false,
      },
    };
  }

  if (typeof id !== 'string') {
    return { props: { user: null, error: 'Invalid user ID.' } };
  }
  
  // @ts-ignore session.user.id is custom
  const currentAdminId = session.user?.id;

  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/admin/users/${id}`, {
       headers: { 'Cookie': context.req.headers.cookie || '' },
    });

    if (!res.ok) {
      const errorData = await res.json();
      return { props: { user: null, error: errorData.message || `Failed to load user (status ${res.status}).` } };
    }

    const user: UserToEdit = await res.json();
    return { props: { user } };

  } catch (error: any) {
    console.error(`SSR Exception fetching user ${id}:`, error);
    return { props: { user: null, error: 'An unexpected error occurred while fetching user data.' } };
  }
};

export default EditUserPage;
