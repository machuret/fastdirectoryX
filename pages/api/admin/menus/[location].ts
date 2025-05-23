import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma'; // Assuming prisma client is at lib/prisma
import { Menu, MenuItem } from '@prisma/client'; // Ensure Menu and MenuItem are imported
import { clearMenuCacheForLocation } from '@/lib/menu'; // Added import

// Define a type for the expected structure of a new menu item
interface NewMenuItemData {
  label: string;
  url: string;
  order: number;
  target?: string;
  parentId?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { location } = req.query;

  if (typeof location !== 'string') {
    return res.status(400).json({ message: 'Menu location must be a string.' });
  }

  // Ensure the Menu for this location exists, or create it
  let menu = await prisma.menu.findUnique({
    where: { location },
  });

  if (!menu) {
    menu = await prisma.menu.create({
      data: {
        name: `${location.charAt(0).toUpperCase() + location.slice(1)} Menu`, // e.g., "Header Menu"
        location: location,
      },
    });
  }

  if (req.method === 'GET') {
    try {
      const menuItems = await prisma.menuItem.findMany({
        where: { menu: { location: location } },
        orderBy: [
          { parentId: 'asc' }, 
          { order: 'asc' },
        ],
      });
      res.status(200).json(menuItems);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      res.status(500).json({ message: 'Error fetching menu items', error: (error as Error).message });
    }
  } else if (req.method === 'POST') {
    try {
      const { label, url, order, target, parentId } = req.body as NewMenuItemData;

      if (!label || !url || order === undefined) {
        return res.status(400).json({ message: 'Label, URL, and order are required.' });
      }
      
      const newMenuItem = await prisma.menuItem.create({
        data: {
          label,
          url,
          order: Number(order),
          target: target || null, 
          menuId: menu.id,
          parentId: parentId || null, 
        },
      });

      clearMenuCacheForLocation(location as string); // Clear cache

      res.status(201).json(newMenuItem);
    } catch (error) {
      console.error('Error creating menu item:', error);
      // Basic check for unique constraint violation on order (P2002)
      // This might need to be more specific if 'order' is unique per parent/menu combination
      if ((error as any).code === 'P2002' && (error as any).meta?.target?.includes('order')) {
        return res.status(409).json({ message: 'Order conflict. An item with this order may already exist for this menu/parent.', error: (error as Error).message });
      }
      res.status(500).json({ message: 'Error creating menu item', error: (error as Error).message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
