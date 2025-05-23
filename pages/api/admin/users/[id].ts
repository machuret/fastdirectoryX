import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]'; // Adjusted path
import { UserRole, UserStatus } from '@prisma/client';

/**
 * API handler for managing individual user resources.
 * Supports fetching (GET), updating (PUT), and deleting (DELETE) a specific user by ID.
 * Requires ADMIN privileges for all operations.
 *
 * @param {NextApiRequest} req The Next.js API request object.
 * @param {NextApiResponse} res The Next.js API response object.
 *
 * @route GET /api/admin/users/{id}
 * @description Fetches a specific user by their ID. Requires ADMIN role.
 * @param {string} req.query.id - The ID of the user to fetch.
 * @returns {Promise<void>} Responds with the user object or an error message.
 * @successResponse 200 OK - {User} The user object (password excluded, user_id mapped to id).
 * @errorResponse 400 Bad Request - If the user ID is not a valid integer.
 * @errorResponse 403 Forbidden - If the session user is not an ADMIN.
 * @errorResponse 404 Not Found - If the user with the specified ID is not found.
 * @errorResponse 500 Internal Server Error - If an error occurs during fetching.
 *
 * @route PUT /api/admin/users/{id}
 * @description Updates a specific user by their ID. Requires ADMIN role.
 * @param {string} req.query.id - The ID of the user to update.
 * @bodyParam {string} [name] - The new name of the user.
 * @bodyParam {string} [email] - The new email address of the user (must be unique).
 * @bodyParam {UserRole} [role] - The new role of the user.
 * @bodyParam {UserStatus} [status] - The new status of the user.
 * @returns {Promise<void>} Responds with the updated user object or an error message.
 * @successResponse 200 OK - {User} The updated user object (password excluded, user_id mapped to id).
 * @errorResponse 400 Bad Request - If no update fields are provided, ID is invalid, or admin tries to demote/suspend self.
 * @errorResponse 403 Forbidden - If the session user is not an ADMIN.
 * @errorResponse 404 Not Found - If the user with the specified ID is not found (Prisma P2025).
 * @errorResponse 409 Conflict - If the new email is already in use (Prisma P2002).
 * @errorResponse 500 Internal Server Error - If an error occurs during update.
 *
 * @route DELETE /api/admin/users/{id}
 * @description Deletes a specific user by their ID. Requires ADMIN role.
 * @param {string} req.query.id - The ID of the user to delete.
 * @returns {Promise<void>} Responds with no content on success or an error message.
 * @successResponse 204 No Content - Successfully deleted the user.
 * @errorResponse 400 Bad Request - If the user ID is not a valid integer or admin tries to delete self.
 * @errorResponse 403 Forbidden - If the session user is not an ADMIN.
 * @errorResponse 404 Not Found - If the user with the specified ID is not found (Prisma P2025).
 * @errorResponse 500 Internal Server Error - If an error occurs during deletion.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  const { id: idFromQuery } = req.query; // User ID from URL

  // @ts-ignore // session.user.role is custom field
  if (!session || session.user?.role !== UserRole.ADMIN) {
    return res.status(403).json({ message: 'Forbidden: Access denied.' });
  }

  if (typeof idFromQuery !== 'string') {
    return res.status(400).json({ message: 'User ID must be a single string value.' });
  }
  const userIdString: string = idFromQuery; // Explicitly a string now

  let userIdNum: number;
  try {
    userIdNum = parseInt(userIdString, 10); // Should be safe now
    if (isNaN(userIdNum)) {
      throw new Error('User ID must be a valid integer.');
    }
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }

  switch (req.method) {
    case 'GET':
      try {
        const user = await prisma.user.findUnique({
          where: { user_id: userIdNum }, // Use user_id (number)
          select: { // Exclude password, use correct field names
            user_id: true, name: true, email: true, role: true, status: true, 
            createdAt: true, updatedAt: true, image: true, emailVerified: true
          }
        });
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        // Map user_id to id for the response if frontend expects 'id'
        const { user_id, ...restOfUser } = user;
        return res.status(200).json({ id: user_id, ...restOfUser });
      } catch (error) {
        console.error(`Error fetching user ${userIdNum}:`, error);
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
        if (session.user.id === userIdNum && (updateData.role === UserRole.USER || updateData.status === UserStatus.SUSPENDED)) {
            if (updateData.role === UserRole.USER) {
                 return res.status(400).json({ message: 'Admins cannot change their own role to USER.' });
            }
            if (updateData.status === UserStatus.SUSPENDED) {
                 return res.status(400).json({ message: 'Admins cannot suspend their own account.' });
            }
        }

        const updatedUserFromDb = await prisma.user.update({
          where: { user_id: userIdNum }, // Use user_id (number)
          data: updateData,
          select: { // Exclude password, use correct field names
            user_id: true, name: true, email: true, role: true, status: true, 
            createdAt: true, updatedAt: true
          }
        });
        // Map user_id to id for the response
        const { user_id: updated_user_id, ...restOfUpdatedUser } = updatedUserFromDb;
        return res.status(200).json({ id: updated_user_id, ...restOfUpdatedUser });
      } catch (error: any) {
        console.error(`Error updating user ${userIdNum}:`, error);
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
        if (session.user.id === userIdNum) {
          return res.status(400).json({ message: 'Admins cannot delete their own account.' });
        }

        await prisma.user.delete({
          where: { user_id: userIdNum }, // Use user_id (number)
        });
        return res.status(204).end(); // No content
      } catch (error: any) {
        console.error(`Error deleting user ${userIdNum}:`, error);
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
