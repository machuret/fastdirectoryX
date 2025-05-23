import React from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

const UserProfilePage: React.FC = () => {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  if (status === 'unauthenticated') {
    return (
      <div>
        <p>Access Denied. Please log in to view your profile.</p>
        <Link href="/auth/login">Login</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>My Account</h1>
      <p>Email: {session?.user?.email}</p>
      {/* @ts-ignore */}
      <p>Role: {session?.user?.role}</p>
      {/* Add more profile information and editing functionality here */}
    </div>
  );
};

export default UserProfilePage;
