import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma'; 
import { getSession } from 'next-auth/react'; 
import type { Session } from 'next-auth'; 

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req }) as Session | null;

  if (!session || !session.user || session.user.role !== 'ADMIN') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const listingId = req.query.id as string;

  if (req.method === 'PUT') {
    try {
      const listing = await prisma.listingBusiness.findUnique({
        where: { listing_business_id: parseInt(listingId, 10) },
      });

      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }

      const updatedListing = await prisma.listingBusiness.update({
        where: { listing_business_id: parseInt(listingId, 10) },
        data: {
          isFeatured: !listing.isFeatured, 
        },
      });

      return res.status(200).json(updatedListing);
    } catch (error) {
      console.error('Error toggling feature status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return res.status(500).json({ message: 'Error toggling feature status', error: errorMessage });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
