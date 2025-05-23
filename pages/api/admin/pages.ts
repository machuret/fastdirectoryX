import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const pages = await prisma.page.findMany({
        orderBy: {
          updatedAt: 'desc',
        },
      });
      res.status(200).json(pages);
    } catch (error) {
      console.error('Failed to fetch pages:', error);
      res.status(500).json({ message: 'Failed to fetch pages' });
    }
  } else if (req.method === 'POST') {
    const {
      title,
      slug,
      content,
      isPublished,
      metaTitle,
      metaDescription,
    } = req.body;

    if (!title || !slug || !content) {
      return res
        .status(400)
        .json({ message: 'Title, slug, and content are required' });
    }

    try {
      const newPage = await prisma.page.create({
        data: {
          title,
          slug,
          content,
          isPublished: isPublished || false,
          metaTitle,
          metaDescription,
        },
      });
      res.status(201).json(newPage);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // P2002 is the Prisma error code for unique constraint violation
        if (error.code === 'P2002' && error.meta?.target === 'Page_slug_key') {
          return res.status(409).json({ message: 'Slug already exists. Please use a unique slug.' });
        }
      }
      console.error('Failed to create page:', error);
      res.status(500).json({ message: 'Failed to create page' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
