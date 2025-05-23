import React, { useState } from 'react';

const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState(''); // For displaying success/error messages
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(''); // Clear previous messages
    if (password !== confirmPassword) {
      setMessage("Passwords don't match!");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Signup successful! User ID: ${data.userId}. You can now log in.`);
        // Optionally redirect or clear form
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      } else {
        setMessage(data.message || 'Signup failed. Please try again.');
      }
    } catch (error) {
      console.error('Signup fetch error:', error);
      setMessage('An unexpected error occurred. Please try again.');
    }
    setIsLoading(false);
  };

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1>Sign Up Page</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '300px', marginTop: '20px' }}>
        <div>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px', color: 'black' }}>Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', backgroundColor: 'white', color: 'black' }}
          />
        </div>
        <div>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px', color: 'black' }}>Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', backgroundColor: 'white', color: 'black' }}
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '5px', color: 'black' }}>Confirm Password:</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', backgroundColor: 'white', color: 'black' }}
          />
        </div>
        <button type="submit" disabled={isLoading} style={{ padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer' }}>
          {isLoading ? 'Signing Up...' : 'Sign Up'}
        </button>
      </form>
      {message && <p style={{ marginTop: '15px', color: message.startsWith('Signup successful') ? 'green' : 'red' }}>{message}</p>}
    </div>
  );
};

export default SignupPage;
