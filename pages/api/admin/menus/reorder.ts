import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma'; // Assuming prisma client is here
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]'; // Adjusted path
import { clearMenuCacheForLocation } from '@/lib/menu'; // Added import

interface ReorderItem {
  id: string;
  order: number;
}

interface ReorderRequestBody {
  location: 'header' | 'footer';
  items: ReorderItem[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    const { location, items } = req.body as ReorderRequestBody;

    if (!location || !['header', 'footer'].includes(location)) {
      return res.status(400).json({ message: 'Invalid menu location provided.' });
    }

    if (!items || !Array.isArray(items) || items.some(item => !item.id || typeof item.order !== 'number')) {
      return res.status(400).json({ message: 'Invalid items array provided. Each item must have an id and an order.' });
    }

    try {
      // Ensure all items belong to the specified location before updating for safety, though IDs should be unique.
      // This is a more robust way to update multiple records with different values.
      const updatePromises = items.map(item =>
        prisma.menuItem.update({
          where: { id: item.id }, // Assuming 'id' is unique and sufficient
          // If you need to ensure the item belongs to the location, you might need:
          // where: { id: item.id, location: location }, 
          data: { order: item.order },
        })
      );

      await prisma.$transaction(updatePromises);
      
      // Clear the cache for the updated menu location
      clearMenuCacheForLocation(location);

      return res.status(200).json({ message: `${location} menu reordered successfully.` });
    } catch (error) {
      console.error(`Error reordering ${location} menu:`, error);
      // Check for specific Prisma errors if needed, e.g., P2025 (Record to update not found)
      if (error instanceof Error && 'code' in error && typeof error.code === 'string' && error.code === 'P2025') {
        return res.status(404).json({ message: 'One or more menu items not found. Reorder failed.' });
      }
      return res.status(500).json({ message: `Failed to reorder ${location} menu items.` });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
