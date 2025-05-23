import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma'; // Assuming you have a prisma client instance exported from lib/prisma
import bcrypt from 'bcryptjs';

type Data = {
  message: string;
  userId?: string;
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

  // Basic email validation
  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  // Basic password strength (example: min 8 characters)
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long' });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        // Add other fields like name if your schema requires them and they are provided
        // For example: name: req.body.name || undefined,
      },
    });

    console.log('Prisma user.create result:', JSON.stringify(user, null, 2)); // Added for debugging

    // Important: Do not send the password back, even hashed.
    return res.status(201).json({ message: 'User created successfully', userId: user.user_id.toString() });

  } catch (error) {
    console.error('Signup error:', error);
    // Check for Prisma-specific errors if needed, e.g., P2002 for unique constraint violation
    // Though the check for existingUser should catch most email conflicts.
    return res.status(500).json({ message: 'Error creating user', error: (error as Error).message });
  }
}
