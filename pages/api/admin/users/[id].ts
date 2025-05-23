import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]'; // Adjusted path
import { UserRole, UserStatus } from '@prisma/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  const { id } = req.query; // User ID from URL

  // @ts-ignore // session.user.role is custom field
  if (!session || session.user?.role !== UserRole.ADMIN) {
    return res.status(403).json({ message: 'Forbidden: Access denied.' });
  }

  if (typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid user ID.' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const user = await prisma.user.findUnique({
          where: { id },
          select: { // Exclude password
            id: true, name: true, email: true, role: true, status: true, 
            createdAt: true, updatedAt: true, image: true, emailVerified: true
          }
        });
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json(user);
      } catch (error) {
        console.error(`Error fetching user ${id}:`, error);
        return res.status(500).json({ message: 'Internal Server Error' });
      }

    case 'PUT':
      try {
        const { name, email, role, status } = req.body;
        
        // Basic validation
        if (!name && !email && !role && !status) {
            return res.status(400).json({ message: 'No update fields provided.' });
        }

        const updateData: { name?: string; email?: string; role?: UserRole; status?: UserStatus } = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email; // Consider validating email format
        if (role && Object.values(UserRole).includes(role)) updateData.role = role;
        if (status && Object.values(UserStatus).includes(status)) updateData.status = status;

        // Prevent admin from demoting/suspending themselves via this specific endpoint if it's their own ID
        // @ts-ignore
        if (session.user.id === id && (updateData.role === UserRole.USER || updateData.status === UserStatus.SUSPENDED)) {
            if (updateData.role === UserRole.USER) {
                 return res.status(400).json({ message: 'Admins cannot change their own role to USER.' });
            }
            if (updateData.status === UserStatus.SUSPENDED) {
                 return res.status(400).json({ message: 'Admins cannot suspend their own account.' });
            }
        }

        const updatedUser = await prisma.user.update({
          where: { id },
          data: updateData,
          select: { // Exclude password
            id: true, name: true, email: true, role: true, status: true, 
            createdAt: true, updatedAt: true
          }
        });
        return res.status(200).json(updatedUser);
      } catch (error: any) {
        console.error(`Error updating user ${id}:`, error);
        if (error.code === 'P2025') { // Prisma code for record not found
          return res.status(404).json({ message: 'User not found' });
        }
        if (error.code === 'P2002' && error.meta?.target?.includes('email')) { // Prisma unique constraint failed for email
            return res.status(409).json({ message: 'Email already in use by another account.' });
        }
        return res.status(500).json({ message: 'Internal Server Error' });
      }

    case 'DELETE':
      try {
        // Prevent admin from deleting themselves
        // @ts-ignore
        if (session.user.id === id) {
          return res.status(400).json({ message: 'Admins cannot delete their own account.' });
        }

        await prisma.user.delete({
          where: { id },
        });
        return res.status(204).end(); // No content
      } catch (error: any) {
        console.error(`Error deleting user ${id}:`, error);
        if (error.code === 'P2025') { // Prisma code for record not found
          return res.status(404).json({ message: 'User not found' });
        }
        // Handle other potential errors, e.g., related records preventing deletion
        return res.status(500).json({ message: 'Internal Server Error' });
      }

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
