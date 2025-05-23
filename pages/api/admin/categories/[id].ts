import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import { Category } from '@prisma/client';

type ResponseData = {
  message?: string;
  category?: Category;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { id } = req.query;
  const categoryId = parseInt(id as string, 10);

  if (isNaN(categoryId)) {
    return res.status(400).json({ error: 'Invalid category ID' });
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
        const { name, slug, description, featureImageUrl, parentId, metaTitle, metaDescription, metaKeywords, status } = req.body;

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
            description,
            featureImageUrl,
            parentId: parentId ? parseInt(parentId as string, 10) : (parentId === null ? null : currentCategory.parentId), // Allow setting parentId to null
            metaTitle,
            metaDescription,
            metaKeywords,
            status,
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
