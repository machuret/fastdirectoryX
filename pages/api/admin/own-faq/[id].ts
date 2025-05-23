import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { getSession } from 'next-auth/react';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  if (!session || !session.user?.isAdmin) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { id } = req.query;
  if (typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid FAQ ID' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const faq = await prisma.ownFAQ.findUnique({
          where: { id },
        });
        if (!faq) {
          return res.status(404).json({ message: 'FAQ not found' });
        }
        res.status(200).json({
          ...faq,
          createdAt: faq.createdAt.toISOString(),
          updatedAt: faq.updatedAt.toISOString(),
        });
      } catch (error) {
        console.error(`Error fetching OwnFAQ ${id}:`, error);
        res.status(500).json({ message: 'Error fetching FAQ', error: (error as Error).message });
      }
      break;

    case 'PUT':
      try {
        const { question, answer, category, order, isPublished } = req.body;

        // Basic validation
        if (question === '' || answer === '') {
          return res.status(400).json({ message: 'Question and Answer cannot be empty' });
        }

        const updatedFaq = await prisma.ownFAQ.update({
          where: { id },
          data: {
            question: question,
            answer: answer,
            category: category,
            order: order !== undefined ? parseInt(order, 10) : undefined,
            isPublished: isPublished !== undefined ? Boolean(isPublished) : undefined,
          },
        });
        res.status(200).json({
          ...updatedFaq,
          createdAt: updatedFaq.createdAt.toISOString(),
          updatedAt: updatedFaq.updatedAt.toISOString(),
        });
      } catch (error) {
        console.error(`Error updating OwnFAQ ${id}:`, error);
        // Add specific error handling, e.g., for P2025 (Record to update not found)
        if ((error as any).code === 'P2025') {
            return res.status(404).json({ message: 'FAQ not found for update' });
        }
        res.status(500).json({ message: 'Error updating FAQ', error: (error as Error).message });
      }
      break;

    case 'DELETE':
      try {
        await prisma.ownFAQ.delete({
          where: { id },
        });
        res.status(204).end(); // No content to send back
      } catch (error) {
        console.error(`Error deleting OwnFAQ ${id}:`, error);
        if ((error as any).code === 'P2025') {
            return res.status(404).json({ message: 'FAQ not found for deletion' });
        }
        res.status(500).json({ message: 'Error deleting FAQ', error: (error as Error).message });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
