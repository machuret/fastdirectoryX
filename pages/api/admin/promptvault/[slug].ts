import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { getSession } from 'next-auth/react';
import { UserRole, PromptTemplate } from '@prisma/client';

const PREDEFINED_PROMPT_SLUGS = ['description', 'guides', 'faq', 'web-faq', 'cities'];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });

  // @ts-ignore session.user.role is custom
  if (!session || session.user?.role !== UserRole.ADMIN) {
    return res.status(401).json({ message: 'Unauthorized. Admin role required.' });
  }

  const { slug } = req.query;

  if (typeof slug !== 'string' || !PREDEFINED_PROMPT_SLUGS.includes(slug)) {
    return res.status(404).json({ message: 'Prompt not found or access denied for this slug.' });
  }

  if (req.method === 'GET') {
    try {
      const prompt = await prisma.promptTemplate.findUnique({
        where: { slug },
      });
      if (!prompt) {
        return res.status(404).json({ message: 'Prompt not found.' });
      }
      return res.status(200).json(prompt);
    } catch (error) {
      console.error(`Failed to fetch prompt with slug ${slug}:`, error);
      return res.status(500).json({ message: 'Failed to fetch prompt', error: (error as Error).message });
    }
  } else if (req.method === 'PUT') {
    try {
      const { content } = req.body;

      if (typeof content !== 'string') {
        return res.status(400).json({ message: 'Prompt content must be a string.' });
      }

      const updatedPrompt = await prisma.promptTemplate.update({
        where: { slug },
        data: {
          content,
        },
      });
      return res.status(200).json(updatedPrompt);
    } catch (error) {
      console.error(`Failed to update prompt with slug ${slug}:`, error);
      return res.status(500).json({ message: 'Failed to update prompt', error: (error as Error).message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
