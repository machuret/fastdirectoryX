import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Link from 'next/link';

export default function UserDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // If session is loading, do nothing yet
    if (status === 'loading') return;

    // If not authenticated, redirect to login page
    if (!session) {
      router.push('/login?callbackUrl=/userdashboard');
    }
  }, [session, status, router]);

  // If session is loading or user is not yet authenticated (being redirected), show loading or null
  if (status === 'loading' || !session) {
    return <p>Loading...</p>; // Or a more sophisticated loading component
  }

  // If authenticated, show the dashboard
  return (
    <div style={{ padding: '20px' }}>
      <h1>User Dashboard</h1>
      <p>Welcome, {session.user?.name || session.user?.email}!</p>
      <p>This is your personal dashboard.</p>
      
      {/* Example: Link to manage owned businesses - to be implemented later */}
      {/* <div style={{ marginTop: '20px' }}>
        <Link href="/userdashboard/my-businesses" style={{ color: '#0070f3' }}>
          Manage My Businesses
        </Link>
      </div> */}

      <button 
        onClick={() => signOut({ callbackUrl: '/login' })} 
        style={{ marginTop: '20px', padding: '10px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        Sign Out
      </button>
    </div>
  );
}
