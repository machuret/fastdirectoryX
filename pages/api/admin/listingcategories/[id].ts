import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { ListingCategory } from '@prisma/client';

// Basic slugification function (can be moved to a utils file later)
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Category ID is required and must be a string.' });
  }

  const categoryId = parseInt(id, 10);
  if (isNaN(categoryId)) {
    return res.status(400).json({ message: 'Category ID must be a valid integer.' });
  }

  if (req.method === 'GET') {
    try {
      const category = await prisma.listingCategory.findUnique({
        where: { category_id: categoryId },
      });
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      res.status(200).json(category);
    } catch (error) {
      console.error(`Error fetching category ${categoryId}:`, error);
      res.status(500).json({ message: `Error fetching category ${categoryId}` });
    }
  } else if (req.method === 'PUT') {
    try {
      const { 
        category_name, 
        description, 
        seoTitle, 
        seoDescription, 
        imageUrl,
        slug 
      } = req.body as Partial<ListingCategory & { slug?: string }>;

      if (!category_name) {
        // Although Prisma handles updatedAt, good to be explicit for other fields
        // if partial updates are allowed and category_name is not being updated.
        // For now, let's assume category_name is always part of the update if provided.
      }

      let dataToUpdate: Partial<ListingCategory> & { slug?: string } = {
        description,
        seoTitle,
        seoDescription,
        imageUrl,
      };

      if (category_name) {
        dataToUpdate.category_name = category_name;
        // If name changes, slug might need to change too, unless a specific slug is provided
        dataToUpdate.slug = slug || slugify(category_name);
      } else if (slug) {
        // Allow updating slug independently if name isn't changing
        dataToUpdate.slug = slug;
      }
      
      // Check for slug conflict if slug is being updated
      if (dataToUpdate.slug) {
        const existingCategoryBySlug = await prisma.listingCategory.findFirst({
          where: { 
            slug: dataToUpdate.slug,
            NOT: { category_id: categoryId } // Exclude the current category
          },
        });
        if (existingCategoryBySlug) {
          return res.status(409).json({ message: `Slug '${dataToUpdate.slug}' already exists for another category.` });
        }
      }

      const updatedCategory = await prisma.listingCategory.update({
        where: { category_id: categoryId },
        data: dataToUpdate,
      });
      res.status(200).json(updatedCategory);
    } catch (error) {
      console.error(`Error updating category ${categoryId}:`, error);
       if ((error as any)?.code === 'P2002') { // Unique constraint failed
        const target = (error as any)?.meta?.target as string[] | undefined;
        if (target?.includes('category_name')) {
            return res.status(409).json({ message: `Category name '${req.body.category_name}' already exists.` });
        }
        if (target?.includes('slug')) {
            return res.status(409).json({ message: `Slug '${req.body.slug || req.body.category_name}' already exists.` });
        }
      }
      if ((error as any)?.code === 'P2025') { // Record to update not found
        return res.status(404).json({ message: 'Category not found for update.' });
      }
      res.status(500).json({ message: `Error updating category ${categoryId}` });
    }
  } else if (req.method === 'DELETE') {
    try {
      await prisma.listingCategory.delete({
        where: { category_id: categoryId },
      });
      res.status(204).end(); // No content
    } catch (error) {
      console.error(`Error deleting category ${categoryId}:`, error);
      if ((error as any)?.code === 'P2025') { // Record to delete not found
        return res.status(404).json({ message: 'Category not found for deletion.' });
      }
      // Handle potential foreign key constraints if categories are linked elsewhere and not set to cascade delete
      if ((error as any)?.code === 'P2003') { // Foreign key constraint failed
         return res.status(409).json({ message: 'Cannot delete category. It is still associated with some listings.' });
      }
      res.status(500).json({ message: `Error deleting category ${categoryId}` });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
