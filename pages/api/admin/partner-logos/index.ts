import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { getSession } from 'next-auth/react';
import { PartnerLogo } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  // TODO: Implement proper authorization check here
  // if (!session || !session.user?.isAdmin) {
  //   return res.status(403).json({ message: 'Forbidden' });
  // }

  if (req.method === 'GET') {
    try {
      const partnerLogos: PartnerLogo[] = await prisma.partnerLogo.findMany({
        orderBy: {
          order: 'asc', // Assuming you want to order by the 'order' field
        },
      });
      res.status(200).json(partnerLogos);
    } catch (error) {
      console.error('Failed to fetch partner logos:', error);
      res.status(500).json({ message: 'Failed to fetch partner logos', error: (error as Error).message });
    }
  } else if (req.method === 'POST') {
    try {
      const { name, imageUrl, linkUrl, order, isVisible } = req.body;

      if (!name || !imageUrl) {
        return res.status(400).json({ message: 'Name and Image URL are required' });
      }

      const newPartnerLogo: PartnerLogo = await prisma.partnerLogo.create({
        data: {
          name,
          imageUrl,
          linkUrl: linkUrl || null,
          order: order ? parseInt(order as string, 10) : 0, // Default order to 0 if not provided
          isVisible: typeof isVisible === 'boolean' ? isVisible : true, // Default to true
        },
      });
      res.status(201).json(newPartnerLogo);
    } catch (error) {
      console.error('Failed to create partner logo:', error);
      if ((error as any).code === 'P2002') { // Unique constraint failed (e.g. if name was unique)
          return res.status(409).json({ message: 'Partner logo with this identifier already exists.', error: (error as Error).message });
      }
      res.status(500).json({ message: 'Failed to create partner logo', error: (error as Error).message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
