import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma'; // Assuming you have a prisma client instance exported from lib/prisma
import bcrypt from 'bcryptjs';

// We'll integrate next-auth later for session management
// import { signIn } from 'next-auth/react'; 

type Data = {
  message: string;
  userId?: string; 
  email?: string; 
  role?: string;  
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ message: 'Email and password must be strings' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' }); // User not found
    }

    // Ensure user.password is not null or undefined before comparing
    if (!user.password) {
        return res.status(500).json({ message: 'User record is incomplete (missing password hash)' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' }); // Password incorrect
    }

    // TODO: Implement session creation (e.g., using next-auth)
    // For now, just return a success message.
    // Do not send the password back.
    return res.status(200).json({
      message: 'Login successful',
      userId: user.user_id.toString(),
      email: user.email,
      role: user.role, 
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Error logging in', error: (error as Error).message });
  }
}
