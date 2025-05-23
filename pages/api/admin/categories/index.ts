import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import { Category } from '@prisma/client';

/**
 * @typedef {object} ResponseData
 * @property {string} [message] - A success or informational message.
 * @property {Category[]} [categories] - An array of category objects (for GET requests).
 * @property {Category} [category] - A single category object (e.g., for POST requests).
 * @property {string} [error] - An error message.
 */
type ResponseData = {
  message?: string;
  categories?: Category[];
  category?: Category;
  error?: string;
};

/**
 * API handler for managing category collections.
 * Supports fetching all categories (GET) and creating new categories (POST).
 * Requires ADMIN privileges for all operations.
 *
 * @param {NextApiRequest} req The Next.js API request object.
 * @param {NextApiResponse<ResponseData>} res The Next.js API response object.
 *
 * @route GET /api/admin/categories
 * @description Fetches all categories, ordered by name. Requires ADMIN role.
 * @returns {Promise<void>} Responds with a list of categories or an error message.
 * @successResponse 200 OK - { categories: Category[] } An object containing an array of category objects.
 * @errorResponse 401 Unauthorized - If the user is not an ADMIN.
 * @errorResponse 500 Internal Server Error - If an error occurs during fetching.
 *
 * @route POST /api/admin/categories
 * @description Creates a new category. Requires ADMIN role.
 * @bodyParam {string} name - The name of the category.
 * @bodyParam {string} slug - The unique slug for the category URL.
 * @bodyParam {string} [featureImageUrl] - Optional URL for the category's feature image.
 * @returns {Promise<void>} Responds with the newly created category object and a success message, or an error message.
 * @successResponse 201 Created - { message: string, category: Category } The newly created category object and a success message.
 * @errorResponse 400 Bad Request - If required fields (name, slug) are missing, or if the slug is not unique, or other unique constraint violation.
 * @errorResponse 401 Unauthorized - If the user is not an ADMIN.
 * @errorResponse 500 Internal Server Error - If an error occurs during creation.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const categories = await prisma.category.findMany({
          orderBy: {
            name: 'asc',
          },
        });
        return res.status(200).json({ categories });
      } catch (error) {
        console.error('Error fetching categories:', error);
        return res.status(500).json({ error: 'Failed to fetch categories' });
      }

    case 'POST':
      try {
        const { name, slug, featureImageUrl } = req.body;

        if (!name || !slug) {
          return res.status(400).json({ error: 'Name and slug are required' });
        }

        // Check if slug is unique
        const existingCategoryBySlug = await prisma.category.findUnique({
          where: { slug },
        });

        if (existingCategoryBySlug) {
          return res.status(400).json({ error: 'Slug already exists. Please use a unique slug.' });
        }

        const newCategory = await prisma.category.create({
          data: {
            name,
            slug,
            featureImageUrl, // This can be null or a string URL
          },
        });
        return res.status(201).json({ message: 'Category created successfully', category: newCategory });
      } catch (error) {
        console.error('Error creating category:', error);
        // Check for specific Prisma errors if needed, e.g., unique constraint violation on other fields
        if (error instanceof Error && 'code' in error && (error as any).code === 'P2002') {
             // This is a generic unique constraint error. We already checked for slug.
             // It might be another unique field if you add one later.
            return res.status(400).json({ error: 'A category with some of the provided unique fields already exists.' });
        }
        return res.status(500).json({ error: 'Failed to create category' });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
