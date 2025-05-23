import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router'; 
import { signIn, useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null); 
  const [loading, setLoading] = useState(false);
  const router = useRouter(); 
  const { data: session, status } = useSession();

  useEffect(() => {
    // If user is already authenticated, redirect them from login page
    if (status === 'authenticated') {
      router.push((router.query.callbackUrl as string) || '/');
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); 
    setLoading(true);

    const result = await signIn('credentials', {
      redirect: false, // Handle redirect manually to show errors
      email,
      password,
    });

    if (result?.ok) {
      // Successful login, NextAuth handles session.
      // router.push('/'); // Redirect is handled by useEffect or can be explicit here if preferred
      // Check if callbackUrl is present and redirect there, otherwise to home
      const callbackUrl = router.query.callbackUrl as string || '/';
      router.push(callbackUrl);
    } else {
      // Handle errors
      setError(result?.error || 'Login failed. Please check your credentials.');
    }

    setLoading(false);
  };

  // Show loading state or null while checking session status to prevent flash of login form
  if (status === 'loading') {
    return <p>Loading...</p>; // Or a spinner component
  }

  // If already authenticated, useEffect will redirect. 
  // This check prevents rendering the form if redirect is happening.
  if (status === 'authenticated') {
    return null; 
  }

  return (
    <>
      <Head>
        <title>Login</title>
      </Head>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
        <div style={{ padding: '2rem', backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
          <h1 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold', color: 'black', marginBottom: '1.5rem' }}>Login</h1>
          {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: '1rem' }}>{error}</p>}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', color: 'black' }}>Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ccc', borderRadius: '0.25rem', backgroundColor: 'white', color: 'black' }}
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', color: 'black' }}>Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ccc', borderRadius: '0.25rem', backgroundColor: 'white', color: 'black' }}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              style={{
                width: '100%', 
                padding: '0.75rem', 
                backgroundColor: loading ? '#ccc' : '#007bff', 
                color: 'white', 
                border: 'none', 
                borderRadius: '0.25rem', 
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem'
              }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '1rem', color: 'black' }}>
            Don&apos;t have an account? <Link href="/auth/signup" style={{ color: '#007bff', textDecoration: 'none' }}>Sign up</Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
