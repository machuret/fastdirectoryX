import React from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

const UserDashboardPage: React.FC = () => {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  if (status === 'unauthenticated') {
    return (
      <div>
        <p>Access Denied. Please log in to view your dashboard.</p>
        <Link href="/auth/login">Login</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>User Dashboard</h1>
      <p>Welcome, {session?.user?.email}!</p>
      <p>This is your personal dashboard. More features coming soon.</p>
      {/* Add user-specific content and links here */}
    </div>
  );
};

export default UserDashboardPage;
