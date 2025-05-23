import { useState, FormEvent, useEffect } from 'react';
import { signIn, getSession, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const userRole = session.user.role;
      if (userRole === 'ADMIN') {
        router.push('/admin/usermanagement');
      } else {
        router.push('/userdashboard');
      }
    }
  }, [session, status, router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError(res.error === "CredentialsSignin" ? "Invalid email or password." : res.error);
      setLoading(false);
    } else if (res?.ok) {
      const newSession = await getSession();
      if (newSession?.user) {
        const userRole = newSession.user.role;
        if (userRole === 'ADMIN') {
          router.push('/admin/usermanagement');
        } else {
          router.push('/userdashboard');
        }
      } else {
        router.push('/');
      }
    } else {
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  };

  if (status === 'loading' || (status === 'authenticated' && session)) {
    return <p>Loading...</p>;
  }

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginBottom: '15px', boxSizing: 'border-box' }}
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p style={{ marginTop: '20px', textAlign: 'center' }}>
        Don't have an account? <Link href="/register" style={{ color: '#0070f3' }}>Register here</Link>
      </p>
    </div>
  );
}

// Optional: If you need CSRF token for some reason, though typically not needed for credentials provider in this way.
// export async function getServerSideProps(context: any) {
//   return {
//     props: {
//       csrfToken: await getCsrfToken(context),
//     },
//   };
// }
