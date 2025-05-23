import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { slug } = req.query;

  if (typeof slug !== 'string') {
    return res.status(400).json({ message: 'Slug must be a string' });
  }

  if (req.method === 'GET') {
    try {
      const page = await prisma.page.findUnique({
        where: { slug },
      });
      if (!page) {
        return res.status(404).json({ message: 'Page not found' });
      }
      res.status(200).json(page);
    } catch (error) {
      console.error(`Failed to fetch page with slug ${slug}:`, error);
      res.status(500).json({ message: 'Failed to fetch page' });
    }
  } else if (req.method === 'PUT') {
    const {
      title,
      content,
      isPublished,
      metaTitle,
      metaDescription,
      newSlug, // Optional: if you want to allow changing the slug
    } = req.body;

    // Basic validation: title and content are often essential for an update
    if (!title || !content) {
      return res
        .status(400)
        .json({ message: 'Title and content are required for an update' });
    }

    try {
      const updatedPage = await prisma.page.update({
        where: { slug },
        data: {
          title,
          slug: newSlug || slug, // Update slug if newSlug is provided
          content,
          isPublished,
          metaTitle,
          metaDescription,
          updatedAt: new Date(), // Manually update updatedAt
        },
      });
      res.status(200).json(updatedPage);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') { // Record to update not found
          return res.status(404).json({ message: 'Page not found for update' });
        } else if (error.code === 'P2002' && error.meta?.target === 'Page_slug_key') {
           return res.status(409).json({ message: 'The new slug already exists. Please use a unique slug.' });
        }
      }
      console.error(`Failed to update page with slug ${slug}:`, error);
      res.status(500).json({ message: 'Failed to update page' });
    }
  } else if (req.method === 'DELETE') {
    try {
      await prisma.page.delete({
        where: { slug },
      });
      res.status(204).end(); // No content to send back
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') { // Record to delete not found
          return res.status(404).json({ message: 'Page not found for deletion' });
        }
      }
      console.error(`Failed to delete page with slug ${slug}:`, error);
      res.status(500).json({ message: 'Failed to delete page' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
