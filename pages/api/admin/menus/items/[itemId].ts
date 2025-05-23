// c:\alpha\pages\api\admin\menus\items\[itemId].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { clearMenuCacheForLocation } from '@/lib/menu';

interface UpdateMenuItemData {
  label?: string;
  url?: string;
  order?: number;
  target?: string;
  parentId?: string | null; // Allow unsetting parentId
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { itemId } = req.query;

  if (typeof itemId !== 'string') {
    return res.status(400).json({ message: 'Menu item ID must be a string.' });
  }

  if (req.method === 'PUT') {
    try {
      const { label, url, order, target, parentId } = req.body as UpdateMenuItemData;

      const updateData: any = {};
      if (label !== undefined) updateData.label = label;
      if (url !== undefined) updateData.url = url;
      if (order !== undefined) updateData.order = Number(order);
      // Allow explicitly setting target to an empty string or null
      if (target !== undefined) updateData.target = target === "" ? null : target;
      // Allow explicitly setting parentId to null
      if (parentId !== undefined) updateData.parentId = parentId;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: 'No update data provided.' });
      }

      // Fetch the menu item to get its location for cache clearing
      const menuItemToUpdate = await prisma.menuItem.findUnique({
        where: { id: itemId },
        include: { menu: true }, // Include the related menu to get its location
      });

      if (!menuItemToUpdate || !menuItemToUpdate.menu) {
        return res.status(404).json({ message: `Menu item with ID ${itemId} or its associated menu not found.` });
      }
      const menuLocation = menuItemToUpdate.menu.location;

      const updatedMenuItem = await prisma.menuItem.update({
        where: { id: itemId },
        data: updateData,
      });

      clearMenuCacheForLocation(menuLocation); // Clear cache

      res.status(200).json(updatedMenuItem);
    } catch (error) {
      console.error(`Error updating menu item ${itemId}:`, error);
      // Add specific error handling, e.g., for P2025 (Record not found)
      if ((error as any).code === 'P2025') {
        return res.status(404).json({ message: `Menu item with ID ${itemId} not found.` });
      }
      res.status(500).json({ message: 'Error updating menu item', error: (error as Error).message });
    }
  } else if (req.method === 'DELETE') {
    try {
      // Before deleting, check if this item has children. If so, prevent deletion or handle re-parenting.
      // Our current schema uses onDelete: Cascade for the parent-child relationship,
      // which means deleting a parent WILL delete its children. This might be desired,
      // or you might want to prevent deleting parents with children directly via the API.
      // For now, we'll rely on the cascade, but this is a point for future refinement if needed.

      // Fetch the menu item to get its location for cache clearing
      const menuItemToDelete = await prisma.menuItem.findUnique({
        where: { id: itemId },
        include: { menu: true }, // Include the related menu to get its location
      });

      if (!menuItemToDelete || !menuItemToDelete.menu) {
        // If item not found, it might have already been deleted or never existed.
        // We can still try to clear caches if a general location might be affected,
        // or simply return 404 if we're strict.
        // For now, let's assume if it's not found, no specific cache needs clearing based on its location.
        return res.status(404).json({ message: `Menu item with ID ${itemId} or its associated menu not found for deletion.` });
      }
      const menuLocation = menuItemToDelete.menu.location;

      await prisma.menuItem.delete({
        where: { id: itemId },
      });

      clearMenuCacheForLocation(menuLocation); // Clear cache

      res.status(204).end(); // No content, successful deletion
    } catch (error) {
      console.error(`Error deleting menu item ${itemId}:`, error);
      if ((error as any).code === 'P2025') {
        return res.status(404).json({ message: `Menu item with ID ${itemId} not found.` });
      }
      res.status(500).json({ message: 'Error deleting menu item', error: (error as Error).message });
    }
  } else {
    res.setHeader('Allow', ['PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
