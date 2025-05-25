import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]'; // Adjusted path
import bcrypt from 'bcryptjs';
import { UserRole, UserStatus } from '@prisma/client'; // Import enums

// Define types for the API response and user data structure
interface UserForAdminDisplay {
  id: number;
  name: string | null;
  email: string;
  role: UserRole;
  status: UserStatus;
  image: string | null;
  emailVerified: string | null;
  createdAt: string;
  updatedAt: string;
}

interface FetchUsersResponse {
  users: UserForAdminDisplay[];
  totalPages: number;
  currentPage: number;
  totalUsers: number;
}

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
  res: NextApiResponse<FetchUsersResponse | { message: string, userId?: number }>
) {
  const session = await getServerSession(req, res, authOptions);

  // @ts-ignore // session.user.role is custom field
  if (!session || session.user?.role !== UserRole.ADMIN) {
    return res.status(403).json({ message: 'Forbidden: Access denied.' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search as string | undefined;
        const role = req.query.role as UserRole | undefined;
        const status = req.query.status as UserStatus | undefined;

        const whereClause: any = {};
        if (search) {
          whereClause.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ];
        }
        if (role && Object.values(UserRole).includes(role)) {
          whereClause.role = role;
        }
        if (status && Object.values(UserStatus).includes(status)) {
          whereClause.status = status;
        }

        const usersFromDB = await prisma.user.findMany({
          where: whereClause,
          skip: skip,
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
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

        const totalUsers = await prisma.user.count({
          where: whereClause,
        });

        // Map users to match UserForAdminDisplay structure
        const users: UserForAdminDisplay[] = usersFromDB.map(user => ({
          id: user.user_id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          image: user.image,
          emailVerified: user.emailVerified ? user.emailVerified.toISOString() : null,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        }));

        return res.status(200).json({
          users, // Use the mapped users
          totalPages: Math.ceil(totalUsers / limit),
          currentPage: page,
          totalUsers,
        });
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

        return res.status(201).json({ message: 'User created successfully', userId: newUser.user_id });
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
