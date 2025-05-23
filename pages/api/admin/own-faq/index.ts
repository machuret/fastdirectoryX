import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma'; // Assuming your Prisma client is here
import { getSession } from 'next-auth/react'; // For authentication

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  // Detailed logging for debugging 401 on POST
  if (req.method === 'POST') {
    console.log('API ROUTE (POST): /api/admin/own-faq - Received POST request.');
    console.log('API ROUTE (POST): Session object:', JSON.stringify(session, null, 2));
    if (session && session.user) {
      console.log('API ROUTE (POST): Session user object:', JSON.stringify(session.user, null, 2));
      console.log('API ROUTE (POST): Session user isAdmin:', session.user.isAdmin);
    } else {
      console.log('API ROUTE (POST): No session or session.user found.');
    }
  }

  if (!session || !session.user?.isAdmin) { // Check if user is admin
    // Log details if unauthorized
    if (req.method === 'POST') {
        console.error('API ROUTE (POST): Unauthorized access attempt. Session details logged above.');
    }
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // If execution reaches here for a POST, it means the user is authorized
  if (req.method === 'POST') {
    console.log('API ROUTE (POST): User is authorized. Proceeding with FAQ creation.');
  }

  switch (req.method) {
    case 'GET':
      try {
        const faqs = await prisma.ownFAQ.findMany({
          orderBy: [
            { category: 'asc' }, 
            { order: 'asc' },
            { createdAt: 'desc' }
          ],
        });
        // Serialize dates if necessary, though Prisma typically handles this for JSON responses
        const serializedFaqs = faqs.map(faq => ({
          ...faq,
          createdAt: faq.createdAt.toISOString(),
          updatedAt: faq.updatedAt.toISOString(),
        }));
        res.status(200).json(serializedFaqs);
      } catch (error) {
        console.error('Error fetching OwnFAQs:', error);
        res.status(500).json({ message: 'Error fetching FAQs', error: (error as Error).message });
      }
      break;

    case 'POST':
      try {
        const { question, answer, category, order, isPublished } = req.body;

        if (!question || !answer) {
          return res.status(400).json({ message: 'Question and Answer are required' });
        }

        const newFaq = await prisma.ownFAQ.create({
          data: {
            question,
            answer,
            category: category || null,
            order: order !== undefined ? parseInt(order, 10) : 0,
            isPublished: isPublished !== undefined ? Boolean(isPublished) : false,
          },
        });
        res.status(201).json({
          ...newFaq,
          createdAt: newFaq.createdAt.toISOString(),
          updatedAt: newFaq.updatedAt.toISOString(),
        });
      } catch (error) {
        console.error('Error creating OwnFAQ:', error);
        // Check for Prisma-specific errors if needed, e.g., unique constraint violation
        res.status(500).json({ message: 'Error creating FAQ', error: (error as Error).message });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
