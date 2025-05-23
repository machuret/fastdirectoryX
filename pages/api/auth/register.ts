import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Missing name, email, or password' });
  }

  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
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
        name,
        email,
        password: hashedPassword,
        // emailVerified: null, // Not verifying email for now as per requirements
        // image: null, // Default to null
        // status: 'ACTIVE' // Default is set in schema
      },
    });

    // Select what to return, avoid sending back the hashed password
    const { password: _, ...userWithoutPassword } = user;

    return res.status(201).json({ message: 'User created successfully', user: userWithoutPassword });

  } catch (error) {
    console.error('Registration error:', error);
    // Check if error is a Prisma known error for unique constraints, etc.
    // if (error instanceof Prisma.PrismaClientKnownRequestError) { ... }
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
