import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { getSession } from 'next-auth/react';
import { PartnerLogo } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });
  const { id: queryId } = req.query; // queryId is the string from the URL

  if (typeof queryId !== 'string') {
    return res.status(400).json({ message: 'Partner Logo ID must be a string and is required.' });
  }

  // Use queryId directly as it's already a string
  const id = queryId;

  // TODO: Implement proper authorization check here
  // if (!session || !session.user?.isAdmin) {
  //   return res.status(403).json({ message: 'Forbidden' });
  // }

  if (req.method === 'GET') {
    try {
      const partnerLogo: PartnerLogo | null = await prisma.partnerLogo.findUnique({
        where: { id }, // 'id' is now a string
      });
      if (!partnerLogo) {
        return res.status(404).json({ message: 'Partner Logo not found' });
      }
      res.status(200).json(partnerLogo);
    } catch (error) {
      console.error(`Failed to fetch partner logo ${id}:`, error);
      res.status(500).json({ message: `Failed to fetch partner logo ${id}`, error: (error as Error).message });
    }
  } else if (req.method === 'PUT') {
    try {
      const { name, imageUrl, linkUrl, order, isVisible } = req.body;

      // Basic validation
      if (!name || !imageUrl) {
        return res.status(400).json({ message: 'Name and Image URL are required for update' });
      }

      const updatedPartnerLogo: PartnerLogo = await prisma.partnerLogo.update({
        where: { id }, // 'id' is now a string
        data: {
          name,
          imageUrl,
          linkUrl: linkUrl !== undefined ? linkUrl : null,
          order: order !== undefined ? order : undefined,
          isVisible: typeof isVisible === 'boolean' ? isVisible : undefined,
        },
      });
      res.status(200).json(updatedPartnerLogo);
    } catch (error) {
      console.error(`Failed to update partner logo ${id}:`, error);
      if ((error as any).code === 'P2025') { // Record to update not found
        return res.status(404).json({ message: `Partner logo with ID ${id} not found for update.`, error: (error as Error).message });
      }
      res.status(500).json({ message: `Failed to update partner logo ${id}`, error: (error as Error).message });
    }
  } else if (req.method === 'DELETE') {
    try {
      await prisma.partnerLogo.delete({
        where: { id }, // 'id' is now a string
      });
      res.status(204).end(); // No content to send back
    } catch (error) {
      console.error(`Failed to delete partner logo ${id}:`, error);
      if ((error as any).code === 'P2025') { // Record to delete not found
        return res.status(404).json({ message: `Partner logo with ID ${id} not found for deletion.`, error: (error as Error).message });
      }
      res.status(500).json({ message: `Failed to delete partner logo ${id}`, error: (error as Error).message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
