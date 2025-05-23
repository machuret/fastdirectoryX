import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client'; // Assuming you have UserRole enum

/**
 * Defines the structure of the request body for updating featured statuses.
 * It's an object where keys are string representations of `listing_business_id`
 * and values are booleans indicating the new `isFeatured` status.
 *
 * @example
 * {
 *   "123": true,  // Set listing with ID 123 to featured
 *   "456": false  // Set listing with ID 456 to not featured
 * }
 */
interface UpdateFeaturedStatusRequestBody {
  // Example: { '123': true, '456': false }
  // Where keys are listing_business_id (as string) and values are the new isFeatured status
  [listingId: string]: boolean;
}

/**
 * API handler for batch updating the `isFeatured` status of business listings.
 * Requires ADMIN privileges.
 * Accepts a PUT request with a body mapping listing IDs to their new featured status.
 *
 * @param {NextApiRequest} req The Next.js API request object.
 * @param {NextApiResponse} res The Next.js API response object.
 *
 * @route PUT /api/admin/featured
 * @description Batch updates the `isFeatured` status for multiple listings.
 * @header Content-Type application/json
 * @bodyParam {UpdateFeaturedStatusRequestBody} body - An object where keys are listing IDs (string) and values are booleans (new featured status).
 * @returns {Promise<void>} Responds with a success or error message.
 * @successResponse 200 OK - { message: string } "Featured statuses updated successfully." or "No valid updates to perform."
 * @errorResponse 400 Bad Request - If the request body is invalid.
 * @errorResponse 403 Forbidden - If the user is not an ADMIN.
 * @errorResponse 405 Method Not Allowed - If the request method is not PUT.
 * @errorResponse 500 Internal Server Error - If an error occurs during the database update.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  if (!session || session.user.role !== UserRole.ADMIN) {
    return res.status(403).json({ message: 'Forbidden: You do not have permission to perform this action.' });
  }

  if (req.method === 'PUT') {
    const updates = req.body as UpdateFeaturedStatusRequestBody;

    if (typeof updates !== 'object' || updates === null) {
      return res.status(400).json({ message: 'Invalid request body: Expected an object of listing IDs to featured status.' });
    }

    try {
      const updateOperations = [];
      for (const [listingIdStr, isFeatured] of Object.entries(updates)) {
        const listingId = parseInt(listingIdStr, 10);
        if (isNaN(listingId)) {
          console.warn(`Invalid listing ID format, skipping: ${listingIdStr}`);
          continue; // Skip this entry
        }
        // Ensure isFeatured is a boolean
        if (typeof isFeatured !== 'boolean') {
          console.warn(`Invalid isFeatured value for listing ID ${listingIdStr}, skipping. Expected boolean, got ${typeof isFeatured}`);
          continue; // Skip this entry
        }
        updateOperations.push(
          prisma.listingBusiness.update({
            where: { listing_business_id: listingId },
            data: { isFeatured: isFeatured },
          })
        );
      }

      if (updateOperations.length > 0) {
        await prisma.$transaction(updateOperations);
      } else {
        return res.status(200).json({ message: 'No valid updates to perform.' });
      }

      return res.status(200).json({ message: 'Featured statuses updated successfully.' });
    } catch (error) {
      console.error('Error updating featured statuses:', error);
      let errorMessage = 'An error occurred while updating featured statuses.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return res.status(500).json({ message: errorMessage });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
