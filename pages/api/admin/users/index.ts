import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]'; // Adjusted path
import bcrypt from 'bcryptjs';
import { UserRole, UserStatus } from '@prisma/client'; // Import enums

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  // @ts-ignore // session.user.role is custom field
  if (!session || session.user?.role !== UserRole.ADMIN) {
    return res.status(403).json({ message: 'Forbidden: Access denied.' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const users = await prisma.user.findMany({
          orderBy: {
            createdAt: 'desc',
          },
          // Exclude password from the result
          select: {
            user_id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            image: true,
            emailVerified: true,
          }
        });
        return res.status(200).json(users);
      } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
      }

    case 'POST':
      try {
        const { name, email, password, role, status } = req.body;

        if (!name || !email || !password) {
          return res.status(400).json({ message: 'Missing required fields: name, email, password' });
        }
        
        if (typeof password !== 'string' || password.length < 6) {
          return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          return res.status(409).json({ message: 'User already exists with this email' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role: role || UserRole.USER, // Default to USER if not specified
            status: status || UserStatus.ACTIVE, // Default to ACTIVE if not specified
          },
          select: { // Return new user without password
            user_id: true, name: true, email: true, role: true, status: true, createdAt: true, updatedAt: true
          }
        });

        return res.status(201).json(newUser);
      } catch (error) {
        console.error('Error creating user:', error);
        // Consider more specific error handling, e.g., for Prisma validation errors
        return res.status(500).json({ message: 'Internal Server Error' });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
