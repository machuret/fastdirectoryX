import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import { Category } from '@prisma/client';

/**
 * @typedef {object} ResponseData
 * @property {string} [message] - A success or informational message.
 * @property {Category} [category] - A single category object.
 * @property {string} [error] - An error message.
 */
type ResponseData = {
  message?: string;
  category?: Category;
  error?: string;
};

/**
 * API handler for managing individual category resources.
 * Supports fetching (GET), updating (PUT), and deleting (DELETE) a specific category by ID.
 * Requires ADMIN privileges for all operations.
 *
 * @param {NextApiRequest} req The Next.js API request object.
 * @param {NextApiResponse<ResponseData>} res The Next.js API response object.
 *
 * @route GET /api/admin/categories/{id}
 * @description Fetches a specific category by its ID. Requires ADMIN role.
 * @param {string} req.query.id - The ID of the category to fetch.
 * @returns {Promise<void>} Responds with the category object or an error message.
 * @successResponse 200 OK - { category: Category } An object containing the category.
 * @errorResponse 400 Bad Request - If the category ID is missing or invalid.
 * @errorResponse 401 Unauthorized - If the user is not an ADMIN.
 * @errorResponse 404 Not Found - If the category with the specified ID is not found.
 * @errorResponse 500 Internal Server Error - If an error occurs during fetching.
 *
 * @route PUT /api/admin/categories/{id}
 * @description Updates a specific category by its ID. Requires ADMIN role.
 * @param {string} req.query.id - The ID of the category to update.
 * @bodyParam {string} name - The new name of the category.
 * @bodyParam {string} slug - The new unique slug for the category URL.
 * @bodyParam {string} [featureImageUrl] - Optional new URL for the category's feature image.
 * @returns {Promise<void>} Responds with the updated category object and a success message, or an error message.
 * @successResponse 200 OK - { message: string, category: Category } The updated category and a success message.
 * @errorResponse 400 Bad Request - If required fields (name, slug) are missing, ID is invalid, or new slug is not unique.
 * @errorResponse 401 Unauthorized - If the user is not an ADMIN.
 * @errorResponse 404 Not Found - If the category to update is not found (Prisma P2025).
 * @errorResponse 500 Internal Server Error - If an error occurs during update.
 *
 * @route DELETE /api/admin/categories/{id}
 * @description Deletes a specific category by its ID. Requires ADMIN role.
 * @param {string} req.query.id - The ID of the category to delete.
 * @returns {Promise<void>} Responds with a success message or an error message.
 * @successResponse 200 OK - { message: string } A success message.
 * @errorResponse 400 Bad Request - If the category ID is missing or invalid.
 * @errorResponse 401 Unauthorized - If the user is not an ADMIN.
 * @errorResponse 404 Not Found - If the category to delete is not found (Prisma P2025).
 * @errorResponse 500 Internal Server Error - If an error occurs during deletion (e.g., foreign key constraints).
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { id } = req.query;
  const categoryId = id as string;

  if (!categoryId || typeof categoryId !== 'string') {
    return res.status(400).json({ error: 'Invalid or missing category ID' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const category = await prisma.category.findUnique({
          where: { id: categoryId },
        });
        if (!category) {
          return res.status(404).json({ error: 'Category not found' });
        }
        return res.status(200).json({ category });
      } catch (error) {
        console.error(`Error fetching category ${categoryId}:`, error);
        return res.status(500).json({ error: 'Failed to fetch category' });
      }

    case 'PUT':
      try {
        const { name, slug, featureImageUrl } = req.body;

        if (!name || !slug) {
          return res.status(400).json({ error: 'Name and slug are required' });
        }

        // Check if slug is being changed and if the new slug is unique
        const currentCategory = await prisma.category.findUnique({ where: { id: categoryId } });
        if (!currentCategory) {
          return res.status(404).json({ error: 'Category not found for update' });
        }

        if (slug !== currentCategory.slug) {
          const existingCategoryBySlug = await prisma.category.findUnique({
            where: { slug },
          });
          if (existingCategoryBySlug) {
            return res.status(400).json({ error: 'Slug already exists. Please use a unique slug.' });
          }
        }

        const updatedCategory = await prisma.category.update({
          where: { id: categoryId },
          data: {
            name,
            slug,
            featureImageUrl,
          },
        });
        return res.status(200).json({ message: 'Category updated successfully', category: updatedCategory });
      } catch (error) {
        console.error(`Error updating category ${categoryId}:`, error);
        if (error instanceof Error && 'code' in error && (error as any).code === 'P2002') {
            return res.status(400).json({ error: 'A category with the provided slug already exists.' });
        }
        if (error instanceof Error && 'code' in error && (error as any).code === 'P2025') {
            return res.status(404).json({ error: 'Category not found for update.' });
        }
        return res.status(500).json({ error: 'Failed to update category' });
      }

    case 'DELETE':
      try {
        // Optional: Check if category has children or is associated with listings before deleting
        // For simplicity, direct delete is implemented here.
        // Add cascading delete or checks in Prisma schema or here if needed.
        await prisma.category.delete({
          where: { id: categoryId },
        });
        return res.status(200).json({ message: 'Category deleted successfully' });
      } catch (error) {
        console.error(`Error deleting category ${categoryId}:`, error);
         if (error instanceof Error && 'code' in error && (error as any).code === 'P2025') {
            return res.status(404).json({ error: 'Category not found for deletion.' });
        }
        // Handle other potential errors, e.g., foreign key constraints if not handled by cascading deletes
        return res.status(500).json({ error: 'Failed to delete category' });
      }

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
