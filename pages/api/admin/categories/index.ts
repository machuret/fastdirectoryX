import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import { Category } from '@prisma/client';

type ResponseData = {
  message?: string;
  categories?: Category[];
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
