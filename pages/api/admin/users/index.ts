import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]'; // Adjusted path
import bcrypt from 'bcryptjs';
import { UserRole, UserStatus } from '@prisma/client'; // Import enums

/**
 * API handler for managing user collections.
 * Supports fetching all users (GET) and creating new users (POST).
 * Requires ADMIN privileges for all operations.
 *
 * @param {NextApiRequest} req The Next.js API request object.
 * @param {NextApiResponse} res The Next.js API response object.
 *
 * @route GET /api/admin/users
 * @description Fetches all users. Requires ADMIN role.
 * @returns {Promise<void>} Responds with a list of users or an error message.
 * @successResponse 200 OK - {User[]} An array of user objects (password excluded).
 * @errorResponse 403 Forbidden - If the user is not an ADMIN.
 * @errorResponse 500 Internal Server Error - If an error occurs during fetching.
 *
 * @route POST /api/admin/users
 * @description Creates a new user. Requires ADMIN role.
 * @bodyParam {string} name - The name of the user.
 * @bodyParam {string} email - The email address of the user (must be unique).
 * @bodyParam {string} password - The user's password (min 6 characters).
 * @bodyParam {UserRole} [role=USER] - The role of the user (ADMIN or USER).
 * @bodyParam {UserStatus} [status=ACTIVE] - The status of the user (ACTIVE, SUSPENDED, etc.).
 * @returns {Promise<void>} Responds with the newly created user object or an error message.
 * @successResponse 201 Created - {User} The newly created user object (password excluded).
 * @errorResponse 400 Bad Request - If required fields are missing or password is too short.
 * @errorResponse 403 Forbidden - If the user is not an ADMIN.
 * @errorResponse 409 Conflict - If a user with the given email already exists.
 * @errorResponse 500 Internal Server Error - If an error occurs during creation.
 */
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
