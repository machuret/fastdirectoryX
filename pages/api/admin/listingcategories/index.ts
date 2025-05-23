import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma'; // Assuming your prisma client is at lib/prisma
import { ListingCategory } from '@prisma/client';

// Basic slugification function
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-'); // Replace multiple - with single -
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const categories = await prisma.listingCategory.findMany({
        orderBy: {
          category_name: 'asc',
        },
      });
      res.status(200).json(categories);
    } catch (error) {
      console.error('Error fetching listing categories:', error);
      res.status(500).json({ message: 'Error fetching listing categories' });
    }
  } else if (req.method === 'POST') {
    try {
      const { 
        category_name, 
        description, 
        seoTitle, 
        seoDescription, 
        imageUrl,
        slug // Allow providing a slug, otherwise generate it
      } = req.body as Partial<ListingCategory & { slug?: string }>; // slug is optional in body

      if (!category_name) {
        return res.status(400).json({ message: 'Category name is required' });
      }

      const generatedSlug = slug || slugify(category_name);

      // Check if slug already exists
      const existingCategoryBySlug = await prisma.listingCategory.findUnique({
        where: { slug: generatedSlug },
      });

      if (existingCategoryBySlug) {
        // If auto-generating and it conflicts, could append a suffix or error
        // For now, we'll error if the intended slug (provided or generated) is taken
        return res.status(409).json({ message: `Slug '${generatedSlug}' already exists. Try a different name or provide a unique slug.` });
      }
      
      const newCategory = await prisma.listingCategory.create({
        data: {
          category_name,
          slug: generatedSlug,
          description,
          seoTitle,
          seoDescription,
          imageUrl,
          // createdAt and updatedAt are handled by Prisma defaults/@updatedAt
        },
      });
      res.status(201).json(newCategory);
    } catch (error) {
      console.error('Error creating listing category:', error);
      // Check for unique constraint violation on category_name as well
      if ((error as any)?.code === 'P2002' && (error as any)?.meta?.target?.includes('category_name')) {
        return res.status(409).json({ message: `Category name '${req.body.category_name}' already exists.` });
      }
      res.status(500).json({ message: 'Error creating listing category' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
