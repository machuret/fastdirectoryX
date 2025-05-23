// c:\alpha\pages\api\admin\menus\index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { getSession } from 'next-auth/react';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });

  if (!session || !session.user?.isAdmin) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const menus = await prisma.menu.findMany({
        orderBy: {
          name: 'asc',
        },
      });
      return res.status(200).json(menus);
    } catch (error) {
      console.error('Failed to fetch menus:', error);
      return res.status(500).json({ message: 'Failed to fetch menus' });
    }
  } else if (req.method === 'POST') {
    try {
      const { name, location } = req.body;

      if (!name || !location) {
        return res.status(400).json({ message: 'Name and location are required' });
      }

      // Check if location already exists
      const existingMenu = await prisma.menu.findUnique({
        where: { location },
      });

      if (existingMenu) {
        return res.status(409).json({ message: `Menu location '${location}' already exists.` });
      }

      const newMenu = await prisma.menu.create({
        data: {
          name,
          location,
        },
      });
      return res.status(201).json(newMenu);
    } catch (error) {
      console.error('Failed to create menu:', error);
      return res.status(500).json({ message: 'Failed to create menu' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
