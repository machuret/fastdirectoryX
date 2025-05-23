import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
// import { getSession } from 'next-auth/react'; // Uncomment and use if admin authentication is required

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Example: Add authentication check if this should be a protected route
  /*
  const session = await getSession({ req });
  if (!session || !session.user) { // Potentially check for an admin role on session.user
    return res.status(401).json({ message: 'Unauthorized' });
  }
  */

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.some(id => typeof id !== 'string' && typeof id !== 'number')) {
    return res.status(400).json({ message: 'Invalid input: "ids" must be an array of strings or numbers.' });
  }

  if (ids.length === 0) {
    return res.status(200).json({ message: 'No IDs provided for deletion.', count: 0 });
  }

  try {
    // Convert string/number IDs from frontend to number for Prisma query
    const idsAsNumbers = ids.map(id => {
      const numId = parseInt(String(id), 10);
      if (isNaN(numId)) {
        throw new Error(`Invalid ID format: '${id}'. All IDs must be convertible to a number.`);
      }
      return numId;
    });

    const deleteResult = await prisma.listingBusiness.deleteMany({
      where: {
        listing_business_id: { // Use the primary key for ListingBusiness
          in: idsAsNumbers,
        },
      },
    });

    return res.status(200).json({ message: `${deleteResult.count} listings deleted successfully.`, count: deleteResult.count });
  } catch (error: any) {
    console.error('Error bulk deleting listings:', error);
    if (error.message.startsWith('Invalid ID format')) {
        return res.status(400).json({ message: error.message });
    }
    // Handle potential Prisma errors, e.g., foreign key constraints if listings are related to other data
    // Prisma error P2003: Foreign key constraint failed on the field: `...`
    if (error.code === 'P2003' || (error.meta && error.meta.field_name)) {
        return res.status(409).json({ message: 'Failed to delete some listings. They may have related data (e.g., reviews, categories) that prevent deletion. Please ensure related data is handled or deleted first.', error: error.message });
    }
    return res.status(500).json({ message: 'An error occurred while deleting listings.', error: error.message });
  }
}
