import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const prompts = await prisma.prompt.findMany({
        orderBy: {
          name: 'asc',
        },
      });
      return res.status(200).json(prompts);
    } catch (error) {
      console.error('Failed to fetch prompts:', error);
      return res.status(500).json({ message: 'Failed to fetch prompts', error: (error as Error).message });
    }
  } else if (req.method === 'POST') {
    try {
      const { name, slug, description, promptText, version, status, placeholders } = req.body;

      // Basic validation
      if (!name || !slug || !promptText) {
        return res.status(400).json({ message: 'Name, slug, and prompt text are required.' });
      }

      const newPrompt = await prisma.prompt.create({
        data: {
          name,
          slug,
          description,
          promptText,
          version: version ? parseInt(version, 10) : 1,
          status: status || 'ACTIVE', // Default to ACTIVE if not provided
          placeholders: placeholders || [],
        },
      });
      return res.status(201).json(newPrompt);
    } catch (error) {
      console.error('Failed to create prompt:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle unique constraint violation for slug
        if (error.code === 'P2002' && error.meta?.target === 'Prompt_slug_key') {
          return res.status(409).json({ message: 'A prompt with this slug already exists.' });
        }
      }
      return res.status(500).json({ message: 'Failed to create prompt', error: (error as Error).message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
