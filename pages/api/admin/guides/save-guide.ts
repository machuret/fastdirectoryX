import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/prisma';
import { UserRole, Prisma } from '@prisma/client';

interface SaveGuideRequest {
  niche: string;
  topicIdea: string;
  title: string;
  slug: string;
  content: string;
  openAIModel: string;
  status?: string; // Optional, defaults to DRAFT
}

interface SaveGuideResponse {
  guide?: any; // Consider creating a serialized Guide type
  message?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SaveGuideResponse>
) {
  const session = await getServerSession(req, res, authOptions);

  // @ts-ignore session.user.role is a custom field
  if (!session || session.user?.role !== UserRole.ADMIN) {
    return res.status(403).json({ message: 'Forbidden: Access denied.' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  const { 
    niche, 
    topicIdea, 
    title, 
    slug, 
    content, 
    openAIModel, 
    status 
  } = req.body as SaveGuideRequest;

  if (!niche || !topicIdea || !title || !slug || !content || !openAIModel) {
    return res.status(400).json({ 
      message: 'Missing required fields: niche, topicIdea, title, slug, content, and openAIModel are all required.' 
    });
  }

  try {
    const newGuide = await prisma.guide.create({
      data: {
        niche,
        topicIdea,
        title,
        slug,
        content,
        openAIModel,
        status: status || 'DRAFT', // Default to DRAFT if not provided
        // userId: session.user.id, // Optional: if you want to associate with the admin user who created it
      },
    });

    console.log(`Guide saved successfully with ID: ${newGuide.id}`);
    // Convert BigInt fields to string if necessary for the response, though 'id' is usually Int or String from Prisma by default for UUIDs.
    // If your 'id' is BigInt, you'd do: const serializedGuide = { ...newGuide, id: newGuide.id.toString() };
    return res.status(201).json({ guide: newGuide, message: 'Guide saved successfully.' });

  } catch (error: any) {
    console.error('Error saving guide to database:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle known Prisma errors, e.g., unique constraint violation
      if (error.code === 'P2002') {
        const target = error.meta?.target as string[] | undefined;
        return res.status(409).json({ error: `A guide with this ${target?.join(', ')} already exists.` });
      }
    }
    return res.status(500).json({ error: 'Failed to save guide to the database.' });
  }
}
